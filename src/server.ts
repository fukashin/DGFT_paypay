import express from 'express';
import cors from 'cors';
import path from 'path';
import { PaypayClient, PaypayConfig } from './index';
import { generateOrderId } from './utils/auth.utils';

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// PayPayクライアントの設定（仮の値）
const paypayConfig: PaypayConfig = {
    merchantCcid: 'A000000000000000000000cc', // 仮のマーチャントCCID
    merchantPassword: 'dummy_password_123', // 仮のマーチャントパスワード
    isProduction: false, // テスト環境
    txnVersion: '2.0.0'
};

const paypayClient = new PaypayClient(paypayConfig);

// ルート
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 申込API（都度決済）
app.post('/api/authorize', async (req, res) => {
    try {
        const { amount, itemName, itemId } = req.body;

        if (!amount || !itemName || !itemId) {
            return res.status(400).json({
                success: false,
                error: '必須パラメータが不足しています'
            });
        }

        const orderId = generateOrderId('WEB');

        const response = await paypayClient.authorize({
            orderId: orderId,
            accountingType: '0', // 都度決済
            amount: amount.toString(),
            itemName: itemName,
            itemId: itemId,
            successUrl: `http://localhost:${PORT}/success`,
            cancelUrl: `http://localhost:${PORT}/cancel`,
            errorUrl: `http://localhost:${PORT}/error`,
            pushUrl: `http://localhost:${PORT}/api/push`
        });

        if (PaypayClient.isSuccess(response)) {
            res.json({
                success: true,
                data: {
                    orderId: response.result.orderId,
                    marchTxn: response.result.marchTxn,
                    custTxn: response.result.custTxn,
                    responseContents: response.result.responseContents
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: PaypayClient.getErrorMessage(response),
                details: response.result
            });
        }
    } catch (error: any) {
        console.error('申込エラー:', error);

        // PayPayのAPIエラーレスポンスの場合
        if (error && error.error) {
            res.status(500).json({
                success: false,
                error: error.error.message || 'APIエラーが発生しました',
                details: error.error
            });
        } else {
            res.status(500).json({
                success: false,
                error: error.message || 'サーバーエラーが発生しました',
                details: error
            });
        }
    }
});




// プッシュ通知受信API
app.post('/api/push', (req, res) => {
    console.log('プッシュ通知を受信:', req.body);
    res.status(200).send('OK');
});

// 成功ページ
app.get('/success', (req, res) => {
    res.send(`
        <html>
            <head><title>決済成功</title></head>
            <body>
                <h1>決済が成功しました</h1>
                <p>ありがとうございました。</p>
                <a href="/">戻る</a>
            </body>
        </html>
    `);
});

// キャンセルページ
app.get('/cancel', (req, res) => {
    res.send(`
        <html>
            <head><title>決済キャンセル</title></head>
            <body>
                <h1>決済がキャンセルされました</h1>
                <a href="/">戻る</a>
            </body>
        </html>
    `);
});

// エラーページ
app.get('/error', (req, res) => {
    res.send(`
        <html>
            <head><title>決済エラー</title></head>
            <body>
                <h1>決済エラーが発生しました</h1>
                <a href="/">戻る</a>
            </body>
        </html>
    `);
});

// サーバー起動
app.listen(PORT, () => {
    console.log(`PayPay決済テストサーバーが起動しました: http://localhost:${PORT}`);
    console.log('設定:');
    console.log(`- マーチャントCCID: ${paypayConfig.merchantCcid}`);
    console.log(`- 環境: ${paypayConfig.isProduction ? '本番' : 'テスト'}`);
    console.log(`- バージョン: ${paypayConfig.txnVersion}`);
});
