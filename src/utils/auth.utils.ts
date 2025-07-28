import { createHash } from 'crypto';

/**
 * VeriTrans4G用の認証ハッシュを生成する
 * @param params リクエストパラメータ
 * @param merchantPassword マーチャントパスワード
 * @returns SHA256ハッシュ値（16進数文字列）
 */
export function generateAuthHash(params: Record<string, any>, merchantPassword: string): string {
    // パラメータをキー順でソートして文字列化
    const sortedKeys = Object.keys(params).sort();
    let hashString = '';

    for (const key of sortedKeys) {
        const value = params[key];
        if (value !== undefined && value !== null && value !== '') {
            // オブジェクトの場合は再帰的に処理
            if (typeof value === 'object' && !Array.isArray(value)) {
                const nestedHash = generateNestedParamString(value, key);
                if (nestedHash) {
                    hashString += nestedHash;
                }
            } else {
                hashString += `${key}=${value}`;
            }
        }
    }

    // マーチャントパスワードを末尾に追加
    hashString += merchantPassword;

    // SHA256ハッシュを生成
    return createHash('sha256').update(hashString, 'utf8').digest('hex');
}

/**
 * ネストしたオブジェクトのパラメータ文字列を生成
 * @param obj オブジェクト
 * @param parentKey 親キー
 * @returns パラメータ文字列
 */
function generateNestedParamString(obj: Record<string, any>, parentKey: string): string {
    const sortedKeys = Object.keys(obj).sort();
    let paramString = '';

    for (const key of sortedKeys) {
        const value = obj[key];
        if (value !== undefined && value !== null && value !== '') {
            if (typeof value === 'object' && !Array.isArray(value)) {
                const nestedString = generateNestedParamString(value, `${parentKey}.${key}`);
                if (nestedString) {
                    paramString += nestedString;
                }
            } else {
                paramString += `${parentKey}.${key}=${value}`;
            }
        }
    }

    return paramString;
}

/**
 * 取引IDを生成する（英数字のみ、最大100文字）
 * @param prefix プレフィックス（オプション）
 * @returns 取引ID
 */
export function generateOrderId(prefix: string = 'ORDER'): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${timestamp}${random}`.substring(0, 100);
}

/**
 * 日時文字列を生成する（YYYYMMDDhhmmss形式）
 * @param date 日時オブジェクト（省略時は現在時刻）
 * @returns YYYYMMDDhhmmss形式の文字列
 */
export function formatDateTime(date: Date = new Date()): string {
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * 支払い有効期限を計算する（現在時刻から指定時間後）
 * @param hoursFromNow 現在時刻からの時間数（デフォルト: 6時間）
 * @returns YYYYMMDDhhmmss形式の文字列
 */
export function calculateExpiryDateTime(hoursFromNow: number = 6): string {
    const now = new Date();
    const expiry = new Date(now.getTime() + (hoursFromNow * 60 * 60 * 1000));
    return formatDateTime(expiry);
}

/**
 * パラメータの妥当性をチェックする
 * @param orderId 取引ID
 * @throws Error 妥当でない場合
 */
export function validateOrderId(orderId: string): void {
    if (!orderId) {
        throw new Error('取引IDが指定されていません');
    }

    if (orderId.length > 100) {
        throw new Error('取引IDは100文字以内で指定してください');
    }

    if (!/^[a-zA-Z0-9]+$/.test(orderId)) {
        throw new Error('取引IDは英数字のみで指定してください');
    }
}

/**
 * 金額の妥当性をチェックする
 * @param amount 金額
 * @throws Error 妥当でない場合
 */
export function validateAmount(amount: string): void {
    if (!amount) {
        throw new Error('金額が指定されていません');
    }

    if (!/^[0-9]+$/.test(amount)) {
        throw new Error('金額は数字のみで指定してください');
    }

    const numAmount = parseInt(amount, 10);
    if (numAmount < 1 || numAmount > 9999999) {
        throw new Error('金額は1円以上9,999,999円以下で指定してください');
    }
}

/**
 * 商品IDの妥当性をチェックする
 * @param itemId 商品ID
 * @throws Error 妥当でない場合
 */
export function validateItemId(itemId: string): void {
    if (!itemId) {
        throw new Error('商品IDが指定されていません');
    }

    if (itemId.length > 32) {
        throw new Error('商品IDは32文字以内で指定してください');
    }
}

/**
 * URLの妥当性をチェックする
 * @param url URL
 * @param maxLength 最大文字数
 * @throws Error 妥当でない場合
 */
export function validateUrl(url: string, maxLength: number = 1024): void {
    if (url && url.length > maxLength) {
        throw new Error(`URLは${maxLength}文字以内で指定してください`);
    }

    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
        throw new Error('URLはhttp://またはhttps://で始まる必要があります');
    }
}
