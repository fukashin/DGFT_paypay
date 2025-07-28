import { PaypayClient, PaypayConfig } from '../index';
import { generateOrderId } from '../utils/auth.utils';

/**
 * PayPay決済申込の使用例
 */
async function basicUsageExample() {
    // 設定（仮の値を使用）
    const config: PaypayConfig = {
        merchantCcid: 'A000000000000000000000cc', // 仮のマーチャントCCID
        merchantPassword: 'dummy_password_123', // 仮のマーチャントパスワード
        isProduction: false, // テスト環境
        txnVersion: '2.0.0'
    };

    // PayPayクライアントを初期化
    const paypayClient = new PaypayClient(config);

    try {
        console.log('=== PayPay決済申込の使用例 ===\n');

        // 都度決済の申込
        console.log('都度決済の申込を実行中...');
        const orderId = generateOrderId('TEST');

        const authorizeResponse = await paypayClient.authorize({
            orderId: orderId,
            accountingType: '0', // 都度決済
            amount: '1000', // 1000円
            itemName: 'テスト商品',
            itemId: 'ITEM001',
            successUrl: 'https://example.com/success',
            cancelUrl: 'https://example.com/cancel',
            errorUrl: 'https://example.com/error',
            pushUrl: 'https://example.com/push'
        });

        if (PaypayClient.isSuccess(authorizeResponse)) {
            console.log('✅ 申込が成功しました');
            console.log(`取引ID: ${authorizeResponse.result.orderId}`);
            console.log(`マーチャント取引番号: ${authorizeResponse.result.marchTxn}`);
            console.log(`顧客取引番号: ${authorizeResponse.result.custTxn}`);
            console.log(`レスポンス内容: ${authorizeResponse.result.responseContents ? 'HTML取得済み' : 'なし'}\n`);
        } else {
            console.log('❌ 申込に失敗しました');
            console.log(`エラー: ${PaypayClient.getErrorMessage(authorizeResponse)}`);
            console.log(`詳細: ${JSON.stringify(authorizeResponse.result, null, 2)}\n`);
        }

    } catch (error: any) {
        console.error('予期しないエラーが発生しました:');
        if (error && error.error) {
            console.error(`APIエラー: ${error.error.message}`);
            console.error(`詳細: ${JSON.stringify(error.error, null, 2)}`);
        } else {
            console.error(error);
        }
    }
}

// 使用例を実行
if (require.main === module) {
    (async () => {
        await basicUsageExample();
    })();
}

export { basicUsageExample };
