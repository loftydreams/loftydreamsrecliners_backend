const firebaseAdmin = require("firebase-admin");

if (!firebaseAdmin.apps.length) {
  firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert({
      // type: process.env.FBA_TYPE,
      projectId: process.env.FBA_PROJECT_ID,
      // private_key_id: process.env.FBA_PRIVATE_KEY_ID,
      privateKey: process.env.FBA_PRIVATE_KEY.replace(/\\n/g, "\n"),
      clientEmail: process.env.FBA_CLIENT_EMAIL,
      // client_id: process.env.FBA_CLIENT_ID,
      // auth_uri: process.env.FBA_AUTH_URI,
      // token_uri: process.env.FBA_TOKEN_URI,
      // auth_provider_x509_cert_url: process.env.FBA_AUTH_PROVIDER_CERT_URL,
      // client_x509_cert_url: process.env.FBA_CLIENT_CERT_URL,
    }),
    databaseURL: `https://${process.env.FBA_PROJECT_ID}.firebaseio.com`,
  });
}

const db = firebaseAdmin.firestore();

module.exports = { firebaseAdmin, db };
