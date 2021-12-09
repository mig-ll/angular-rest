import * as FileSaver from 'file-saver';
import * as i0 from '@angular/core';
import { Injectable, Optional, NgModule } from '@angular/core';
import { Subject } from 'rxjs';
import { tap, takeUntil, map, delay } from 'rxjs/operators';
import * as i1 from '@angular/common/http';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import * as i2 from 'ngx-cookie';
import { CookieService, CookieModule } from 'ngx-cookie';

class RestServiceConfig {
}

class RestClientService {
    /**
     * Service class constructor
     */
    constructor(http, cookies, config) {
        this.http = http;
        this.cookies = cookies;
        /**
         * Handler used to stop all pending requests
         */
        this.cancelPending$ = new Subject();
        /**
         * Default requests header
         */
        this._baseHeader = {
            'accept': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Authorization': ''
        };
        /**
         * When true, the request header will include the authentication token
         */
        this._secureRequest = false;
        /**
         * Rest API end point
         *
         * This value will be prepend to the request URL
         */
        this._endPoint = '';
        /**
         * API Authorization URI
         */
        this._authUri = '/authorize';
        /**
         * API Token Validation URI
         */
        this._validateTokenUri = '/validate-token';
        /**
         * Enable the Mock Data mode
         *
         * When Mock Data is enabled
         */
        this._mockData = false;
        /**
         * Name where the authorization token will be save
         */
        this._tokenName = 'AuthToken';
        /**
         * Name where the authorization token will be save
         */
        this._tokenStorage = 'cookie';
        /**
         * Set the expiration DateTime in minutes
         *
         * The value in minutes will be add to Datetime when the cookie is set
         */
        this._cookieExpires = 1440 * 7;
        /**
         * When true, cookies operation will be allow only when HTTPS is use
         */
        this._secureCookie = false;
        /**
         * Holds a list of files to be upload on request
         */
        this._withFiles = false;
        if (config) {
            if (config.endPoint) {
                this._endPoint = config.endPoint;
            }
            if (config.tokenName) {
                this._tokenName = config.tokenName;
            }
            if (config.tokenStorage) {
                this._tokenName = config.tokenStorage;
            }
            if (config.secureCookie) {
                this._secureCookie = config.secureCookie;
            }
            if (config.mockData) {
                this._mockData = config.mockData;
            }
            if (config.cookieExpires) {
                this._cookieExpires = config.cookieExpires;
            }
        }
    }
    /**
     * Set the Rest Client configuration parameters.
     *
     * CAUTION: This method override the current configuration settings
     * and this settings will apply to all following requests
     */
    configure(config) {
        if (config.endPoint) {
            this._endPoint = config.endPoint;
        }
        if (config.tokenName) {
            this._tokenName = config.tokenName;
        }
        if (config.tokenStorage) {
            this._tokenName = config.tokenStorage;
        }
        if (config.secureCookie) {
            this._secureCookie = config.secureCookie;
        }
        if (config.mockData) {
            this._mockData = config.mockData;
        }
        if (config.cookieExpires) {
            this._cookieExpires = config.cookieExpires;
        }
        return this;
    }
    /**
     * Get the API Token from cookies
     */
    getToken() {
        let token;
        switch (this._tokenStorage) {
            case 'cookie':
                token = this.cookies.get(this._tokenName);
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
    authorize(UserName, Password) {
        return this.request('post', this._authUri, { username: UserName, password: Password })
            .pipe(tap((data) => {
            this.setToken(data.token);
        }));
    }
    /**
     * Validate the Authentication token against the API
     */
    validateToken() {
        return this.request('post', this._validateTokenUri);
    }
    /**
     * Remove the Authentication token cookie
     */
    revoke() {
        switch (this._tokenStorage) {
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
    isAuthorized() {
        return this.getToken() !== '';
    }
    /**
     * Cancel all pending requests
     */
    cancelPendingRequests() {
        this.cancelPending$.next(true);
    }
    /**
     * API request using GET method
     */
    get(url, data) {
        return this.request('get', url, data);
    }
    /**
     * API request using POST method
     */
    post(url, data, responseType, httpOptions = {}) {
        return this.request('post', url, data, responseType, httpOptions);
    }
    /**
     * API request using PUT method
     */
    put(url, data, responseType, httpOptions = {}) {
        return this.request('put', url, data, responseType, httpOptions);
    }
    /**
     * Set the upload file mode
     */
    withFiles() {
        this._withFiles = true;
        return this;
    }
    /**
     * API request using DELETE method
     */
    delete(url, data, responseType) {
        return this.request('delete', url, data, responseType);
    }
    /**
     * Set the request mode to SECURED for the next request.
     *
     * Secured Mode force the next request to include the authentication token.
     * The token must be requested previously using the "authorize" method.
     */
    secured() {
        this._secureRequest = true;
        return this;
    }
    /**
     * Set the request mode to PUBLIC for the next request.
     *
     * Public is the default request mode and ensure that no authentication token
     * will be pass on the next request.
     */
    public() {
        this._secureRequest = false;
        return this;
    }
    /**
     * Request a file from endpoint and pass the authenticate token if required
     */
    download(url, fileName, mime, data) {
        // const msDelay = Math.floor((Math.random() * 2000) + 1000);
        const header = JSON.parse(JSON.stringify(this._baseHeader));
        if (this._secureRequest) {
            const token = this.getToken();
            if (!token) {
                console.warn('Executing a secure request without TOKEN.');
            }
            else {
                header.Authorization = `Bearer ${token}`;
            }
            this._secureRequest = false;
        }
        const options = { responseType: ('blob'), params: data, headers: header };
        return this.http.request('get', this.buildUrl(url), options)
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
    getCookieExpires() {
        const d = new Date();
        d.setMinutes(d.getMinutes() + this._cookieExpires);
        return d;
    }
    /**
     * Save the API Token cookie
     */
    setToken(token) {
        switch (this._tokenStorage) {
            case 'cookie':
                this.cookies.put(this._tokenName, token, { secure: this._secureCookie, expires: this.getCookieExpires() });
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
    buildUrl(url) {
        let nUrl = `${this._endPoint.replace(/\/$/, '')}/${url.replace(/^\//g, '')}`;
        const match = nUrl.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
        if (this._mockData && match == null) {
            nUrl = `${nUrl}.json`;
        }
        return nUrl;
    }
    /**
     * Create a FormData object to be send as request payload data
     */
    createFormData(object, form, namespace) {
        const formData = form || new FormData();
        for (const property in object) {
            if (!object.hasOwnProperty(property) || !object[property]) {
                continue;
            }
            const formKey = namespace ? `${namespace}[${property}]` : property;
            if (object[property] instanceof Date) {
                formData.append(formKey, object[property].toISOString());
            }
            else if (typeof object[property] === 'object' && !(object[property] instanceof File)) {
                this.createFormData(object[property], formData, formKey);
            }
            else if (object[property] instanceof FileList) {
                formData.append(`${property}[]`, object[property]);
            }
            else {
                formData.append(formKey, object[property]);
            }
        }
        return formData;
    }
    /**
     * Raw request method
     */
    request(method, url, data, responseType, httpOptions = {}) {
        const msDelay = Math.floor((Math.random() * 2000) + 1000);
        const header = JSON.parse(JSON.stringify(this._baseHeader));
        if (this._secureRequest) {
            const token = this.getToken();
            if (!token) {
                console.warn('Executing a secure request without TOKEN. '
                    + 'Authorization header will not be set!');
            }
            else {
                header.Authorization = `Bearer ${token}`;
            }
            this._secureRequest = false;
        }
        const rType = (responseType ? responseType : 'json');
        const options = {
            body: method.toLowerCase() === 'get'
                ? {}
                : (this._withFiles ? this.createFormData(data) : data),
            responseType: rType,
            params: method.toLowerCase() === 'get' ? data : {},
            headers: header
        };
        this._withFiles = false;
        return this.http
            .request(this._mockData ? 'get' : method, this.buildUrl(url), Object.assign(Object.assign({}, options), httpOptions))
            .pipe(takeUntil(this.cancelPending$))
            .pipe(delay(this._mockData ? msDelay : 0));
    }
}
RestClientService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: RestClientService, deps: [{ token: i1.HttpClient }, { token: i2.CookieService }, { token: RestServiceConfig, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
RestClientService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: RestClientService, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: RestClientService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: function () {
        return [{ type: i1.HttpClient }, { type: i2.CookieService }, { type: RestServiceConfig, decorators: [{
                        type: Optional
                    }] }];
    } });

class RestClientModule {
    static forRoot(config) {
        return {
            ngModule: RestClientModule,
            providers: [
                { provide: RestServiceConfig, useValue: config }
            ]
        };
    }
}
RestClientModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: RestClientModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
RestClientModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: RestClientModule, imports: [HttpClientModule, i2.CookieModule] });
RestClientModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: RestClientModule, providers: [
        HttpClient,
        CookieService,
        RestClientService
    ], imports: [[
            HttpClientModule,
            CookieModule.forRoot()
        ]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: RestClientModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [
                        HttpClientModule,
                        CookieModule.forRoot()
                    ],
                    providers: [
                        HttpClient,
                        CookieService,
                        RestClientService
                    ]
                }]
        }] });

/*
 * Public API Surface of migl-rest-client
 */

/**
 * Generated bundle index. Do not edit.
 */

export { RestClientModule, RestClientService, RestServiceConfig };
//# sourceMappingURL=migl-rest-client.mjs.map
