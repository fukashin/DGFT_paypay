const crypto = require('crypto');
const fs = require('fs');
require('dotenv').config();

// .env から読み込み
const merchantCcid = process.env.MERCHANT_CCID;
const merchantKey = process.env.MERCHANT_KEY;

// params 定義（PayPay決済に必要な項目）
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
    dummyRequest: 1, // 数値で渡す方がAPI仕様と一致
    merchantCcid: merchantCcid
};

// 最小化されたJSON文字列を生成（空白・改行なし）
const minifiedParams = JSON.stringify(params);

// 署名用文字列を作成（エンコードせず連結）
const rawString = merchantCcid + minifiedParams + merchantKey;

// SHA-256 ハッシュを生成
const authHash = crypto.createHash('sha256').update(rawString, 'utf8').digest('hex');

// リクエストオブジェクト生成
const result = {
    params: params,
    authHash: authHash
};

// ファイルに保存（request.json）
fs.writeFileSync('./request.json', JSON.stringify(result, null, 2), 'utf8');

// ハッシュ確認
console.log(`authHash: ${authHash}`);
