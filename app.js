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
const crypto = require("crypto");
const {
  MCID,
  MCC,
  SHOPCODE,
  MC_ENG,
  CCY,
  COUNTRY,
  PROVINCE,
  SERECT_KEY,
  JWT_SECRET,
} = process.env;
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
  const { amount, remark, billId, drawId } = data;
  const { invoiceId, lotteryDate } = req.data;
  const onePay = new OnePay({
    userId: MC_ENG,
    mcid: MCID,
    subKey: SubscribeKey,
  });

  onePay.debug = false;
  const iid = `${lotteryDate}_${invoiceId}_buyLottery`;
  console.log("billId", billId);
  onePay.getCode(
    {
      mcc: MCC,
      uuid: billId, // เปลี่ยนเป็น bill id จาก lotlink
      invoiceid: iid, // a invoice ID can pay many times OR have many transaction ID
      terminalid: drawId, // งวด ID
      amount: amount === 0 ? 0 : 1, // invoice amount
      description: remark, // must define as English text
      expiretime: 5, // expire time must be minutes
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
      uuid: billId, // please define as unique key
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
    const mcid = process.env.MCID;
    const refundId = dayjs().format("YYYYMMDDHHmmss");
    const refundAmount = 1;
    const uuid = "25038FYDNY4KMH61873644735";
    const privateKey = process.env.BCEL_Private_key;
    const rawData = mcid + uuid + refundId;
    const base64Data = signDataRaw(rawData, privateKey);

    console.log("base64Data", base64Data);
    // const jsonData = JSON.stringify(data);
    // const hash = crypto.createHash("sha256");
    // hash.update(jsonData);
    // const hashBase64 = hash.digest("base64");

    const data = {
      mcid: mcid,
      uuid: uuid,
      refundid: refundId,
      refundamount: refundAmount,
      signature: base64Data,
    };
    console.log(data);
    const resAxios = await axios({
      method: "POST",
      url: "https://bcel.la:8083/onepay/refund.php",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: data,
      validateStatus: () => true,
    });
    console.log("resAxios.data", resAxios.data);
    res.json({
      data: base64Data,
    });
  } catch (error) {
    console.log("error", error);
    res
      .status(500)
      .json({ error: "Internal server error", data: error.message });
  }
});
app.post("/void", async (req, res) => {
  try {
    const mcid = process.env.MCID;
    const refundAmount = 1;
    const uuid = "25038FYDNY4KMH61873644735";
    const privateKey = process.env.BCEL_Private_key;
    const rawData = mcid + uuid;
    const base64Data = signDataRaw(rawData, privateKey);

    console.log("base64Data", base64Data);
    // const jsonData = JSON.stringify(data);
    // const hash = crypto.createHash("sha256");
    // hash.update(jsonData);
    // const hashBase64 = hash.digest("base64");

    const data = {
      mcid: mcid,
      uuid: uuid,
      signature: base64Data,
    };
    console.log(data);
    const resAxios = await axios({
      method: "POST",
      url: "https://bcel.la:8083/onepay/void.php",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: data,
      validateStatus: () => true,
    });
    console.log("resAxios.data", resAxios.data);
    res.json({
      data: base64Data,
    });
  } catch (error) {
    console.log("error", error);
    res
      .status(500)
      .json({ error: "Internal server error", data: error.message });
  }
});
app.post("/reward", async (req, res) => {
  try {
    const mcid = process.env.MCID;
    const refundAmount = 1;

    const privateKey = process.env.BCEL_Private_key;

    const data = {
      nonce: new Date().getTime(),
      app: "CK",
      // app: MC_ENG,
      command: "reward",
      uuid: `25036S9XP4Y3LGC7094711915`,
      username: "+8562098512548", // เบอร์เก่ากี้
      amount: 1,
    };

    const hexEncode = signHexData(data, privateKey);

    console.log("data", data);
    const resAxios = await axios({
      method: "POST",
      url: "https://bcel.la:8083/onepaylotto.php",
      // url: "http://localhost:3021/test",
      headers: {
        Signature: hexEncode,
        "Content-Type": "application/json",
      },
      data,
      // validateStatus: () => true,
    });
    console.log("resAxios.data", resAxios.data);
    res.json({
      data: hexEncode,
    });
  } catch (error) {
    // console.log("error", error.message);
    res
      .status(500)
      .json({ error: "Internal server error", data: error.message });
  }
});

app.listen(port, () => {
  const onePay = new OnePay({
    mcid: MCID,
    subKey: SubscribeKey,
  });

  // var onePay = new OnePay(MCID);
  onePay.debug = true;

  onePay.subscribe(subParams, async (res) => {
    try {
      if (res.iid) {
        const [lotteryDate, invoiceId, type] = res.iid.split("_");
        if (type === "buyLottery") {
          const callbackUrl = genCallBackTokenSummary(
            invoiceId,
            lotteryDate,
            res.fccref
          );
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
    } catch (error) {
      console.error("BCEL error", error.message);
    }
  });

  console.log(`Example app listening on port ${port}`);
});

const genCallBackTokenSummary = (invoiceId, lotteryDate, fccref) => {
  const expire = dayjs().add(10, "minute");
  const token = jwt.sign(
    {
      invoiceId: invoiceId,
      lotteryDate: lotteryDate,
      bankRef: fccref,
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

function signData(mcid, uuid, refundid, privateKey) {
  const data = {
    mcid: mcid,
    uuid: uuid,
    refundid: refundid,
  };

  const bufferData = Buffer.from(JSON.stringify(data), "utf8");
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(bufferData, "utf8");
  signer.end();

  const signature = signer.sign(privateKey, "base64");
  return signature;
}

function signHexData(body, privateKey) {
  const jsonString = JSON.stringify(body);
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(jsonString, "utf8");
  signer.end();

  const signatureHex = signer.sign(privateKey).toString("hex");
  return signatureHex;
}

function signDataRaw(rawData, privateKey) {
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(rawData, "utf8");
  signer.end();

  const signature = signer.sign(privateKey, "base64");
  return signature;
}

//     const publicKey = `-----BEGIN PUBLIC KEY-----
// MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtr7CytCL3v2yjtmJOtoF
// W2mcc0jOkOOWlIB8nJXNz3fg9Q2mLdMn2EDq5XxZnEqcfUj6dSrK/tjQ+f6+UV4h
// 9q1MOHhVPNEi8XmeMJ0aO9TpyhjRbvgIKGl+dcWRkAwTq+/nOH2zMsb9Thio60Hg
// uXAbj8u1WfrbOpwUgz2z0rzTbHyScrlhEZYx/UWMJAkbuOxuUHKihy5tiz22I7KB
// MqbrXmA62mx7EFOnEk0MVbBUqz6tHkSRRGRhHXzZtD52MufHq1ZNWUeex/Ov91mI
// V6I8SFqlPPoICNkW/wRIRD+LfVd3M1Thx7qOaWZML9FfB/vCD9NeYzua1Kd8659P
// CwIDAQAB
// -----END PUBLIC KEY-----`;
// const ve = verifySignature(mcid, uuid, refundId, base64Data, publicKey);
// console.log("ve", ve);

function verifySignature(mcid, uuid, refundid, signature, publicKey) {
  const data = {
    mcid: mcid,
    uuid: uuid,
    refundid: refundid,
  };
  const bufferData = Buffer.from(JSON.stringify(data), "utf8");
  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(bufferData, "utf8");
  verifier.end();

  return verifier.verify(publicKey, signature, "base64");
}
