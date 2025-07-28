import { PaypayClient, PaypayConfig } from '../index';
import { generateOrderId } from '../utils/auth.utils';

/**
 * PayPay決済の基本的な使用例
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
        console.log('=== PayPay決済の基本的な使用例 ===\n');

        // 1. 都度決済の申込
        console.log('1. 都度決済の申込を実行中...');
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
            console.log(`顧客取引番号: ${authorizeResponse.result.custTxn}\n`);

            // 2. 売上確定
            console.log('2. 売上確定を実行中...');
            const captureResponse = await paypayClient.capture({
                orderId: orderId,
                amount: '1000' // 全額売上
            });

            if (PaypayClient.isSuccess(captureResponse)) {
                console.log('✅ 売上確定が成功しました');
                console.log(`売上日時: ${captureResponse.result.paypayCapturedDatetime}`);
                console.log(`残高: ${captureResponse.result.balance}円\n`);

                // 3. 部分返金
                console.log('3. 部分返金を実行中...');
                const refundResponse = await paypayClient.refund({
                    orderId: orderId,
                    amount: '300' // 300円返金
                });

                if (PaypayClient.isSuccess(refundResponse)) {
                    console.log('✅ 返金が成功しました');
                    console.log(`返金日時: ${refundResponse.result.paypayRefundedDatetime}`);
                    console.log(`残高: ${refundResponse.result.balance}円\n`);
                } else {
                    console.log('❌ 返金に失敗しました');
                    console.log(`エラー: ${PaypayClient.getErrorMessage(refundResponse)}\n`);
                }
            } else {
                console.log('❌ 売上確定に失敗しました');
                console.log(`エラー: ${PaypayClient.getErrorMessage(captureResponse)}\n`);
            }
        } else {
            console.log('❌ 申込に失敗しました');
            console.log(`エラー: ${PaypayClient.getErrorMessage(authorizeResponse)}\n`);
        }

        // 4. 随時決済の例
        console.log('4. 随時決済の申込を実行中...');
        const subscriptionOrderId = generateOrderId('SUB');

        const subscriptionResponse = await paypayClient.authorize({
            orderId: subscriptionOrderId,
            accountingType: '1', // 随時決済
            itemName: 'サブスクリプション',
            itemId: 'SUB001',
            successUrl: 'https://example.com/success',
            cancelUrl: 'https://example.com/cancel',
            errorUrl: 'https://example.com/error',
            pushUrl: 'https://example.com/push'
        });

        if (PaypayClient.isSuccess(subscriptionResponse)) {
            console.log('✅ 随時決済の申込が成功しました');
            console.log(`取引ID: ${subscriptionResponse.result.orderId}\n`);

            // 5. 再与信（随時決済での課金）
            console.log('5. 再与信を実行中...');
            const rechargeOrderId = generateOrderId('CHARGE');

            const reAuthorizeResponse = await paypayClient.reAuthorize({
                orderId: rechargeOrderId,
                originalOrderId: subscriptionOrderId,
                amount: '500', // 500円課金
                itemName: '月額料金',
                itemId: 'MONTHLY001',
                nsfRecoveryFlag: 'true' // 残高不足時の支払い要求を有効
            });

            if (PaypayClient.isSuccess(reAuthorizeResponse)) {
                console.log('✅ 再与信が成功しました');
                console.log(`課金日時: ${reAuthorizeResponse.result.paypayPaidDatetime}`);
                console.log(`PayPay注文ID: ${reAuthorizeResponse.result.paypayOrderId}\n`);
            } else {
                console.log('❌ 再与信に失敗しました');
                console.log(`エラー: ${PaypayClient.getErrorMessage(reAuthorizeResponse)}\n`);
            }

            // 6. 随時決済の解約
            console.log('6. 随時決済の解約を実行中...');
            const terminateResponse = await paypayClient.terminate({
                orderId: subscriptionOrderId,
                force: 'true' // 強制解約（2者間）
            });

            if (PaypayClient.isSuccess(terminateResponse)) {
                console.log('✅ 解約が成功しました');
                console.log(`解約日時: ${terminateResponse.result.paypayTerminatedDatetime}\n`);
            } else {
                console.log('❌ 解約に失敗しました');
                console.log(`エラー: ${PaypayClient.getErrorMessage(terminateResponse)}\n`);
            }
        } else {
            console.log('❌ 随時決済の申込に失敗しました');
            console.log(`エラー: ${PaypayClient.getErrorMessage(subscriptionResponse)}\n`);
        }

    } catch (error) {
        console.error('予期しないエラーが発生しました:', error);
    }
}

/**
 * 取消の使用例
 */
async function cancelExample() {
    const config: PaypayConfig = {
        merchantCcid: 'A000000000000000000000cc',
        merchantPassword: 'dummy_password_123',
        isProduction: false,
        txnVersion: '2.0.0'
    };

    const paypayClient = new PaypayClient(config);

    try {
        console.log('=== 取消の使用例 ===\n');

        // 申込
        const orderId = generateOrderId('CANCEL');
        const authorizeResponse = await paypayClient.authorize({
            orderId: orderId,
            accountingType: '0',
            amount: '2000',
            itemName: 'キャンセルテスト商品',
            itemId: 'CANCEL001',
            successUrl: 'https://example.com/success',
            cancelUrl: 'https://example.com/cancel',
            errorUrl: 'https://example.com/error'
        });

        if (PaypayClient.isSuccess(authorizeResponse)) {
            console.log('✅ 申込が成功しました');
            console.log(`取引ID: ${authorizeResponse.result.orderId}\n`);

            // 取消
            console.log('取消を実行中...');
            const cancelResponse = await paypayClient.cancel({
                orderId: orderId
            });

            if (PaypayClient.isSuccess(cancelResponse)) {
                console.log('✅ 取消が成功しました');
                console.log(`取消日時: ${cancelResponse.result.paypayCancelledDatetime}\n`);
            } else {
                console.log('❌ 取消に失敗しました');
                console.log(`エラー: ${PaypayClient.getErrorMessage(cancelResponse)}\n`);
            }
        } else {
            console.log('❌ 申込に失敗しました');
            console.log(`エラー: ${PaypayClient.getErrorMessage(authorizeResponse)}\n`);
        }

    } catch (error) {
        console.error('予期しないエラーが発生しました:', error);
    }
}

// 使用例を実行
if (require.main === module) {
    (async () => {
        await basicUsageExample();
        console.log('\n' + '='.repeat(50) + '\n');
        await cancelExample();
    })();
}

export { basicUsageExample, cancelExample };
