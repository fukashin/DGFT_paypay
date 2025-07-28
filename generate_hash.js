const crypto = require('crypto');
const fs = require('fs');
require('dotenv').config();

// .env から読み込み
const merchantCcid = process.env.MERCHANT_CCID;
const merchantKey = process.env.MERCHANT_KEY;

// params 定義
const params = {
    orderId: "dummy001",
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
    dummyRequest: "1",
    merchantCcid: merchantCcid
};

// JSON文字列をminify
const minifiedParams = JSON.stringify(params);
const encodedParams = encodeURIComponent(minifiedParams);

// 署名用文字列
const rawString = merchantCcid + encodedParams + merchantKey;

// SHA256ハッシュを生成
const authHash = crypto.createHash('sha256').update(rawString, 'utf8').digest('hex');

// JSON出力用オブジェクト
const result = {
    params: params,
    authHash: authHash
};

// ファイル出力
fs.writeFileSync('./request.json', JSON.stringify(result, null, 2), 'utf8');

// 表示
console.log(`authHash: ${authHash}`);
