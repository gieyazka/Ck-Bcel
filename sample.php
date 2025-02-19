<?php

$uuid = @$_GET["uuid"]; // transaction id ((please define as unique key))
$tid = @$_GET["tid"]; // terminal ID (in case have many terminals, POS devices or etc...)

if (!$uuid) exit("Please set uuid in GET parameter");

// Bank provide these data
$mcid = "mch5c2f0404102fb"; // merchant id
$mcc = "5732"; // merchant category code
$shopcode = "12345678"; // shop code
$ccy = 418; // currency LAK
$country = "LA";
$province = "VTE";

?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <title>OnePay Callback Receiver</title>
    <script src="https://code.jquery.com/jquery-3.4.1.min.js"></script>
    <script src="https://cdn.pubnub.com/sdk/javascript/pubnub.4.27.3.js"></script>
    <script src="onepay.js"></script>
    <style type="text/css">
        .container {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            min-width: 400px;
            text-align: center;
            border-radius: 5px;
            background-color: #f7f7f7;
            padding: 40px 20px;
            box-shadow: 0 0 8px #333;
        }

        .container .qr-code {
            border: 3px solid #bb1111;
            border-radius: 5px;
        }

        #callback {
            text-align: left;
            display: none;
        }

        pre {
            outline: 1px solid #ccc;
            padding: 5px;
            margin: 5px;
            height: 150px;
            overflow-x: none;
            overflow-y: scroll;
            display: block;
        }

        .button {
            margin-top: 30px;
        }

        .button a {
            background-color: #bb1111;
            color: #fff;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 3px;
            box-shadow: 0px 2px 3px #ccc;
        }
    </style>
    <script>
        $(function () {
            var mcid = "<?= $mcid ?>"; // merchant id
            var shopcode = "<?= $shopcode ?>"; // shop code
            var uuid = "<?= $uuid ?>"; // transaction id (please define as unique key)
            var onePay = new OnePay(mcid); // create new OnePay instance
            onePay.debug = true; // enable OnPay debug(Please looking on console log)

            /* generate new QR code via onepay.js */
            onePay.getCode({
                transactionid: uuid, // please define as unique key
                invoiceid: '123', // a invoice ID can pay many times OR have many transaction ID
                terminalid: '001', // terminal ID (in case have many terminals, POS devices or etc...)
                amount: 1, // invoice amount
                description: 'Test', // must define as English text
                expiretime: 15, // expire time must be minutes
            }, function (code) {
                $('.qr-code').attr('src', 'https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=' + code + '&choe=UTF-8'); // set QR code into image, Scan to pay
                $('.one-click-pay').attr('href', 'onepay://qr/' + code) // set QR code into button, One click pay(payment link) for mobile app integration
            });

            /* define subscribe parameter(s) */
            var subParams = {
                uuid: uuid, // please specified uuid if would like to receive callback data only the transaction (for front-end subscribe)
                shopcode: null, // please specified shopcode if would link to receive all callback for the merchant ID (for back-end subscribe)
                tid: null // please specified tid(terminal ID) and shopcode if would link to receive all callback for the merchant ID and specific terminal (for terminal subscribe)
            };
            /* subscribe to receiving OnePay callback*/
            onePay.subscribe(subParams, function (res) {
                if (res.uuid === uuid) {
                    document.getElementById("status").innerText = "The QR Code is Paid";
                    document.getElementById("result").innerText = JSON.stringify(res, undefined, 2);
                    document.getElementById("callback").style.display = "block";
                    document.getElementById("qrcode").style.display = "none";
                    document.getElementById("paymessage").style.display = "none";

                    var s = document.getElementById("success");
                    s.style.width = "200px";
                    s.style.height = "200px";
                }
            });
        })
    </script>
</head>
<body>
<div class="container">
    <h1>OnePay Dynamic QR</h1>
    <img id="success" src="https://www.freeiconspng.com/uploads/success-icon-10.png" style="width: 1px; height: 1px"/>
    <div id="qrcode">
        <img class="qr-code">
    </div>


    <p id="paymessage">Scan or Click to pay and see the result</p>
    <p id="status"></p>

    <div id="callback">
        <span>Callback Result:</span>
        <pre id="result"></pre>
    </div>
    <div class="button">
        <a class="one-click-pay">One Click Pay</a>
    </div>
</div>
</body>
</html>