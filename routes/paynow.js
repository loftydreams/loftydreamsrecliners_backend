const express = require("express");
const https = require("https");
const PaytmChecksum = require("paytmchecksum");

const router = express.Router();

router.post("/api/paynow", async (req, res) => {
  const { name, email, phone } = req.body;

  let paytmParams = {};

  paytmParams.body = {
    requestType: "Payment",
    mid: process.env.PAYTM_MID,
    websiteName: process.env.PAYTM_WEBSITE,
    orderId: new Date().getTime().toString(),
    callbackUrl: "http://localhost:3001/api/callback",
    txnAmount: {
      value: "1.00",
      currency: "INR",
    },
    userInfo: {
      custId: email,
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
    hostname: "securegw-stage.paytm.in",
    /* for Production */
    // hostname: 'securegw.paytm.in',
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
          custId: email,
        },
      });
    });
  });
  post_req.write(post_data);
  post_req.end();
});

module.exports = { paynowRouter: router };
