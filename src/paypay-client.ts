import axios, { AxiosResponse } from 'axios';
import {
    PaypayConfig,
    PaypayAuthorizeRequest,
    PaypayApiRequest,
    PaypayApiResponse,
    PaypayErrorResponse,
    PAYPAY_ENDPOINTS
} from './types/paypay.types';
import {
    generateAuthHash,
    validateOrderId,
    validateAmount,
    validateItemId,
    validateUrl
} from './utils/auth.utils';

/**
 * PayPay決済クライアント
 */
export class PaypayClient {
    private config: PaypayConfig;

    constructor(config: PaypayConfig) {
        this.config = {
            ...config,
            txnVersion: config.txnVersion || '2.0.0'
        };
    }

    /**
     * エンドポイントURLを取得
     * @param endpoint エンドポイント名
     * @returns URL
     */
    private getEndpointUrl(endpoint: keyof typeof PAYPAY_ENDPOINTS.PRODUCTION): string {
        return this.config.isProduction
            ? PAYPAY_ENDPOINTS.PRODUCTION[endpoint]
            : PAYPAY_ENDPOINTS.TEST[endpoint];
    }

    /**
     * APIリクエストを送信
     * @param url エンドポイントURL
     * @param params リクエストパラメータ
     * @returns APIレスポンス
     */
    private async sendRequest<T>(
        url: string,
        params: T
    ): Promise<PaypayApiResponse> {
        try {
            // 認証ハッシュを生成
            const authHash = generateAuthHash(params as Record<string, any>, this.config.merchantPassword);

            // リクエストボディを構築
            const requestBody: PaypayApiRequest<T> = {
                params,
                authHash
            };

            // APIリクエストを送信
            const response: AxiosResponse<PaypayApiResponse> = await axios.post(
                url,
                requestBody,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000 // 30秒タイムアウト
                }
            );

            return response.data;
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const errorResponse: PaypayErrorResponse = {
                    error: {
                        code: error.response?.status?.toString() || 'NETWORK_ERROR',
                        message: error.message,
                        details: error.response?.data
                    }
                };
                throw errorResponse;
            }
            throw error;
        }
    }

    /**
     * 申込（Authorize）- 都度決済・随時決済
     * @param request 申込リクエスト
     * @returns APIレスポンス
     */
    async authorize(request: Omit<PaypayAuthorizeRequest, 'merchantCcid' | 'txnVersion' | 'serviceOptionType'>): Promise<PaypayApiResponse> {
        // バリデーション
        validateOrderId(request.orderId);
        validateItemId(request.itemId);

        if (request.amount && request.accountingType !== '1') {
            validateAmount(request.amount);
        }

        if (request.successUrl) validateUrl(request.successUrl);
        if (request.cancelUrl) validateUrl(request.cancelUrl);
        if (request.errorUrl) validateUrl(request.errorUrl);
        if (request.pushUrl) validateUrl(request.pushUrl, 256);

        // リクエストパラメータを構築
        const params: PaypayAuthorizeRequest = {
            ...request,
            serviceOptionType: 'online',
            accountingType: request.accountingType || '0',
            extendParameterType: request.extendParameterType || '0',
            payNowIdParam: request.payNowIdParam || {},
            txnVersion: this.config.txnVersion,
            dummyRequest: this.config.isProduction ? '0' : '1',
            merchantCcid: this.config.merchantCcid
        };

        const url = this.getEndpointUrl('AUTHORIZE');
        return this.sendRequest(url, params);
    }




    /**
     * レスポンスが成功かどうかを判定
     * @param response APIレスポンス
     * @returns 成功の場合true
     */
    static isSuccess(response: PaypayApiResponse): boolean {
        return response.result.mstatus === 'success';
    }

    /**
     * エラーメッセージを取得
     * @param response APIレスポンス
     * @returns エラーメッセージ
     */
    static getErrorMessage(response: PaypayApiResponse): string {
        return response.result.merrMsg || '不明なエラーが発生しました';
    }
}
