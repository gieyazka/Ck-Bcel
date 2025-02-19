const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { OnePay } = require("./onepay");
const app = express();
const port = 3001;
const jwt = require("jsonwebtoken");
const { MCID, MCC, SHOPCODE, CCY, COUNTRY, PROVINCE, SERECT_KEY } = process.env;
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Hello World!");
});
console.log("MCID", MCID);

app.use((req, res, next) => {
  // next();

  const bearerToken = req.headers["authorization"];
  if (!bearerToken) {
    return res.status(403).send("No token provided");
  }
  const token = bearerToken.split(" ")[1];
  console.log("token", token);
  jwt.verify(
    token,
    SERECT_KEY,
    {
      algorithms: ["HS384"],
    },
    (err, decoded) => {
      if (err) {
        console.error(err);
        return res.status(401).send("Unauthorized");
      }
      req.data = decoded;
      next();
    }
  );
});

app.post("/genQr", async (req, res) => {
  const data = req.body;
  const { amount, remark, billId } = data;
  const { invoiceId, lotteryDate } = req.data;
  var onePay = new OnePay(MCID);
  onePay.debug = false;

  onePay.getCode(
    {
      transactionid: `${lotteryDate}_${invoiceId}`, // please define as unique key
      invoiceid: billId, // a invoice ID can pay many times OR have many transaction ID
      // terminalid: "001", // terminal ID (in case have many terminals, POS devices or etc...)
      amount: 1, // invoice amount
      // amount: amount, // invoice amount
      description: remark, // must define as English text
      expiretime: 30, // expire time must be minutes
    },
    function (code) {
      console.log('uuid', `${lotteryDate}_${invoiceId}`)
      console.log("code", code);
      res.json({
        uuid: `${lotteryDate}_${invoiceId}`,
        qr:
          "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" +
          code,
        // +"&choe=UTF-8",
        deeplink: "onepay://qr/" + code,
      });
      // $(".qr-code").attr(
      //   "src",
      //   "https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=" +
      //     code +
      //     "&choe=UTF-8"
      // ); // set QR code into image, Scan to pay
      // $(".one-click-pay").attr("href", "onepay://qr/" + code); // set QR code into button, One click pay(payment link) for mobile app integration
    }
  );
});

app.listen(port, () => {
  var onePay = new OnePay(MCID);
  onePay.debug = true;
  var subParams = {
    // uuid: uuid, // please specified uuid if would like to receive callback data only the transaction (for front-end subscribe)
    shopcode: SHOPCODE, // please specified shopcode if would link to receive all callback for the merchant ID (for back-end subscribe)
    tid: null, // please specified tid(terminal ID) and shopcode if would link to receive all callback for the merchant ID and specific terminal (for terminal subscribe)
  };
  onePay.subscribe(subParams, (res) => {
    console.log("res from pubnub", res);
  });

  console.log(`Example app listening on port ${port}`);
});
