const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.get('/pay', async (req, res) => {
    try {
        // orderId を一意に生成
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

        const requestBody = { params, authHash };

        // バイナリとして受け取る（Shift_JISのため）
        const response = await axios.post(
            'https://api3.veritrans.co.jp/test-paynow/v2/Authorize/paypay',
            requestBody,
            {
                headers: { 'Content-Type': 'application/json' },
                responseType: 'arraybuffer' // バイナリで受け取るのが重要！
            }
        );

        // そのまま Shift_JIS でクライアントに返す（画面遷移させる）
        res.set('Content-Type', 'text/html; charset=Shift_JIS');
        res.send(Buffer.from(response.data));
    } catch (err) {
        console.error('❌ エラー:', err.message);
        res.status(500).send('サーバーエラーが発生しました');
    }
});

app.listen(PORT, () => {
    console.log(`🚀 サーバー起動: http://localhost:${PORT}/pay`);
});
