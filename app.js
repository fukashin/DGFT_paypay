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

        // PayPay APIへリクエスト送信
        const response = await axios.post(
            'https://api3.veritrans.co.jp/test-paynow/v2/Authorize/paypay',
            requestBody,
            {
                headers: { 'Content-Type': 'application/json' },
                responseType: 'arraybuffer' // バイナリデータとして受信
            }
        );

        // レスポンスをShift-JISからUTF-8にデコード
        const responseText = iconv.decode(response.data, 'Shift_JIS');

        console.log('PayPay APIレスポンス:', responseText);

        // JSONレスポンス（エラー）かHTMLレスポンス（成功）かを判定
        if (responseText.trim().startsWith('{')) {
            // JSONエラーレスポンスの場合
            const jsonResponse = JSON.parse(responseText);
            console.log('🟡 PayPay APIエラー:', jsonResponse);

            // エラーコードに基づいて日本語メッセージを生成
            const vResultCode = jsonResponse.result?.vResultCode || '';
            console.log('エラーコード:', vResultCode);
            console.log('元のエラーメッセージ:', jsonResponse.result?.merrMsg);

            // エラーコードに基づく日本語メッセージマッピング
            let errorMessage = 'エラーが発生しました';

            if (vResultCode.startsWith('OC02')) {
                errorMessage = 'PayPay決済の処理でエラーが発生しました。設定を確認してください。';
            } else if (vResultCode.startsWith('OC01')) {
                errorMessage = 'PayPay決済の認証でエラーが発生しました。';
            } else if (vResultCode.startsWith('OC03')) {
                errorMessage = 'PayPay決済のネットワークエラーが発生しました。';
            } else if (vResultCode.includes('0000')) {
                errorMessage = 'PayPay決済の設定に問題があります。管理者にお問い合わせください。';
            } else {
                errorMessage = `PayPay決済でエラーが発生しました（エラーコード: ${vResultCode}）`;
            }

            console.log('日本語エラーメッセージ:', errorMessage);

            // エラーページをUTF-8で返す
            const errorHtml = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>決済エラー - PayPay</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .error-container { max-width: 600px; margin: 0 auto; }
        .error-title { color: #d32f2f; margin-bottom: 20px; }
        .error-details { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .back-button { margin-top: 20px; }
        .back-button a { 
            display: inline-block; 
            padding: 10px 20px; 
            background: #1976d2; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
        }
    </style>
</head>
<body>
    <div class="error-container">
        <h1 class="error-title">決済エラーが発生しました</h1>
        <div class="error-details">
            <p><strong>エラーコード:</strong> ${jsonResponse.result?.vResultCode || 'N/A'}</p>
            <p><strong>エラー内容:</strong> ${errorMessage}</p>
            <p><strong>処理結果:</strong> ${jsonResponse.result?.mstatus || 'N/A'}</p>
        </div>
        <div class="back-button">
            <a href="/">戻る</a>
        </div>
    </div>
</body>
</html>`;

            res.status(400).set('Content-Type', 'text/html; charset=UTF-8').send(errorHtml);

        } else {
            // HTMLレスポンス（正常な決済画面遷移）の場合
            console.log('🟢 PayPay決済画面への遷移HTML受信');

            // PayPayのresponseContentsはShift-JISで返す必要がある
            // 参考URL記載: 「必ず Shift-JIS で返戻して下さい」
            res.set('Content-Type', 'text/html; charset=Shift_JIS');
            res.send(response.data); // 元のShift-JISバイナリデータをそのまま返す
        }

    } catch (err) {
        console.error('❌ 決済処理例外:', err.message);

        // サーバーエラー時も適切なHTMLで返す
        const serverErrorHtml = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>サーバーエラー - PayPay</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .error-container { max-width: 600px; margin: 0 auto; }
        .error-title { color: #d32f2f; margin-bottom: 20px; }
        .error-details { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .back-button { margin-top: 20px; }
        .back-button a { 
            display: inline-block; 
            padding: 10px 20px; 
            background: #1976d2; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
        }
    </style>
</head>
<body>
    <div class="error-container">
        <h1 class="error-title">サーバーエラーが発生しました</h1>
        <div class="error-details">
            <p><strong>エラー内容:</strong> ${err.message}</p>
            <p>しばらく時間をおいてから再度お試しください。</p>
        </div>
        <div class="back-button">
            <a href="/">戻る</a>
        </div>
    </div>
</body>
</html>`;

        res.status(500).set('Content-Type', 'text/html; charset=UTF-8').send(serverErrorHtml);
    }
});

app.listen(PORT, () => {
    console.log(`✅ サーバー起動: http://localhost:${PORT}`);
});
