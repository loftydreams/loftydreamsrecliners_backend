const express = require("express");
const https = require("https");
const PaytmChecksum = require("paytmchecksum");
const { calcPrice } = require("../helpers/calc-price");
const { firebaseAdmin, db } = require("../helpers/firebase-admin");
const { verifyOrderData } = require("../helpers/verify-order-data");

const router = express.Router();

router.post("/api/paynow", async (req, res) => {
  const orderData = req.body;
  let authData = {};
  try {
    const { uid, email: usermail } = await firebaseAdmin
      .auth()
      .verifyIdToken(orderData.idToken);

    authData["uid"] = uid;
    authData["usermail"] = usermail;
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized access!" });
  }

  const verifiedOrderData = verifyOrderData(orderData);

  if (!verifiedOrderData) {
    return res.status(400).json({ message: "Invalid data provided!" });
  }

  let updatedItems = [];
  let totalPrice = 0;
  try {
    const items = await calcPrice(verifiedOrderData.itemsToPurchase);
    updatedItems = items.updatedItems;
    totalPrice = items.totalPrice;
  } catch (error) {
    return res.status(400).json({ message: "Invalid products data!" });
  }

  let orderId = "";
  try {
    const newOrderRef = db.collection("orders").doc();
    orderId = newOrderRef.id;
    const newOrder = {
      userId: authData.uid,
      userMail: authData.usermail,
      customerDetails: verifiedOrderData.customerData,
      shippingAddress: verifiedOrderData.shippingAddress,
      items: updatedItems,
      totalPrice,
      paymentStatus: {
        resultStatus: "PENDING",
        resultMsg: "Payment is not completed.",
      },
    };
    await newOrderRef.set(newOrder);
  } catch (error) {
    return res.status(400).json({ message: "Unable to save order." });
  }

  let paytmParams = {};

  paytmParams.body = {
    requestType: "Payment",
    mid: process.env.PAYTM_MID,
    websiteName: process.env.PAYTM_WEBSITE,
    orderId: orderId,
    callbackUrl: `${process.env.SERVER_URL}/api/callback`,
    txnAmount: {
      value: totalPrice,
      currency: "INR",
    },
    userInfo: {
      custId: authData.uid,
    },
  };

  const checksum = await PaytmChecksum.generateSignature(
    JSON.stringify(paytmParams.body),
    process.env.PAYTM_MKEY
  );

  paytmParams.head = {
    signature: checksum,
  };

  const post_data = JSON.stringify(paytmParams);
  const options = {
    /* for Staging */
    // hostname: "securegw-stage.paytm.in",
    /* for Production */
    // hostname: 'securegw.paytm.in',
    hostname: process.env.HOSTNAME,
    port: 443,
    path: `/theia/api/v1/initiateTransaction?mid=${process.env.PAYTM_MID}&orderId=${paytmParams.body.orderId}`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": post_data.length,
    },
  };

  let response = "";
  const post_req = https.request(options, function (post_res) {
    post_res.on("data", function (chunk) {
      response += chunk;
    });

    post_res.on("end", function () {
      res.json({
        token: JSON.parse(response).body.txnToken,
        orderId: paytmParams.body.orderId,
        amount: paytmParams.body.txnAmount.value,
        tokenType: "TXN_TOKEN",
        userDetail: {
          custId: authData.uid,
        },
      });
    });
  });
  post_req.write(post_data);
  post_req.end();
});

module.exports = { paynowRouter: router };
