const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
const path = require('path');
const iconv = require('iconv-lite');
require('dotenv').config();

const app = express();
const PORT = 3000;

// 静的ファイル（views）を有効に
app.use(express.static(path.join(__dirname, 'views')));
app.use(express.urlencoded({ extended: true })); // POST用

// ① トップページ：決済ボタンを表示
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// ② POST /pay → PayPay決済開始
app.post('/pay', async (req, res) => {
    try {
        const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
        const randomStr = crypto.randomBytes(3).toString('hex');
        const orderId = `order-${timestamp}-${randomStr}`;

        const merchantCcid = process.env.MERCHANT_CCID;
        const merchantKey = process.env.MERCHANT_KEY;

        const params = {
            orderId,
            serviceOptionType: "online",
            accountingType: "0",
            amount: "1000",
            itemName: "テスト商品",
            itemId: "item001",
            successUrl: "https://example.com/success",
            cancelUrl: "https://example.com/cancel",
            errorUrl: "https://example.com/error",
            pushUrl: "https://example.com/push",
            transitionType: "1",
            extendParameterType: "0",
            txnVersion: "2.0.0",
            dummyRequest: 1,
            merchantCcid
        };

        const rawString = merchantCcid + JSON.stringify(params) + merchantKey;
        const authHash = crypto.createHash('sha256').update(rawString, 'utf8').digest('hex');

        const requestBody = {
            params,
            authHash
        };

        const response = await axios.post(
            'https://api3.veritrans.co.jp/test-paynow/v2/Authorize/paypay',
            requestBody,
            {
                headers: { 'Content-Type': 'application/json' },
                responseType: 'arraybuffer'
            }
        );

        const htmlContent = iconv.decode(response.data, 'Shift_JIS');

        res.set('Content-Type', 'text/html; charset=utf-8');
        res.send(htmlContent);

    } catch (err) {
        console.error('❌ 決済エラー:', err.message);
        res.status(500).send('決済エラーが発生しました');
    }
});

app.listen(PORT, () => {
    console.log(`✅ サーバー起動: http://localhost:${PORT}`);
});
