const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { OnePay } = require("./onepay");
const { OnePay: OnePayOld } = require("./onepay-old");
const { SubscribeKey } = process.env;
const dayjs = require("dayjs");
const axios = require("axios");
const app = express();
const port = 3001;
const jwt = require("jsonwebtoken");
const { MCID, MCC, SHOPCODE, CCY, COUNTRY, PROVINCE, SERECT_KEY, JWT_SECRET } =
  process.env;
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Hello World!");
});
var subParams = {
  // uuid: uuid, // please specified uuid if would like to receive callback data only the transaction (for front-end subscribe)
  shopcode: SHOPCODE, // please specified shopcode if would link to receive all callback for the merchant ID (for back-end subscribe)
  tid: null, // please specified tid(terminal ID) and shopcode if would link to receive all callback for the merchant ID and specific terminal (for terminal subscribe)
};
app.use((req, res, next) => {
  // req.data = req.body
  // next();

  const bearerToken = req.headers["authorization"];
  if (!bearerToken) {
    return res.status(403).send("No token provided");
  }
  const token = bearerToken.split(" ")[1];
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
  const { amount, remark,billId  ,drawId} = data;
  const { invoiceId, lotteryDate } = req.data;
  const onePay = new OnePay({
    mcid: MCID,
    subKey: SubscribeKey,
  });

  onePay.debug = false;
  const  iid = `${lotteryDate}_${invoiceId}_buyLottery`
  onePay.getCode(
    {
      uuid: billId, // เปลี่ยนเป็น bill id จาก lotlink
      invoiceid: iid, // a invoice ID can pay many times OR have many transaction ID
      terminalid: drawId,// งวด ID
      amount: amount === 0 ? 0 : 1, // invoice amount
      description: remark, // must define as English text
      expiretime: 30, // expire time must be minutes
    },
    function (code) {
      console.log("code", code);
      res.json({
        uuid: billId,
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

app.post("/genQrTopup", async (req, res) => {
  const data = req.body;
  const { amount, remark, billId } = data;
  const { invoiceId, lotteryDate } = req.data;
  const onePay = new OnePay({
    mcid: MCID,
    subKey: SubscribeKey,
  });

  onePay.debug = false;
  const iid = `${lotteryDate}_${invoiceId}_topup`;
  onePay.getCode(
    {

      uuid:  billId, // please define as unique key
      invoiceid: iid, // a invoice ID can pay many times OR have many transaction ID
      // terminalid: "001", // terminal ID (in case have many terminals, POS devices or etc...)
      amount: amount === 0 ? 0 : 1, // invoice amount
      // amount: amount, // invoice amount
      description: remark, // must define as English text
      expiretime: 30, // expire time must be minutes
    },
    function (code) {
      res.json({
        uuid: billId,
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


app.post("/refund", async (req, res) => {

  try {
    
  } catch (error) {
    
  }


})

app.listen(port, () => {
  const onePay = new OnePay({
    mcid: MCID,
    subKey: SubscribeKey,
  });

  // var onePay = new OnePay(MCID);
  onePay.debug = true;

  onePay.subscribe(subParams, async (res) => {
    console.log("res from pubnub", res);
    if (res.iid) {
      const [lotteryDate, invoiceId, type] = res.iid.split("_");
      if (type === "buyLottery") {
        const callbackUrl = genCallBackTokenSummary(invoiceId, lotteryDate , res.fccref);
        await axios.get(
          `${process.env.CK_BACKEND}/api/summary?payload=${callbackUrl}`
        );

        return;
      } else if (type === "topup") {
        const callbackUrl = genCallBackTopupTokenSummary(invoiceId);
        await axios.get(
          `${process.env.CK_BACKEND}/api/topup/summary?payload=${callbackUrl}`
        );
      }
    }
  });

  console.log(`Example app listening on port ${port}`);
});


const genCallBackTokenSummary = (invoiceId, lotteryDate , fccref ) => {
  const expire = dayjs().add(10, "minute");
  const token = jwt.sign(
    {
      invoiceId: invoiceId,
      lotteryDate: lotteryDate,
      fccref: fccref,
      expire: expire.unix(),

    },
    JWT_SECRET,
    {
      algorithm: "HS384",
    }
  );

  return token;
};

const genCallBackTopupTokenSummary = (invoiceId) => {
  const expire = dayjs().add(10, "minute");
  const token = jwt.sign(
    {
      invoiceId: invoiceId,
      expire: expire.unix(),
    },
    JWT_SECRET,
    {
      algorithm: "HS384",
    }
  );

  return token;
};
