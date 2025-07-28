// PayPay決済の基本パラメータ
export interface PayNowIdParam {
    // 会員ID管理用のパラメータ（必要に応じて拡張）
}

// 申込（Authorize）リクエスト
export interface PaypayAuthorizeRequest {
    orderId: string; // 取引ID（最大100文字、英数字のみ）
    serviceOptionType: 'online'; // サービスオプションタイプ
    accountingType?: '0' | '1'; // 課金種別（0: 都度決済, 1: 随時決済）
    amount?: string; // 決済金額（1-9999999、随時決済では指定不可）
    itemName?: string; // 商品名（最大40バイト）
    itemId: string; // 商品ID（最大32文字）
    successUrl?: string; // 決済完了時URL（最大1024文字）
    cancelUrl?: string; // 決済キャンセル時URL（最大1024文字）
    errorUrl?: string; // 決済エラー時URL（最大1024文字）
    pushUrl?: string; // プッシュURL（最大256文字）
    transitionType?: '1'; // 遷移種別（1: アプリから遷移）
    extendParameterType?: '0' | '1'; // 拡張パラメータフラグ
    payNowIdParam?: PayNowIdParam;
    txnVersion?: string; // 決済要求電文のバージョン（2.0.0）
    dummyRequest?: '0' | '1'; // ダミー要求フラグ
    merchantCcid: string; // マーチャントCCID
}

// 再与信（ReAuthorize）リクエスト
export interface PaypayReAuthorizeRequest {
    orderId: string; // 取引ID
    serviceOptionType: 'online';
    originalOrderId: string; // 元取引ID
    amount: string; // 決済金額
    itemName?: string; // 商品名
    itemId?: string; // 商品ID
    nsfRecoveryFlag?: 'true' | 'false'; // 支払い要求実行フラグ
    nsfRecoveryExpiredDatetime?: string; // 支払い有効期限（YYYYMMDDhhmmss）
    pushUrl?: string; // プッシュ先URL
    payNowIdParam?: PayNowIdParam;
    txnVersion?: string;
    dummyRequest?: '0' | '1';
    merchantCcid: string;
}

// 取消（Cancel）リクエスト
export interface PaypayCancelRequest {
    orderId: string; // 取引ID
    serviceOptionType: 'online';
    payNowIdParam?: PayNowIdParam;
    txnVersion?: string;
    dummyRequest?: '0' | '1';
    merchantCcid: string;
}

// 売上（Capture）リクエスト
export interface PaypayCaptureRequest {
    orderId: string; // 取引ID
    serviceOptionType: 'online';
    amount?: string; // 売上金額
    orderDescription?: string; // 注文の説明（最大255文字）
    payNowIdParam?: PayNowIdParam;
    txnVersion?: string;
    dummyRequest?: '0' | '1';
    merchantCcid: string;
}

// 返金（Refund）リクエスト
export interface PaypayRefundRequest {
    orderId: string; // 取引ID
    serviceOptionType: 'online';
    amount?: string; // 返金金額
    payNowIdParam?: PayNowIdParam;
    txnVersion?: string;
    dummyRequest?: '0' | '1';
    merchantCcid: string;
}

// 解約（Terminate）リクエスト
export interface PaypayTerminateRequest {
    orderId: string; // 取引ID
    serviceOptionType: 'online';
    force?: 'true' | 'false'; // 強制解約フラグ
    successUrl?: string; // 解約完了時URL
    cancelUrl?: string; // 解約キャンセル時URL
    errorUrl?: string; // 解約エラー時URL
    pushUrl?: string; // プッシュ先URL
    payNowIdParam?: PayNowIdParam;
    txnVersion?: string;
    dummyRequest?: '0' | '1';
    merchantCcid: string;
}

// API リクエストの共通構造
export interface PaypayApiRequest<T> {
    params: T;
    authHash: string; // 認証ハッシュ
}

// PayNowIdResponse
export interface PayNowIdResponse {
    processId: string;
    status: string;
    message: string;
    account: Record<string, any>;
}

// 共通レスポンス結果
export interface PaypayResult {
    serviceType: string;
    mstatus: string;
    vResultCode: string;
    merrMsg: string;
    marchTxn: string;
    orderId: string;
    custTxn: string;
    txnVersion: string;
    responseContents?: string; // 申込時のHTML
    paypayOrderId?: string; // 再与信時
    paypayPaidDatetime?: string; // 再与信時
    originalOrderId?: string; // 再与信時
    centerOrderId?: string; // 再与信時
    paypayCancelledDatetime?: string; // 取消時
    balance?: string; // 売上・返金時
    paypayCapturedDatetime?: string; // 売上時
    paypayRefundedDatetime?: string; // 返金時
    paypayTerminatedDatetime?: string; // 解約時
    userKey?: string; // 解約時
}

// API レスポンスの共通構造
export interface PaypayApiResponse {
    payNowIdResponse: PayNowIdResponse;
    result: PaypayResult;
}

// エラーレスポンス
export interface PaypayErrorResponse {
    error: {
        code: string;
        message: string;
        details?: any;
    };
}

// 設定オプション
export interface PaypayConfig {
    merchantCcid: string; // マーチャントCCID
    merchantPassword: string; // マーチャントパスワード（ハッシュ生成用）
    isProduction: boolean; // 本番環境フラグ
    txnVersion: string; // トランザクションバージョン
}

// API エンドポイント
export const PAYPAY_ENDPOINTS = {
    PRODUCTION: {
        AUTHORIZE: 'https://api3.veritrans.co.jp/paynow/v2/Authorize/paypay',
        REAUTHORIZE: 'https://api3.veritrans.co.jp/paynow/v2/ReAuthorize/paypay',
        CANCEL: 'https://api3.veritrans.co.jp/paynow/v2/Cancel/paypay',
        CAPTURE: 'https://api3.veritrans.co.jp/paynow/v2/Capture/paypay',
        REFUND: 'https://api3.veritrans.co.jp/paynow/v2/Refund/paypay',
        TERMINATE: 'https://api3.veritrans.co.jp/paynow/v2/Terminate/paypay'
    },
    TEST: {
        AUTHORIZE: 'https://api3.veritrans.co.jp/test-paynow/v2/Authorize/paypay',
        REAUTHORIZE: 'https://api3.veritrans.co.jp/test-paynow/v2/ReAuthorize/paypay',
        CANCEL: 'https://api3.veritrans.co.jp/test-paynow/v2/Cancel/paypay',
        CAPTURE: 'https://api3.veritrans.co.jp/test-paynow/v2/Capture/paypay',
        REFUND: 'https://api3.veritrans.co.jp/test-paynow/v2/Refund/paypay',
        TERMINATE: 'https://api3.veritrans.co.jp/test-paynow/v2/Terminate/paypay'
    }
} as const;
