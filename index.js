require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { paynowRouter } = require("./routes/paynow");
const { callbackRouter } = require("./routes/callback");

const app = express();

app.use(express.json());
app.use(cors());
// app.use(
//   cors({
//     origin: process.env.CLIENT_URL,
//   })
// );
app.use(helmet());
app.use(helmet.hidePoweredBy());

// routes
app.use(paynowRouter);
app.use(callbackRouter);

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
