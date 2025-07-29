const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
const path = require('path');
const iconv = require('iconv-lite');
require('dotenv').config();

const app = express();
const PORT = 3000;

// 静的ファイル（views フォルダ）を有効に
app.use(express.static(path.join(__dirname, 'views')));
app.use(express.urlencoded({ extended: true }));

// トップページ：決済ボタン付きHTMLを表示
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// POST /pay → PayPay決済APIへリクエスト
app.post('/pay', async (req, res) => {
    try {
        // 一意な orderId を生成
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

        // Shift-JIS対応でレスポンス受け取り
        const response = await axios.post(
            'https://api3.veritrans.co.jp/test-paynow/v2/Authorize/paypay',
            requestBody,
            {
                headers: { 'Content-Type': 'application/json' },
                responseType: 'arraybuffer' // ←バイナリで取得
            }
        );

        const text = iconv.decode(response.data, 'Shift_JIS');

        // JSONエラーかHTMLかを判定
        if (text.trim().startsWith('{')) {
            // JSON（エラー応答）
            const json = JSON.parse(text);
            console.log('🟡 JSONエラー応答:', json);

            // merrMsg 再デコード（文字化け防止）
            const sjisBuffer = Buffer.from([...json.result.merrMsg].map(c => c.charCodeAt(0)));
            const merrMsg = iconv.decode(sjisBuffer, 'Shift_JIS');

            res.status(400).send(`
                <h1>決済エラー</h1>
                <p><strong>コード:</strong> ${json.result.vResultCode}</p>
                <p><strong>内容:</strong> ${merrMsg}</p>
            `);
        } else {
            // HTML（正常遷移）
            console.log('🟢 HTML応答（Shift-JISのまま返却）');
            res.set('Content-Type', 'text/html; charset=Shift_JIS');
            res.send(response.data); // ← decode せずそのまま返す
        }

    } catch (err) {
        console.error('❌ 決済処理例外:', err.message);
        res.status(500).send('サーバーエラーが発生しました');
    }
});

app.listen(PORT, () => {
    console.log(`✅ サーバー起動: http://localhost:${PORT}`);
});
