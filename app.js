const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.get('/pay', async (req, res) => {
    try {
        // 📦 リクエストボディを生成
        const merchantCcid = process.env.MERCHANT_CCID;
        const merchantKey = process.env.MERCHANT_KEY;

        const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
        const randomStr = Math.random().toString(36).substring(2, 8);
        const orderId = `order-${timestamp}-${randomStr}`;

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

        const minifiedParams = JSON.stringify(params);
        const rawString = merchantCcid + minifiedParams + merchantKey;
        const authHash = require('crypto').createHash('sha256').update(rawString, 'utf8').digest('hex');

        const response = await axios.post(
            'https://api3.veritrans.co.jp/test-paynow/v2/Authorize/paypay',
            { params, authHash },
            { headers: { 'Content-Type': 'application/json' } }
        );

        const htmlContent = response.data?.result?.responseContents;
        if (!htmlContent) {
            throw new Error('responseContents が存在しません');
        }

        // ✅ 即時レスポンスとしてHTMLを返却（Shift_JISで）
        res.set('Content-Type', 'text/html; charset=Shift_JIS');
        res.send(htmlContent);

    } catch (err) {
        console.error('❌ エラー:', err.message);
        res.status(500).send(`<h1>エラーが発生しました</h1><p>${err.message}</p>`);
    }
});

app.listen(PORT, () => {
    console.log(`🚀 http://localhost:${PORT}/pay にアクセスして決済画面へ`);
});
