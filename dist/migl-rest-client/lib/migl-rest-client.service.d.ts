import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { CookieService } from 'ngx-cookie';
import { Observable, Subject } from 'rxjs';
import { RestServiceConfig } from './migl-rest-client.config';
import * as i0 from "@angular/core";
export declare type HttpObserve = 'body' | 'events' | 'response';
export declare interface HttpOptions {
    body?: any;
    headers?: HttpHeaders | {
        [header: string]: string | string[];
    };
    params?: HttpParams | {
        [param: string]: string | string[];
    };
    observe?: HttpObserve;
    reportProgress?: boolean;
    responseType?: 'arraybuffer' | 'blob' | 'json' | 'text';
    withCredentials?: boolean;
}
export declare class RestClientService {
    private http;
    private cookies;
    /**
     * Handler used to stop all pending requests
     */
    protected cancelPending$: Subject<boolean>;
    /**
     * Default requests header
     */
    protected _baseHeader: {
        accept: string;
        'Cache-Control': string;
        Pragma: string;
        Authorization: string;
    };
    /**
     * When true, the request header will include the authentication token
     */
    protected _secureRequest: boolean;
    /**
     * Rest API end point
     *
     * This value will be prepend to the request URL
     */
    protected _endPoint: string;
    /**
     * API Authorization URI
     */
    protected _authUri: string;
    /**
     * API Token Validation URI
     */
    protected _validateTokenUri: string;
    /**
     * Enable the Mock Data mode
     *
     * When Mock Data is enabled
     */
    protected _mockData: boolean;
    /**
     * Name where the authorization token will be save
     */
    protected _tokenName: string;
    /**
     * Name where the authorization token will be save
     */
    protected _tokenStorage: string;
    /**
     * Set the expiration DateTime in minutes
     *
     * The value in minutes will be add to Datetime when the cookie is set
     */
    protected _cookieExpires: number;
    /**
     * When true, cookies operation will be allow only when HTTPS is use
     */
    protected _secureCookie: boolean;
    /**
     * Holds a list of files to be upload on request
     */
    protected _withFiles: boolean;
    /**
     * Service class constructor
     */
    constructor(http: HttpClient, cookies: CookieService, config: RestServiceConfig);
    /**
     * Set the Rest Client configuration parameters.
     *
     * CAUTION: This method override the current configuration settings
     * and this settings will apply to all following requests
     */
    configure(config: RestServiceConfig): RestClientService;
    /**
     * Get the API Token from cookies
     */
    getToken(): string;
    /**
     * Request an Authorization token
     *
     * The default authorization URI is '[API_END_POINT]/authorize'
     */
    authorize(UserName: string, Password: string): Observable<any>;
    /**
     * Validate the Authentication token against the API
     */
    validateToken(): Observable<any>;
    /**
     * Remove the Authentication token cookie
     */
    revoke(): void;
    /**
     * Check if the client is already Authenticate
     */
    isAuthorized(): boolean;
    /**
     * Cancel all pending requests
     */
    cancelPendingRequests(): void;
    /**
     * API request using GET method
     */
    get(url: string, data?: {}): Observable<any>;
    /**
     * API request using POST method
     */
    post(url: string, data?: {}, responseType?: string, httpOptions?: HttpOptions): Observable<any>;
    /**
     * API request using PUT method
     */
    put(url: string, data?: {}, responseType?: string, httpOptions?: HttpOptions): Observable<any>;
    /**
     * Set the upload file mode
     */
    withFiles(): RestClientService;
    /**
     * API request using DELETE method
     */
    delete(url: string, data?: {}, responseType?: string): Observable<any>;
    /**
     * Set the request mode to SECURED for the next request.
     *
     * Secured Mode force the next request to include the authentication token.
     * The token must be requested previously using the "authorize" method.
     */
    secured(): this;
    /**
     * Set the request mode to PUBLIC for the next request.
     *
     * Public is the default request mode and ensure that no authentication token
     * will be pass on the next request.
     */
    public(): this;
    /**
     * Request a file from endpoint and pass the authenticate token if required
     */
    download(url: string, fileName: string, mime: string, data?: {}): Observable<any>;
    /**
     * Get the expiration Datetime for cookies
     *
     * Add (cookieExpires) minutes to current date
     */
    protected getCookieExpires(): Date;
    /**
     * Save the API Token cookie
     */
    protected setToken(token: string): void;
    /**
     * Build a valid URL concatenating the url parameter with the ApiEndPoint
     */
    protected buildUrl(url: string): string;
    /**
     * Create a FormData object to be send as request payload data
     */
    protected createFormData(object: any, form?: FormData, namespace?: string): FormData;
    /**
     * Raw request method
     */
    protected request(method: string, url: string, data?: any, responseType?: string, httpOptions?: HttpOptions): Observable<any>;
    static ɵfac: i0.ɵɵFactoryDeclaration<RestClientService, [null, null, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<RestClientService>;
}
