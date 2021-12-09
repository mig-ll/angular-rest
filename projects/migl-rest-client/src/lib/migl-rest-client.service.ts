import * as FileSaver from 'file-saver';
import { Injectable, Optional } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { CookieService } from 'ngx-cookie';

import { Observable, Subject } from 'rxjs';
import { takeUntil, delay, map, tap } from 'rxjs/operators';

import { RestServiceConfig } from './migl-rest-client.config';

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

@Injectable({
    providedIn: 'root'
})
export class RestClientService {

    /**
     * Handler used to stop all pending requests
     */
    protected cancelPending$: Subject<boolean> = new Subject<boolean>();

    /**
     * Default requests header
     */
    protected _baseHeader = {
        'accept'        : 'application/json',
        'Cache-Control' : 'no-cache',
        'Pragma'        : 'no-cache',
        'Authorization' : ''
    };

    /**
     * When true, the request header will include the authentication token
     */
    protected _secureRequest = false;

    /**
     * Rest API end point
     *
     * This value will be prepend to the request URL
     */
    protected _endPoint = '';

    /**
     * API Authorization URI
     */
    protected _authUri = '/authorize';

    /**
     * API Token Validation URI
     */
    protected _validateTokenUri = '/validate-token';

    /**
     * Enable the Mock Data mode
     *
     * When Mock Data is enabled
     */
    protected _mockData = false;

    /**
     * Name where the authorization token will be save
     */
    protected _tokenName = 'AuthToken';

    /**
     * Name where the authorization token will be save
     */
    protected _tokenStorage = 'cookie';

    /**
     * Set the expiration DateTime in minutes
     *
     * The value in minutes will be add to Datetime when the cookie is set
     */
    protected _cookieExpires: number = 1440 * 7;

    /**
     * When true, cookies operation will be allow only when HTTPS is use
     */
    protected _secureCookie = false;

    /**
     * Holds a list of files to be upload on request
     */
    protected _withFiles = false;

    /**
     * Service class constructor
     */
    constructor(
        private http: HttpClient,
        private cookies: CookieService,
        @Optional() config: RestServiceConfig
    ) {
        if (config) {
            if ( config.endPoint ) { this._endPoint = config.endPoint; }
            if ( config.tokenName ) { this._tokenName = config.tokenName; }
            if ( config.tokenStorage ) { this._tokenName = config.tokenStorage; }
            if ( config.secureCookie ) { this._secureCookie = config.secureCookie; }
            if ( config.mockData ) { this._mockData = config.mockData; }
            if ( config.cookieExpires ) { this._cookieExpires = config.cookieExpires; }
        }
    }

    /**
     * Set the Rest Client configuration parameters.
     *
     * CAUTION: This method override the current configuration settings
     * and this settings will apply to all following requests
     */
    public configure( config: RestServiceConfig ): RestClientService {
        if ( config.endPoint ) { this._endPoint = config.endPoint; }
        if ( config.tokenName ) { this._tokenName = config.tokenName; }
        if ( config.tokenStorage ) { this._tokenName = config.tokenStorage; }
        if ( config.secureCookie ) { this._secureCookie = config.secureCookie; }
        if ( config.mockData ) { this._mockData = config.mockData; }
        if ( config.cookieExpires ) { this._cookieExpires = config.cookieExpires; }
        return this;
    }

    /**
     * Get the API Token from cookies
     */
    public getToken(): string {
        let token;

        switch ( this._tokenStorage ) {
            case 'cookie':
                token = this.cookies.get( this._tokenName );
                break;
            case 'localStorage':
                let storageData = localStorage.getItem(this._tokenName);
                if (storageData) {
                    token = JSON.parse(storageData);
                }
                break;
            default:
                throw new Error('Invalid Token Storage method');
        }

        return !token || typeof token === 'undefined' ? '' : token;
    }

    /**
     * Request an Authorization token
     *
     * The default authorization URI is '[API_END_POINT]/authorize'
     */
    public authorize( UserName: string, Password: string ): Observable<any> {
        return this.request('post', this._authUri, { username: UserName, password: Password })
            .pipe(tap((data) => {
                this.setToken(data.token);
            }));
    }

    /**
     * Validate the Authentication token against the API
     */
    public validateToken(): Observable<any> {
        return this.request('post', this._validateTokenUri);
    }

    /**
     * Remove the Authentication token cookie
     */
    public revoke(): void {
        switch ( this._tokenStorage ) {
            case 'cookie':
                this.cookies.removeAll();
                break;
            case 'localStorage':
                localStorage.removeItem(this._tokenName);
                break;
            default:
                throw new Error('Invalid Token Storage method');
        }
    }

    /**
     * Check if the client is already Authenticate
     */
    public isAuthorized(): boolean {
        return this.getToken() !== '';
    }

    /**
     * Cancel all pending requests
     */
    public cancelPendingRequests(): void {
        this.cancelPending$.next(true);
    }

    /**
     * API request using GET method
     */
    public get(url: string, data?: {}): Observable<any> {
        return this.request('get', url, data);
    }

    /**
     * API request using POST method
     */
    public post(
        url: string, data?: {}, responseType?: string, httpOptions: HttpOptions = {}
    ): Observable<any> {
        return this.request('post', url, data, responseType, httpOptions);
    }

    /**
     * API request using PUT method
     */
    public put(
        url: string, data?: {}, responseType?: string, httpOptions: HttpOptions = {}
    ): Observable<any> {
        return this.request('put', url, data, responseType, httpOptions);
    }

    /**
     * Set the upload file mode
     */
    public withFiles( ): RestClientService {
        this._withFiles = true;
        return this;
    }

    /**
     * API request using DELETE method
     */
    public delete(url: string, data?: {}, responseType?: string): Observable<any> {
        return this.request('delete', url, data, responseType);
    }

    /**
     * Set the request mode to SECURED for the next request.
     *
     * Secured Mode force the next request to include the authentication token.
     * The token must be requested previously using the "authorize" method.
     */
    public secured() {
        this._secureRequest = true;
        return this;
    }

    /**
     * Set the request mode to PUBLIC for the next request.
     *
     * Public is the default request mode and ensure that no authentication token
     * will be pass on the next request.
     */
    public public() {
        this._secureRequest = false;
        return this;
    }

    /**
     * Request a file from endpoint and pass the authenticate token if required
     */
    public download( url: string, fileName: string, mime: string, data?: {}): Observable<any> {
        // const msDelay = Math.floor((Math.random() * 2000) + 1000);
        const header = JSON.parse(JSON.stringify(this._baseHeader));

        if ( this._secureRequest ) {
            const token = this.getToken();
            if ( !token ) {
                console.warn('Executing a secure request without TOKEN.');
            } else { header.Authorization = `Bearer ${token}`; }
            this._secureRequest = false;
        }

        const options = { responseType: ('blob' ) as 'text', params: data, headers: header };

        return this.http.request( 'get', this.buildUrl(url), options )
            .pipe(takeUntil(this.cancelPending$))
            .pipe(map((res) => {
                const blob = new Blob([res], { type: mime });
                FileSaver.saveAs(blob, fileName);
                return 'DOWNLOAD';
            }));
    }

    /**
     * Get the expiration Datetime for cookies
     *
     * Add (cookieExpires) minutes to current date
     */
    protected getCookieExpires(): Date {
        const d = new Date();
        d.setMinutes(d.getMinutes() + this._cookieExpires);
        return d;
    }

    /**
     * Save the API Token cookie
     */
    protected setToken( token: string ): void {
        switch ( this._tokenStorage ) {
            case 'cookie':
                this.cookies.put(
                    this._tokenName,
                    token,
                    { secure: this._secureCookie, expires: this.getCookieExpires() }
                );
                break;
            case 'localStorage':
                localStorage.setItem(this._tokenName, token);
                break;
            default:
                throw new Error('Invalid Token Storage method');
        }
    }

    /**
     * Build a valid URL concatenating the url parameter with the ApiEndPoint
     */
    protected buildUrl( url: string ): string {
        let nUrl = `${this._endPoint.replace(/\/$/, '')}/${url.replace(/^\//g, '')}`;
        const match = nUrl.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);

        if ( this._mockData && match == null ) {
            nUrl = `${nUrl}.json`;
        }

        return nUrl;
    }

    /**
     * Create a FormData object to be send as request payload data
     */
    protected createFormData(object: any, form?: FormData, namespace?: string): FormData {
        const formData = form || new FormData();
        for (const property in object) {
            if (!object.hasOwnProperty(property) || !object[property]) {
                continue;
            }
            const formKey = namespace ? `${namespace}[${property}]` : property;
            if (object[property] instanceof Date) {
                formData.append(formKey, object[property].toISOString());
            } else if (
                typeof object[property] === 'object' && !(object[property] instanceof File)) {
                this.createFormData(object[property], formData, formKey);
            } else if ( object[property] instanceof FileList ) {
                formData.append(`${property}[]`, object[property]);
            } else {
                formData.append(formKey, object[property]);
            }
        }
        return formData;
    }

    /**
     * Raw request method
     */

    protected request(
        method: string, url: string, data?: any, responseType?: string,
        httpOptions: HttpOptions = {}
    ): Observable<any> {
        const msDelay = Math.floor((Math.random() * 2000) + 1000);
        const header = JSON.parse(JSON.stringify(this._baseHeader));

        if ( this._secureRequest ) {
            const token = this.getToken();
            if ( !token ) {
                console.warn(
                    'Executing a secure request without TOKEN. '
                    + 'Authorization header will not be set!'
                );
            } else { header.Authorization = `Bearer ${token}`; }
            this._secureRequest = false;
        }

        const rType = (responseType ? responseType : 'json' ) as 'text';
        const options = {
            body: method.toLowerCase() === 'get'
                ? {}
                : ( this._withFiles ? this.createFormData( data ) : data ),
            responseType: rType,
            params: method.toLowerCase() === 'get' ? data : {},
            headers: header
        };

        this._withFiles = false;

        return this.http
            .request(
                this._mockData ? 'get' : method, this.buildUrl(url),
                { ...options, ...httpOptions }
            )
            .pipe(takeUntil(this.cancelPending$))
            .pipe(delay( this._mockData ? msDelay : 0 ));
    }
}
