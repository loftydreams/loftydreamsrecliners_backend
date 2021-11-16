const express = require("express");
const https = require("https");
const PaytmChecksum = require("paytmchecksum");
const { db } = require("../helpers/firebase-admin");

const router = express.Router();

router.post("/api/callback", async (req, res) => {
  let body = "";
  req.on("data", function (data) {
    body += data;
  });
  req.on("end", async () => {
    const values = new URLSearchParams(body);
    let paytmChecksum = "";
    const paytmTxnData = {};
    values.forEach((value, key) => {
      if (key === "CHECKSUMHASH") {
        paytmChecksum = value;
      } else {
        paytmTxnData[key] = value;
      }
    });

    const isValidChecksum = PaytmChecksum.verifySignature(
      paytmTxnData,
      process.env.PAYTM_MKEY,
      paytmChecksum
    );
    if (!isValidChecksum) {
      res.redirect(`${process.env.CLIENT_URL}/payment?success=false`);
    } else {
      const paytmParams = {};
      paytmParams.body = {
        mid: process.env.PAYTM_MID,
        orderId: paytmTxnData.ORDERID,
      };

      const checksum = await PaytmChecksum.generateSignature(
        JSON.stringify(paytmParams.body),
        process.env.PAYTM_MKEY
      );

      paytmParams.head = {
        signature: checksum,
      };

      const post_data = JSON.stringify(paytmParams);
      var options = {
        /* for Staging */
        // hostname: "securegw-stage.paytm.in",
        /* for Production */
        // hostname: 'securegw.paytm.in',
        hostname: process.env.HOSTNAME,
        port: 443,
        path: "/v3/order/status",
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

        post_res.on("end", async function () {
          const status = JSON.parse(response).body;
          const orderRef = db.collection("orders").doc(status.orderId);
          await orderRef.update({
            paymentStatus: status.resultInfo,
          });
          if (status.resultInfo.resultStatus === "TXN_SUCCESS") {
            res.redirect(
              `${process.env.CLIENT_URL}/payment/status?success=true&orderId=${status.orderId}`
            );
          } else {
            res.redirect(
              `${process.env.CLIENT_URL}/payment/status?success=false&orderId=${status.orderId}`
            );
          }
        });
      });
      post_req.write(post_data);
      post_req.end();
    }
  });
});

module.exports = { callbackRouter: router };
