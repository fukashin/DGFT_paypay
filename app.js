const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.get('/pay', async (req, res) => {
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

        // ✅ PayPay API 実行（arraybufferでHTMLをそのまま受け取る）
        const response = await axios.post(
            'https://api3.veritrans.co.jp/test-paynow/v2/Authorize/paypay',
            requestBody,
            {
                headers: { 'Content-Type': 'application/json' },
                responseType: 'arraybuffer' // Shift_JIS 対応に必要
            }
        );

        // ✅ HTMLコンテンツをShift_JISでそのまま返却（遷移用JS入り）
        res.set('Content-Type', 'text/html; charset=Shift_JIS');
        res.send(Buffer.from(response.data));

    } catch (err) {
        console.error('❌ エラー:', err.message);
        res.status(500).send('エラーが発生しました');
    }
});

app.listen(PORT, () => {
    console.log(`🚀 サーバー起動中: http://localhost:${PORT}/pay`);
});
