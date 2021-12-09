export class RestServiceConfig {
    public endPoint?: string;
    public mockData?: boolean;
    public tokenStorage?: 'cookie' | 'localStorage';
    public tokenName?: string;
    public secureCookie?: boolean;
    public cookieExpires?: number;
    public authUri?: string;
    public validationTokenUri?: string;
}
