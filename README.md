# PayPay決済 TypeScript SDK

VeriTrans4GのPayPay決済APIを使用するためのTypeScript SDKです。

## 機能

- **都度決済**: 一回限りの決済処理
- **随時決済**: サブスクリプションなどの継続課金
- **申込（Authorize）**: 決済の申込処理
- **再与信（ReAuthorize）**: 随時決済での課金処理
- **売上（Capture）**: 申込済み取引の売上確定
- **取消（Cancel）**: 申込済み取引の取消
- **返金（Refund）**: 売上確定済み取引の返金
- **解約（Terminate）**: 随時決済の解約

## インストール

```bash
npm install
```

## 使用方法

### 基本的な設定

```typescript
import { PaypayClient, PaypayConfig } from './src/index';

const config: PaypayConfig = {
    merchantCcid: 'YOUR_MERCHANT_CCID',
    merchantPassword: 'YOUR_MERCHANT_PASSWORD',
    isProduction: false, // テスト環境の場合はfalse
    txnVersion: '2.0.0'
};

const paypayClient = new PaypayClient(config);
```

### 都度決済の例

```typescript
// 1. 申込
const authorizeResponse = await paypayClient.authorize({
    orderId: 'ORDER123456',
    accountingType: '0', // 都度決済
    amount: '1000', // 1000円
    itemName: 'テスト商品',
    itemId: 'ITEM001',
    successUrl: 'https://example.com/success',
    cancelUrl: 'https://example.com/cancel',
    errorUrl: 'https://example.com/error'
});

if (PaypayClient.isSuccess(authorizeResponse)) {
    console.log('申込成功');
    
    // 2. 売上確定
    const captureResponse = await paypayClient.capture({
        orderId: 'ORDER123456',
        amount: '1000'
    });
    
    if (PaypayClient.isSuccess(captureResponse)) {
        console.log('売上確定成功');
    }
}
```

### 随時決済の例

```typescript
// 1. 随時決済の申込（利用承諾）
const subscriptionResponse = await paypayClient.authorize({
    orderId: 'SUB123456',
    accountingType: '1', // 随時決済
    itemName: 'サブスクリプション',
    itemId: 'SUB001',
    successUrl: 'https://example.com/success',
    cancelUrl: 'https://example.com/cancel',
    errorUrl: 'https://example.com/error'
});

if (PaypayClient.isSuccess(subscriptionResponse)) {
    console.log('随時決済申込成功');
    
    // 2. 再与信（課金）
    const reAuthorizeResponse = await paypayClient.reAuthorize({
        orderId: 'CHARGE123456',
        originalOrderId: 'SUB123456',
        amount: '500',
        itemName: '月額料金',
        itemId: 'MONTHLY001'
    });
    
    if (PaypayClient.isSuccess(reAuthorizeResponse)) {
        console.log('課金成功');
    }
}
```

### エラーハンドリング

```typescript
try {
    const response = await paypayClient.authorize({
        // パラメータ
    });
    
    if (PaypayClient.isSuccess(response)) {
        console.log('成功');
    } else {
        console.log('エラー:', PaypayClient.getErrorMessage(response));
    }
} catch (error) {
    console.error('API呼び出しエラー:', error);
}
```

## API リファレンス

### PaypayClient

#### コンストラクタ

```typescript
new PaypayClient(config: PaypayConfig)
```

#### メソッド

- `authorize(request)`: 申込（都度決済・随時決済）
- `reAuthorize(request)`: 再与信（随時決済）
- `capture(request)`: 売上確定
- `cancel(request)`: 取消
- `refund(request)`: 返金
- `terminate(request)`: 解約（随時決済）

#### 静的メソッド

- `PaypayClient.isSuccess(response)`: レスポンスが成功かどうかを判定
- `PaypayClient.getErrorMessage(response)`: エラーメッセージを取得

### 設定オプション（PaypayConfig）

```typescript
interface PaypayConfig {
    merchantCcid: string;        // マーチャントCCID
    merchantPassword: string;    // マーチャントパスワード
    isProduction: boolean;       // 本番環境フラグ
    txnVersion: string;          // トランザクションバージョン（通常は"2.0.0"）
}
```

## ビルド

```bash
npm run build
```

## 開発

```bash
npm run dev
```

## テスト

```bash
npm test
```

## 使用例の実行

```bash
npm run dev src/examples/basic-usage.ts
```

## 注意事項

1. **認証情報の管理**: マーチャントCCIDとパスワードは環境変数などで安全に管理してください
2. **テスト環境**: 開発時は必ず`isProduction: false`に設定してください
3. **エラーハンドリング**: 本番環境では適切なエラーハンドリングを実装してください
4. **ログ**: 本番環境では機密情報をログに出力しないよう注意してください

## ライセンス

MIT License

## サポート

このSDKはVeriTrans4G PayPay決済APIの仕様に基づいて実装されています。
API仕様の詳細については、VeriTransの公式ドキュメントを参照してください。
