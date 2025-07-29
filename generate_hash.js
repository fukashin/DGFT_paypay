const crypto = require('crypto');
const fs = require('fs');
require('dotenv').config();

// .env から読み込み
const merchantCcid = process.env.MERCHANT_CCID;
const merchantKey = process.env.MERCHANT_KEY;

// 一意な orderId を生成（例：20250729-abc123）
const generateOrderId = () => {
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
    const randomStr = crypto.randomBytes(3).toString('hex'); // 6文字
    return `order-${timestamp}-${randomStr}`;
};

const orderId = generateOrderId();

// params 定義（PayPay決済に必要な項目）
const params = {
    orderId: orderId,
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
    merchantCcid: merchantCcid
};

// 最小化されたJSON文字列を生成
const minifiedParams = JSON.stringify(params);

// 署名用文字列を作成
const rawString = merchantCcid + minifiedParams + merchantKey;

// SHA-256 ハッシュを生成
const authHash = crypto.createHash('sha256').update(rawString, 'utf8').digest('hex');

// リクエストオブジェクト生成
const result = {
    params: params,
    authHash: authHash
};

// ファイルに保存
fs.writeFileSync('./request.json', JSON.stringify(result, null, 2), 'utf8');

console.log(`orderId: ${orderId}`);
console.log(`authHash: ${authHash}`);
