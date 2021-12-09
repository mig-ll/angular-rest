export declare class RestServiceConfig {
    endPoint?: string;
    mockData?: boolean;
    tokenStorage?: 'cookie' | 'localStorage';
    tokenName?: string;
    secureCookie?: boolean;
    cookieExpires?: number;
    authUri?: string;
    validationTokenUri?: string;
}
