import * as FileSaver from 'file-saver';
import { Injectable, Optional } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, delay, map, tap } from 'rxjs/operators';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common/http";
import * as i2 from "ngx-cookie";
import * as i3 from "./migl-rest-client.config";
export class RestClientService {
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
            .request(this._mockData ? 'get' : method, this.buildUrl(url), { ...options, ...httpOptions })
            .pipe(takeUntil(this.cancelPending$))
            .pipe(delay(this._mockData ? msDelay : 0));
    }
}
RestClientService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: RestClientService, deps: [{ token: i1.HttpClient }, { token: i2.CookieService }, { token: i3.RestServiceConfig, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
RestClientService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: RestClientService, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: RestClientService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: function () { return [{ type: i1.HttpClient }, { type: i2.CookieService }, { type: i3.RestServiceConfig, decorators: [{
                    type: Optional
                }] }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlnbC1yZXN0LWNsaWVudC5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvbWlnbC1yZXN0LWNsaWVudC9zcmMvbGliL21pZ2wtcmVzdC1jbGllbnQuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssU0FBUyxNQUFNLFlBQVksQ0FBQztBQUN4QyxPQUFPLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUlyRCxPQUFPLEVBQWMsT0FBTyxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQzNDLE9BQU8sRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQzs7Ozs7QUF1QjVELE1BQU0sT0FBTyxpQkFBaUI7SUF5RTFCOztPQUVHO0lBQ0gsWUFDWSxJQUFnQixFQUNoQixPQUFzQixFQUNsQixNQUF5QjtRQUY3QixTQUFJLEdBQUosSUFBSSxDQUFZO1FBQ2hCLFlBQU8sR0FBUCxPQUFPLENBQWU7UUE1RWxDOztXQUVHO1FBQ08sbUJBQWMsR0FBcUIsSUFBSSxPQUFPLEVBQVcsQ0FBQztRQUVwRTs7V0FFRztRQUNPLGdCQUFXLEdBQUc7WUFDcEIsUUFBUSxFQUFVLGtCQUFrQjtZQUNwQyxlQUFlLEVBQUcsVUFBVTtZQUM1QixRQUFRLEVBQVUsVUFBVTtZQUM1QixlQUFlLEVBQUcsRUFBRTtTQUN2QixDQUFDO1FBRUY7O1dBRUc7UUFDTyxtQkFBYyxHQUFHLEtBQUssQ0FBQztRQUVqQzs7OztXQUlHO1FBQ08sY0FBUyxHQUFHLEVBQUUsQ0FBQztRQUV6Qjs7V0FFRztRQUNPLGFBQVEsR0FBRyxZQUFZLENBQUM7UUFFbEM7O1dBRUc7UUFDTyxzQkFBaUIsR0FBRyxpQkFBaUIsQ0FBQztRQUVoRDs7OztXQUlHO1FBQ08sY0FBUyxHQUFHLEtBQUssQ0FBQztRQUU1Qjs7V0FFRztRQUNPLGVBQVUsR0FBRyxXQUFXLENBQUM7UUFFbkM7O1dBRUc7UUFDTyxrQkFBYSxHQUFHLFFBQVEsQ0FBQztRQUVuQzs7OztXQUlHO1FBQ08sbUJBQWMsR0FBVyxJQUFJLEdBQUcsQ0FBQyxDQUFDO1FBRTVDOztXQUVHO1FBQ08sa0JBQWEsR0FBRyxLQUFLLENBQUM7UUFFaEM7O1dBRUc7UUFDTyxlQUFVLEdBQUcsS0FBSyxDQUFDO1FBVXpCLElBQUksTUFBTSxFQUFFO1lBQ1IsSUFBSyxNQUFNLENBQUMsUUFBUSxFQUFHO2dCQUFFLElBQUksQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQzthQUFFO1lBQzVELElBQUssTUFBTSxDQUFDLFNBQVMsRUFBRztnQkFBRSxJQUFJLENBQUMsVUFBVSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUM7YUFBRTtZQUMvRCxJQUFLLE1BQU0sQ0FBQyxZQUFZLEVBQUc7Z0JBQUUsSUFBSSxDQUFDLFVBQVUsR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDO2FBQUU7WUFDckUsSUFBSyxNQUFNLENBQUMsWUFBWSxFQUFHO2dCQUFFLElBQUksQ0FBQyxhQUFhLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQzthQUFFO1lBQ3hFLElBQUssTUFBTSxDQUFDLFFBQVEsRUFBRztnQkFBRSxJQUFJLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7YUFBRTtZQUM1RCxJQUFLLE1BQU0sQ0FBQyxhQUFhLEVBQUc7Z0JBQUUsSUFBSSxDQUFDLGNBQWMsR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDO2FBQUU7U0FDOUU7SUFDTCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSSxTQUFTLENBQUUsTUFBeUI7UUFDdkMsSUFBSyxNQUFNLENBQUMsUUFBUSxFQUFHO1lBQUUsSUFBSSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDO1NBQUU7UUFDNUQsSUFBSyxNQUFNLENBQUMsU0FBUyxFQUFHO1lBQUUsSUFBSSxDQUFDLFVBQVUsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDO1NBQUU7UUFDL0QsSUFBSyxNQUFNLENBQUMsWUFBWSxFQUFHO1lBQUUsSUFBSSxDQUFDLFVBQVUsR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDO1NBQUU7UUFDckUsSUFBSyxNQUFNLENBQUMsWUFBWSxFQUFHO1lBQUUsSUFBSSxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDO1NBQUU7UUFDeEUsSUFBSyxNQUFNLENBQUMsUUFBUSxFQUFHO1lBQUUsSUFBSSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDO1NBQUU7UUFDNUQsSUFBSyxNQUFNLENBQUMsYUFBYSxFQUFHO1lBQUUsSUFBSSxDQUFDLGNBQWMsR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDO1NBQUU7UUFDM0UsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVEOztPQUVHO0lBQ0ksUUFBUTtRQUNYLElBQUksS0FBSyxDQUFDO1FBRVYsUUFBUyxJQUFJLENBQUMsYUFBYSxFQUFHO1lBQzFCLEtBQUssUUFBUTtnQkFDVCxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBRSxDQUFDO2dCQUM1QyxNQUFNO1lBQ1YsS0FBSyxjQUFjO2dCQUNmLElBQUksV0FBVyxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUN4RCxJQUFJLFdBQVcsRUFBRTtvQkFDYixLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztpQkFDbkM7Z0JBQ0QsTUFBTTtZQUNWO2dCQUNJLE1BQU0sSUFBSSxLQUFLLENBQUMsOEJBQThCLENBQUMsQ0FBQztTQUN2RDtRQUVELE9BQU8sQ0FBQyxLQUFLLElBQUksT0FBTyxLQUFLLEtBQUssV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztJQUMvRCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNJLFNBQVMsQ0FBRSxRQUFnQixFQUFFLFFBQWdCO1FBQ2hELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxDQUFDO2FBQ2pGLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUNmLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzlCLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixDQUFDO0lBRUQ7O09BRUc7SUFDSSxhQUFhO1FBQ2hCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7SUFDeEQsQ0FBQztJQUVEOztPQUVHO0lBQ0ksTUFBTTtRQUNULFFBQVMsSUFBSSxDQUFDLGFBQWEsRUFBRztZQUMxQixLQUFLLFFBQVE7Z0JBQ1QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDekIsTUFBTTtZQUNWLEtBQUssY0FBYztnQkFDZixZQUFZLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDekMsTUFBTTtZQUNWO2dCQUNJLE1BQU0sSUFBSSxLQUFLLENBQUMsOEJBQThCLENBQUMsQ0FBQztTQUN2RDtJQUNMLENBQUM7SUFFRDs7T0FFRztJQUNJLFlBQVk7UUFDZixPQUFPLElBQUksQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLENBQUM7SUFDbEMsQ0FBQztJQUVEOztPQUVHO0lBQ0kscUJBQXFCO1FBQ3hCLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ25DLENBQUM7SUFFRDs7T0FFRztJQUNJLEdBQUcsQ0FBQyxHQUFXLEVBQUUsSUFBUztRQUM3QixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRUQ7O09BRUc7SUFDSSxJQUFJLENBQ1AsR0FBVyxFQUFFLElBQVMsRUFBRSxZQUFxQixFQUFFLGNBQTJCLEVBQUU7UUFFNUUsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxXQUFXLENBQUMsQ0FBQztJQUN0RSxDQUFDO0lBRUQ7O09BRUc7SUFDSSxHQUFHLENBQ04sR0FBVyxFQUFFLElBQVMsRUFBRSxZQUFxQixFQUFFLGNBQTJCLEVBQUU7UUFFNUUsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxXQUFXLENBQUMsQ0FBQztJQUNyRSxDQUFDO0lBRUQ7O09BRUc7SUFDSSxTQUFTO1FBQ1osSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7UUFDdkIsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVEOztPQUVHO0lBQ0ksTUFBTSxDQUFDLEdBQVcsRUFBRSxJQUFTLEVBQUUsWUFBcUI7UUFDdkQsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQzNELENBQUM7SUFFRDs7Ozs7T0FLRztJQUNJLE9BQU87UUFDVixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztRQUMzQixPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSSxNQUFNO1FBQ1QsSUFBSSxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUM7UUFDNUIsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVEOztPQUVHO0lBQ0ksUUFBUSxDQUFFLEdBQVcsRUFBRSxRQUFnQixFQUFFLElBQVksRUFBRSxJQUFTO1FBQ25FLDZEQUE2RDtRQUM3RCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFFNUQsSUFBSyxJQUFJLENBQUMsY0FBYyxFQUFHO1lBQ3ZCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUM5QixJQUFLLENBQUMsS0FBSyxFQUFHO2dCQUNWLE9BQU8sQ0FBQyxJQUFJLENBQUMsMkNBQTJDLENBQUMsQ0FBQzthQUM3RDtpQkFBTTtnQkFBRSxNQUFNLENBQUMsYUFBYSxHQUFHLFVBQVUsS0FBSyxFQUFFLENBQUM7YUFBRTtZQUNwRCxJQUFJLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQztTQUMvQjtRQUVELE1BQU0sT0FBTyxHQUFHLEVBQUUsWUFBWSxFQUFFLENBQUMsTUFBTSxDQUFZLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLENBQUM7UUFFckYsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxPQUFPLENBQUU7YUFDekQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7YUFDcEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO1lBQ2QsTUFBTSxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQzdDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ2pDLE9BQU8sVUFBVSxDQUFDO1FBQ3RCLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNPLGdCQUFnQjtRQUN0QixNQUFNLENBQUMsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNuRCxPQUFPLENBQUMsQ0FBQztJQUNiLENBQUM7SUFFRDs7T0FFRztJQUNPLFFBQVEsQ0FBRSxLQUFhO1FBQzdCLFFBQVMsSUFBSSxDQUFDLGFBQWEsRUFBRztZQUMxQixLQUFLLFFBQVE7Z0JBQ1QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQ1osSUFBSSxDQUFDLFVBQVUsRUFDZixLQUFLLEVBQ0wsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLEVBQUUsQ0FDbkUsQ0FBQztnQkFDRixNQUFNO1lBQ1YsS0FBSyxjQUFjO2dCQUNmLFlBQVksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDN0MsTUFBTTtZQUNWO2dCQUNJLE1BQU0sSUFBSSxLQUFLLENBQUMsOEJBQThCLENBQUMsQ0FBQztTQUN2RDtJQUNMLENBQUM7SUFFRDs7T0FFRztJQUNPLFFBQVEsQ0FBRSxHQUFXO1FBQzNCLElBQUksSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7UUFDN0UsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO1FBRXRELElBQUssSUFBSSxDQUFDLFNBQVMsSUFBSSxLQUFLLElBQUksSUFBSSxFQUFHO1lBQ25DLElBQUksR0FBRyxHQUFHLElBQUksT0FBTyxDQUFDO1NBQ3pCO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVEOztPQUVHO0lBQ08sY0FBYyxDQUFDLE1BQVcsRUFBRSxJQUFlLEVBQUUsU0FBa0I7UUFDckUsTUFBTSxRQUFRLEdBQUcsSUFBSSxJQUFJLElBQUksUUFBUSxFQUFFLENBQUM7UUFDeEMsS0FBSyxNQUFNLFFBQVEsSUFBSSxNQUFNLEVBQUU7WUFDM0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQ3ZELFNBQVM7YUFDWjtZQUNELE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxTQUFTLElBQUksUUFBUSxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQztZQUNuRSxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsWUFBWSxJQUFJLEVBQUU7Z0JBQ2xDLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO2FBQzVEO2lCQUFNLElBQ0gsT0FBTyxNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssUUFBUSxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFlBQVksSUFBSSxDQUFDLEVBQUU7Z0JBQzdFLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQzthQUM1RDtpQkFBTSxJQUFLLE1BQU0sQ0FBQyxRQUFRLENBQUMsWUFBWSxRQUFRLEVBQUc7Z0JBQy9DLFFBQVEsQ0FBQyxNQUFNLENBQUMsR0FBRyxRQUFRLElBQUksRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQzthQUN0RDtpQkFBTTtnQkFDSCxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQzthQUM5QztTQUNKO1FBQ0QsT0FBTyxRQUFRLENBQUM7SUFDcEIsQ0FBQztJQUVEOztPQUVHO0lBRU8sT0FBTyxDQUNiLE1BQWMsRUFBRSxHQUFXLEVBQUUsSUFBVSxFQUFFLFlBQXFCLEVBQzlELGNBQTJCLEVBQUU7UUFFN0IsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztRQUMxRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFFNUQsSUFBSyxJQUFJLENBQUMsY0FBYyxFQUFHO1lBQ3ZCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUM5QixJQUFLLENBQUMsS0FBSyxFQUFHO2dCQUNWLE9BQU8sQ0FBQyxJQUFJLENBQ1IsNENBQTRDO3NCQUMxQyx1Q0FBdUMsQ0FDNUMsQ0FBQzthQUNMO2lCQUFNO2dCQUFFLE1BQU0sQ0FBQyxhQUFhLEdBQUcsVUFBVSxLQUFLLEVBQUUsQ0FBQzthQUFFO1lBQ3BELElBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDO1NBQy9CO1FBRUQsTUFBTSxLQUFLLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFZLENBQUM7UUFDaEUsTUFBTSxPQUFPLEdBQUc7WUFDWixJQUFJLEVBQUUsTUFBTSxDQUFDLFdBQVcsRUFBRSxLQUFLLEtBQUs7Z0JBQ2hDLENBQUMsQ0FBQyxFQUFFO2dCQUNKLENBQUMsQ0FBQyxDQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUUsSUFBSSxDQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBRTtZQUM5RCxZQUFZLEVBQUUsS0FBSztZQUNuQixNQUFNLEVBQUUsTUFBTSxDQUFDLFdBQVcsRUFBRSxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQ2xELE9BQU8sRUFBRSxNQUFNO1NBQ2xCLENBQUM7UUFFRixJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztRQUV4QixPQUFPLElBQUksQ0FBQyxJQUFJO2FBQ1gsT0FBTyxDQUNKLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQ25ELEVBQUUsR0FBRyxPQUFPLEVBQUUsR0FBRyxXQUFXLEVBQUUsQ0FDakM7YUFDQSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQzthQUNwQyxJQUFJLENBQUMsS0FBSyxDQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUMsQ0FBQztJQUNyRCxDQUFDOzs4R0F6WFEsaUJBQWlCO2tIQUFqQixpQkFBaUIsY0FGZCxNQUFNOzJGQUVULGlCQUFpQjtrQkFIN0IsVUFBVTttQkFBQztvQkFDUixVQUFVLEVBQUUsTUFBTTtpQkFDckI7OzBCQWdGUSxRQUFRIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgRmlsZVNhdmVyIGZyb20gJ2ZpbGUtc2F2ZXInO1xuaW1wb3J0IHsgSW5qZWN0YWJsZSwgT3B0aW9uYWwgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IEh0dHBDbGllbnQsIEh0dHBIZWFkZXJzLCBIdHRwUGFyYW1zIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnO1xuaW1wb3J0IHsgQ29va2llU2VydmljZSB9IGZyb20gJ25neC1jb29raWUnO1xuXG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBTdWJqZWN0IH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyB0YWtlVW50aWwsIGRlbGF5LCBtYXAsIHRhcCB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuaW1wb3J0IHsgUmVzdFNlcnZpY2VDb25maWcgfSBmcm9tICcuL21pZ2wtcmVzdC1jbGllbnQuY29uZmlnJztcblxuZXhwb3J0IGRlY2xhcmUgdHlwZSBIdHRwT2JzZXJ2ZSA9ICdib2R5JyB8ICdldmVudHMnIHwgJ3Jlc3BvbnNlJztcblxuZXhwb3J0IGRlY2xhcmUgaW50ZXJmYWNlIEh0dHBPcHRpb25zIHtcbiAgICBib2R5PzogYW55O1xuICAgIGhlYWRlcnM/OiBIdHRwSGVhZGVycyB8IHtcbiAgICAgICAgW2hlYWRlcjogc3RyaW5nXTogc3RyaW5nIHwgc3RyaW5nW107XG4gICAgfTtcbiAgICBwYXJhbXM/OiBIdHRwUGFyYW1zIHwge1xuICAgICAgICBbcGFyYW06IHN0cmluZ106IHN0cmluZyB8IHN0cmluZ1tdO1xuICAgIH07XG4gICAgb2JzZXJ2ZT86IEh0dHBPYnNlcnZlO1xuICAgIHJlcG9ydFByb2dyZXNzPzogYm9vbGVhbjtcbiAgICByZXNwb25zZVR5cGU/OiAnYXJyYXlidWZmZXInIHwgJ2Jsb2InIHwgJ2pzb24nIHwgJ3RleHQnO1xuICAgIHdpdGhDcmVkZW50aWFscz86IGJvb2xlYW47XG59XG5cbkBJbmplY3RhYmxlKHtcbiAgICBwcm92aWRlZEluOiAncm9vdCdcbn0pXG5leHBvcnQgY2xhc3MgUmVzdENsaWVudFNlcnZpY2Uge1xuXG4gICAgLyoqXG4gICAgICogSGFuZGxlciB1c2VkIHRvIHN0b3AgYWxsIHBlbmRpbmcgcmVxdWVzdHNcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgY2FuY2VsUGVuZGluZyQ6IFN1YmplY3Q8Ym9vbGVhbj4gPSBuZXcgU3ViamVjdDxib29sZWFuPigpO1xuXG4gICAgLyoqXG4gICAgICogRGVmYXVsdCByZXF1ZXN0cyBoZWFkZXJcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgX2Jhc2VIZWFkZXIgPSB7XG4gICAgICAgICdhY2NlcHQnICAgICAgICA6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgJ0NhY2hlLUNvbnRyb2wnIDogJ25vLWNhY2hlJyxcbiAgICAgICAgJ1ByYWdtYScgICAgICAgIDogJ25vLWNhY2hlJyxcbiAgICAgICAgJ0F1dGhvcml6YXRpb24nIDogJydcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogV2hlbiB0cnVlLCB0aGUgcmVxdWVzdCBoZWFkZXIgd2lsbCBpbmNsdWRlIHRoZSBhdXRoZW50aWNhdGlvbiB0b2tlblxuICAgICAqL1xuICAgIHByb3RlY3RlZCBfc2VjdXJlUmVxdWVzdCA9IGZhbHNlO1xuXG4gICAgLyoqXG4gICAgICogUmVzdCBBUEkgZW5kIHBvaW50XG4gICAgICpcbiAgICAgKiBUaGlzIHZhbHVlIHdpbGwgYmUgcHJlcGVuZCB0byB0aGUgcmVxdWVzdCBVUkxcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgX2VuZFBvaW50ID0gJyc7XG5cbiAgICAvKipcbiAgICAgKiBBUEkgQXV0aG9yaXphdGlvbiBVUklcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgX2F1dGhVcmkgPSAnL2F1dGhvcml6ZSc7XG5cbiAgICAvKipcbiAgICAgKiBBUEkgVG9rZW4gVmFsaWRhdGlvbiBVUklcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgX3ZhbGlkYXRlVG9rZW5VcmkgPSAnL3ZhbGlkYXRlLXRva2VuJztcblxuICAgIC8qKlxuICAgICAqIEVuYWJsZSB0aGUgTW9jayBEYXRhIG1vZGVcbiAgICAgKlxuICAgICAqIFdoZW4gTW9jayBEYXRhIGlzIGVuYWJsZWRcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgX21vY2tEYXRhID0gZmFsc2U7XG5cbiAgICAvKipcbiAgICAgKiBOYW1lIHdoZXJlIHRoZSBhdXRob3JpemF0aW9uIHRva2VuIHdpbGwgYmUgc2F2ZVxuICAgICAqL1xuICAgIHByb3RlY3RlZCBfdG9rZW5OYW1lID0gJ0F1dGhUb2tlbic7XG5cbiAgICAvKipcbiAgICAgKiBOYW1lIHdoZXJlIHRoZSBhdXRob3JpemF0aW9uIHRva2VuIHdpbGwgYmUgc2F2ZVxuICAgICAqL1xuICAgIHByb3RlY3RlZCBfdG9rZW5TdG9yYWdlID0gJ2Nvb2tpZSc7XG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIGV4cGlyYXRpb24gRGF0ZVRpbWUgaW4gbWludXRlc1xuICAgICAqXG4gICAgICogVGhlIHZhbHVlIGluIG1pbnV0ZXMgd2lsbCBiZSBhZGQgdG8gRGF0ZXRpbWUgd2hlbiB0aGUgY29va2llIGlzIHNldFxuICAgICAqL1xuICAgIHByb3RlY3RlZCBfY29va2llRXhwaXJlczogbnVtYmVyID0gMTQ0MCAqIDc7XG5cbiAgICAvKipcbiAgICAgKiBXaGVuIHRydWUsIGNvb2tpZXMgb3BlcmF0aW9uIHdpbGwgYmUgYWxsb3cgb25seSB3aGVuIEhUVFBTIGlzIHVzZVxuICAgICAqL1xuICAgIHByb3RlY3RlZCBfc2VjdXJlQ29va2llID0gZmFsc2U7XG5cbiAgICAvKipcbiAgICAgKiBIb2xkcyBhIGxpc3Qgb2YgZmlsZXMgdG8gYmUgdXBsb2FkIG9uIHJlcXVlc3RcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgX3dpdGhGaWxlcyA9IGZhbHNlO1xuXG4gICAgLyoqXG4gICAgICogU2VydmljZSBjbGFzcyBjb25zdHJ1Y3RvclxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBwcml2YXRlIGh0dHA6IEh0dHBDbGllbnQsXG4gICAgICAgIHByaXZhdGUgY29va2llczogQ29va2llU2VydmljZSxcbiAgICAgICAgQE9wdGlvbmFsKCkgY29uZmlnOiBSZXN0U2VydmljZUNvbmZpZ1xuICAgICkge1xuICAgICAgICBpZiAoY29uZmlnKSB7XG4gICAgICAgICAgICBpZiAoIGNvbmZpZy5lbmRQb2ludCApIHsgdGhpcy5fZW5kUG9pbnQgPSBjb25maWcuZW5kUG9pbnQ7IH1cbiAgICAgICAgICAgIGlmICggY29uZmlnLnRva2VuTmFtZSApIHsgdGhpcy5fdG9rZW5OYW1lID0gY29uZmlnLnRva2VuTmFtZTsgfVxuICAgICAgICAgICAgaWYgKCBjb25maWcudG9rZW5TdG9yYWdlICkgeyB0aGlzLl90b2tlbk5hbWUgPSBjb25maWcudG9rZW5TdG9yYWdlOyB9XG4gICAgICAgICAgICBpZiAoIGNvbmZpZy5zZWN1cmVDb29raWUgKSB7IHRoaXMuX3NlY3VyZUNvb2tpZSA9IGNvbmZpZy5zZWN1cmVDb29raWU7IH1cbiAgICAgICAgICAgIGlmICggY29uZmlnLm1vY2tEYXRhICkgeyB0aGlzLl9tb2NrRGF0YSA9IGNvbmZpZy5tb2NrRGF0YTsgfVxuICAgICAgICAgICAgaWYgKCBjb25maWcuY29va2llRXhwaXJlcyApIHsgdGhpcy5fY29va2llRXhwaXJlcyA9IGNvbmZpZy5jb29raWVFeHBpcmVzOyB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIFJlc3QgQ2xpZW50IGNvbmZpZ3VyYXRpb24gcGFyYW1ldGVycy5cbiAgICAgKlxuICAgICAqIENBVVRJT046IFRoaXMgbWV0aG9kIG92ZXJyaWRlIHRoZSBjdXJyZW50IGNvbmZpZ3VyYXRpb24gc2V0dGluZ3NcbiAgICAgKiBhbmQgdGhpcyBzZXR0aW5ncyB3aWxsIGFwcGx5IHRvIGFsbCBmb2xsb3dpbmcgcmVxdWVzdHNcbiAgICAgKi9cbiAgICBwdWJsaWMgY29uZmlndXJlKCBjb25maWc6IFJlc3RTZXJ2aWNlQ29uZmlnICk6IFJlc3RDbGllbnRTZXJ2aWNlIHtcbiAgICAgICAgaWYgKCBjb25maWcuZW5kUG9pbnQgKSB7IHRoaXMuX2VuZFBvaW50ID0gY29uZmlnLmVuZFBvaW50OyB9XG4gICAgICAgIGlmICggY29uZmlnLnRva2VuTmFtZSApIHsgdGhpcy5fdG9rZW5OYW1lID0gY29uZmlnLnRva2VuTmFtZTsgfVxuICAgICAgICBpZiAoIGNvbmZpZy50b2tlblN0b3JhZ2UgKSB7IHRoaXMuX3Rva2VuTmFtZSA9IGNvbmZpZy50b2tlblN0b3JhZ2U7IH1cbiAgICAgICAgaWYgKCBjb25maWcuc2VjdXJlQ29va2llICkgeyB0aGlzLl9zZWN1cmVDb29raWUgPSBjb25maWcuc2VjdXJlQ29va2llOyB9XG4gICAgICAgIGlmICggY29uZmlnLm1vY2tEYXRhICkgeyB0aGlzLl9tb2NrRGF0YSA9IGNvbmZpZy5tb2NrRGF0YTsgfVxuICAgICAgICBpZiAoIGNvbmZpZy5jb29raWVFeHBpcmVzICkgeyB0aGlzLl9jb29raWVFeHBpcmVzID0gY29uZmlnLmNvb2tpZUV4cGlyZXM7IH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBBUEkgVG9rZW4gZnJvbSBjb29raWVzXG4gICAgICovXG4gICAgcHVibGljIGdldFRva2VuKCk6IHN0cmluZyB7XG4gICAgICAgIGxldCB0b2tlbjtcblxuICAgICAgICBzd2l0Y2ggKCB0aGlzLl90b2tlblN0b3JhZ2UgKSB7XG4gICAgICAgICAgICBjYXNlICdjb29raWUnOlxuICAgICAgICAgICAgICAgIHRva2VuID0gdGhpcy5jb29raWVzLmdldCggdGhpcy5fdG9rZW5OYW1lICk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdsb2NhbFN0b3JhZ2UnOlxuICAgICAgICAgICAgICAgIGxldCBzdG9yYWdlRGF0YSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKHRoaXMuX3Rva2VuTmFtZSk7XG4gICAgICAgICAgICAgICAgaWYgKHN0b3JhZ2VEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHRva2VuID0gSlNPTi5wYXJzZShzdG9yYWdlRGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgVG9rZW4gU3RvcmFnZSBtZXRob2QnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAhdG9rZW4gfHwgdHlwZW9mIHRva2VuID09PSAndW5kZWZpbmVkJyA/ICcnIDogdG9rZW47XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVxdWVzdCBhbiBBdXRob3JpemF0aW9uIHRva2VuXG4gICAgICpcbiAgICAgKiBUaGUgZGVmYXVsdCBhdXRob3JpemF0aW9uIFVSSSBpcyAnW0FQSV9FTkRfUE9JTlRdL2F1dGhvcml6ZSdcbiAgICAgKi9cbiAgICBwdWJsaWMgYXV0aG9yaXplKCBVc2VyTmFtZTogc3RyaW5nLCBQYXNzd29yZDogc3RyaW5nICk6IE9ic2VydmFibGU8YW55PiB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlcXVlc3QoJ3Bvc3QnLCB0aGlzLl9hdXRoVXJpLCB7IHVzZXJuYW1lOiBVc2VyTmFtZSwgcGFzc3dvcmQ6IFBhc3N3b3JkIH0pXG4gICAgICAgICAgICAucGlwZSh0YXAoKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFRva2VuKGRhdGEudG9rZW4pO1xuICAgICAgICAgICAgfSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFZhbGlkYXRlIHRoZSBBdXRoZW50aWNhdGlvbiB0b2tlbiBhZ2FpbnN0IHRoZSBBUElcbiAgICAgKi9cbiAgICBwdWJsaWMgdmFsaWRhdGVUb2tlbigpOiBPYnNlcnZhYmxlPGFueT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KCdwb3N0JywgdGhpcy5fdmFsaWRhdGVUb2tlblVyaSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIHRoZSBBdXRoZW50aWNhdGlvbiB0b2tlbiBjb29raWVcbiAgICAgKi9cbiAgICBwdWJsaWMgcmV2b2tlKCk6IHZvaWQge1xuICAgICAgICBzd2l0Y2ggKCB0aGlzLl90b2tlblN0b3JhZ2UgKSB7XG4gICAgICAgICAgICBjYXNlICdjb29raWUnOlxuICAgICAgICAgICAgICAgIHRoaXMuY29va2llcy5yZW1vdmVBbGwoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2xvY2FsU3RvcmFnZSc6XG4gICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0odGhpcy5fdG9rZW5OYW1lKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIFRva2VuIFN0b3JhZ2UgbWV0aG9kJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBpZiB0aGUgY2xpZW50IGlzIGFscmVhZHkgQXV0aGVudGljYXRlXG4gICAgICovXG4gICAgcHVibGljIGlzQXV0aG9yaXplZCgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VG9rZW4oKSAhPT0gJyc7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FuY2VsIGFsbCBwZW5kaW5nIHJlcXVlc3RzXG4gICAgICovXG4gICAgcHVibGljIGNhbmNlbFBlbmRpbmdSZXF1ZXN0cygpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jYW5jZWxQZW5kaW5nJC5uZXh0KHRydWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFQSSByZXF1ZXN0IHVzaW5nIEdFVCBtZXRob2RcbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0KHVybDogc3RyaW5nLCBkYXRhPzoge30pOiBPYnNlcnZhYmxlPGFueT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KCdnZXQnLCB1cmwsIGRhdGEpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFQSSByZXF1ZXN0IHVzaW5nIFBPU1QgbWV0aG9kXG4gICAgICovXG4gICAgcHVibGljIHBvc3QoXG4gICAgICAgIHVybDogc3RyaW5nLCBkYXRhPzoge30sIHJlc3BvbnNlVHlwZT86IHN0cmluZywgaHR0cE9wdGlvbnM6IEh0dHBPcHRpb25zID0ge31cbiAgICApOiBPYnNlcnZhYmxlPGFueT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KCdwb3N0JywgdXJsLCBkYXRhLCByZXNwb25zZVR5cGUsIGh0dHBPcHRpb25zKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBUEkgcmVxdWVzdCB1c2luZyBQVVQgbWV0aG9kXG4gICAgICovXG4gICAgcHVibGljIHB1dChcbiAgICAgICAgdXJsOiBzdHJpbmcsIGRhdGE/OiB7fSwgcmVzcG9uc2VUeXBlPzogc3RyaW5nLCBodHRwT3B0aW9uczogSHR0cE9wdGlvbnMgPSB7fVxuICAgICk6IE9ic2VydmFibGU8YW55PiB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlcXVlc3QoJ3B1dCcsIHVybCwgZGF0YSwgcmVzcG9uc2VUeXBlLCBodHRwT3B0aW9ucyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSB1cGxvYWQgZmlsZSBtb2RlXG4gICAgICovXG4gICAgcHVibGljIHdpdGhGaWxlcyggKTogUmVzdENsaWVudFNlcnZpY2Uge1xuICAgICAgICB0aGlzLl93aXRoRmlsZXMgPSB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBUEkgcmVxdWVzdCB1c2luZyBERUxFVEUgbWV0aG9kXG4gICAgICovXG4gICAgcHVibGljIGRlbGV0ZSh1cmw6IHN0cmluZywgZGF0YT86IHt9LCByZXNwb25zZVR5cGU/OiBzdHJpbmcpOiBPYnNlcnZhYmxlPGFueT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KCdkZWxldGUnLCB1cmwsIGRhdGEsIHJlc3BvbnNlVHlwZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSByZXF1ZXN0IG1vZGUgdG8gU0VDVVJFRCBmb3IgdGhlIG5leHQgcmVxdWVzdC5cbiAgICAgKlxuICAgICAqIFNlY3VyZWQgTW9kZSBmb3JjZSB0aGUgbmV4dCByZXF1ZXN0IHRvIGluY2x1ZGUgdGhlIGF1dGhlbnRpY2F0aW9uIHRva2VuLlxuICAgICAqIFRoZSB0b2tlbiBtdXN0IGJlIHJlcXVlc3RlZCBwcmV2aW91c2x5IHVzaW5nIHRoZSBcImF1dGhvcml6ZVwiIG1ldGhvZC5cbiAgICAgKi9cbiAgICBwdWJsaWMgc2VjdXJlZCgpIHtcbiAgICAgICAgdGhpcy5fc2VjdXJlUmVxdWVzdCA9IHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgcmVxdWVzdCBtb2RlIHRvIFBVQkxJQyBmb3IgdGhlIG5leHQgcmVxdWVzdC5cbiAgICAgKlxuICAgICAqIFB1YmxpYyBpcyB0aGUgZGVmYXVsdCByZXF1ZXN0IG1vZGUgYW5kIGVuc3VyZSB0aGF0IG5vIGF1dGhlbnRpY2F0aW9uIHRva2VuXG4gICAgICogd2lsbCBiZSBwYXNzIG9uIHRoZSBuZXh0IHJlcXVlc3QuXG4gICAgICovXG4gICAgcHVibGljIHB1YmxpYygpIHtcbiAgICAgICAgdGhpcy5fc2VjdXJlUmVxdWVzdCA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0IGEgZmlsZSBmcm9tIGVuZHBvaW50IGFuZCBwYXNzIHRoZSBhdXRoZW50aWNhdGUgdG9rZW4gaWYgcmVxdWlyZWRcbiAgICAgKi9cbiAgICBwdWJsaWMgZG93bmxvYWQoIHVybDogc3RyaW5nLCBmaWxlTmFtZTogc3RyaW5nLCBtaW1lOiBzdHJpbmcsIGRhdGE/OiB7fSk6IE9ic2VydmFibGU8YW55PiB7XG4gICAgICAgIC8vIGNvbnN0IG1zRGVsYXkgPSBNYXRoLmZsb29yKChNYXRoLnJhbmRvbSgpICogMjAwMCkgKyAxMDAwKTtcbiAgICAgICAgY29uc3QgaGVhZGVyID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeSh0aGlzLl9iYXNlSGVhZGVyKSk7XG5cbiAgICAgICAgaWYgKCB0aGlzLl9zZWN1cmVSZXF1ZXN0ICkge1xuICAgICAgICAgICAgY29uc3QgdG9rZW4gPSB0aGlzLmdldFRva2VuKCk7XG4gICAgICAgICAgICBpZiAoICF0b2tlbiApIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ0V4ZWN1dGluZyBhIHNlY3VyZSByZXF1ZXN0IHdpdGhvdXQgVE9LRU4uJyk7XG4gICAgICAgICAgICB9IGVsc2UgeyBoZWFkZXIuQXV0aG9yaXphdGlvbiA9IGBCZWFyZXIgJHt0b2tlbn1gOyB9XG4gICAgICAgICAgICB0aGlzLl9zZWN1cmVSZXF1ZXN0ID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBvcHRpb25zID0geyByZXNwb25zZVR5cGU6ICgnYmxvYicgKSBhcyAndGV4dCcsIHBhcmFtczogZGF0YSwgaGVhZGVyczogaGVhZGVyIH07XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuaHR0cC5yZXF1ZXN0KCAnZ2V0JywgdGhpcy5idWlsZFVybCh1cmwpLCBvcHRpb25zIClcbiAgICAgICAgICAgIC5waXBlKHRha2VVbnRpbCh0aGlzLmNhbmNlbFBlbmRpbmckKSlcbiAgICAgICAgICAgIC5waXBlKG1hcCgocmVzKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgYmxvYiA9IG5ldyBCbG9iKFtyZXNdLCB7IHR5cGU6IG1pbWUgfSk7XG4gICAgICAgICAgICAgICAgRmlsZVNhdmVyLnNhdmVBcyhibG9iLCBmaWxlTmFtZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICdET1dOTE9BRCc7XG4gICAgICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBleHBpcmF0aW9uIERhdGV0aW1lIGZvciBjb29raWVzXG4gICAgICpcbiAgICAgKiBBZGQgKGNvb2tpZUV4cGlyZXMpIG1pbnV0ZXMgdG8gY3VycmVudCBkYXRlXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGdldENvb2tpZUV4cGlyZXMoKTogRGF0ZSB7XG4gICAgICAgIGNvbnN0IGQgPSBuZXcgRGF0ZSgpO1xuICAgICAgICBkLnNldE1pbnV0ZXMoZC5nZXRNaW51dGVzKCkgKyB0aGlzLl9jb29raWVFeHBpcmVzKTtcbiAgICAgICAgcmV0dXJuIGQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2F2ZSB0aGUgQVBJIFRva2VuIGNvb2tpZVxuICAgICAqL1xuICAgIHByb3RlY3RlZCBzZXRUb2tlbiggdG9rZW46IHN0cmluZyApOiB2b2lkIHtcbiAgICAgICAgc3dpdGNoICggdGhpcy5fdG9rZW5TdG9yYWdlICkge1xuICAgICAgICAgICAgY2FzZSAnY29va2llJzpcbiAgICAgICAgICAgICAgICB0aGlzLmNvb2tpZXMucHV0KFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl90b2tlbk5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHRva2VuLFxuICAgICAgICAgICAgICAgICAgICB7IHNlY3VyZTogdGhpcy5fc2VjdXJlQ29va2llLCBleHBpcmVzOiB0aGlzLmdldENvb2tpZUV4cGlyZXMoKSB9XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2xvY2FsU3RvcmFnZSc6XG4gICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0odGhpcy5fdG9rZW5OYW1lLCB0b2tlbik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBUb2tlbiBTdG9yYWdlIG1ldGhvZCcpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQnVpbGQgYSB2YWxpZCBVUkwgY29uY2F0ZW5hdGluZyB0aGUgdXJsIHBhcmFtZXRlciB3aXRoIHRoZSBBcGlFbmRQb2ludFxuICAgICAqL1xuICAgIHByb3RlY3RlZCBidWlsZFVybCggdXJsOiBzdHJpbmcgKTogc3RyaW5nIHtcbiAgICAgICAgbGV0IG5VcmwgPSBgJHt0aGlzLl9lbmRQb2ludC5yZXBsYWNlKC9cXC8kLywgJycpfS8ke3VybC5yZXBsYWNlKC9eXFwvL2csICcnKX1gO1xuICAgICAgICBjb25zdCBtYXRjaCA9IG5VcmwubWF0Y2goL1xcLihbMC05YS16XSspKD86W1xcPyNdfCQpL2kpO1xuXG4gICAgICAgIGlmICggdGhpcy5fbW9ja0RhdGEgJiYgbWF0Y2ggPT0gbnVsbCApIHtcbiAgICAgICAgICAgIG5VcmwgPSBgJHtuVXJsfS5qc29uYDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuVXJsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIEZvcm1EYXRhIG9iamVjdCB0byBiZSBzZW5kIGFzIHJlcXVlc3QgcGF5bG9hZCBkYXRhXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGNyZWF0ZUZvcm1EYXRhKG9iamVjdDogYW55LCBmb3JtPzogRm9ybURhdGEsIG5hbWVzcGFjZT86IHN0cmluZyk6IEZvcm1EYXRhIHtcbiAgICAgICAgY29uc3QgZm9ybURhdGEgPSBmb3JtIHx8IG5ldyBGb3JtRGF0YSgpO1xuICAgICAgICBmb3IgKGNvbnN0IHByb3BlcnR5IGluIG9iamVjdCkge1xuICAgICAgICAgICAgaWYgKCFvYmplY3QuaGFzT3duUHJvcGVydHkocHJvcGVydHkpIHx8ICFvYmplY3RbcHJvcGVydHldKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBmb3JtS2V5ID0gbmFtZXNwYWNlID8gYCR7bmFtZXNwYWNlfVske3Byb3BlcnR5fV1gIDogcHJvcGVydHk7XG4gICAgICAgICAgICBpZiAob2JqZWN0W3Byb3BlcnR5XSBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICAgICAgICAgICAgICBmb3JtRGF0YS5hcHBlbmQoZm9ybUtleSwgb2JqZWN0W3Byb3BlcnR5XS50b0lTT1N0cmluZygpKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgICAgdHlwZW9mIG9iamVjdFtwcm9wZXJ0eV0gPT09ICdvYmplY3QnICYmICEob2JqZWN0W3Byb3BlcnR5XSBpbnN0YW5jZW9mIEZpbGUpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVGb3JtRGF0YShvYmplY3RbcHJvcGVydHldLCBmb3JtRGF0YSwgZm9ybUtleSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCBvYmplY3RbcHJvcGVydHldIGluc3RhbmNlb2YgRmlsZUxpc3QgKSB7XG4gICAgICAgICAgICAgICAgZm9ybURhdGEuYXBwZW5kKGAke3Byb3BlcnR5fVtdYCwgb2JqZWN0W3Byb3BlcnR5XSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvcm1EYXRhLmFwcGVuZChmb3JtS2V5LCBvYmplY3RbcHJvcGVydHldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZm9ybURhdGE7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmF3IHJlcXVlc3QgbWV0aG9kXG4gICAgICovXG5cbiAgICBwcm90ZWN0ZWQgcmVxdWVzdChcbiAgICAgICAgbWV0aG9kOiBzdHJpbmcsIHVybDogc3RyaW5nLCBkYXRhPzogYW55LCByZXNwb25zZVR5cGU/OiBzdHJpbmcsXG4gICAgICAgIGh0dHBPcHRpb25zOiBIdHRwT3B0aW9ucyA9IHt9XG4gICAgKTogT2JzZXJ2YWJsZTxhbnk+IHtcbiAgICAgICAgY29uc3QgbXNEZWxheSA9IE1hdGguZmxvb3IoKE1hdGgucmFuZG9tKCkgKiAyMDAwKSArIDEwMDApO1xuICAgICAgICBjb25zdCBoZWFkZXIgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHRoaXMuX2Jhc2VIZWFkZXIpKTtcblxuICAgICAgICBpZiAoIHRoaXMuX3NlY3VyZVJlcXVlc3QgKSB7XG4gICAgICAgICAgICBjb25zdCB0b2tlbiA9IHRoaXMuZ2V0VG9rZW4oKTtcbiAgICAgICAgICAgIGlmICggIXRva2VuICkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICAgICAgICAgICAgJ0V4ZWN1dGluZyBhIHNlY3VyZSByZXF1ZXN0IHdpdGhvdXQgVE9LRU4uICdcbiAgICAgICAgICAgICAgICAgICAgKyAnQXV0aG9yaXphdGlvbiBoZWFkZXIgd2lsbCBub3QgYmUgc2V0ISdcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBlbHNlIHsgaGVhZGVyLkF1dGhvcml6YXRpb24gPSBgQmVhcmVyICR7dG9rZW59YDsgfVxuICAgICAgICAgICAgdGhpcy5fc2VjdXJlUmVxdWVzdCA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgclR5cGUgPSAocmVzcG9uc2VUeXBlID8gcmVzcG9uc2VUeXBlIDogJ2pzb24nICkgYXMgJ3RleHQnO1xuICAgICAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgICAgICAgYm9keTogbWV0aG9kLnRvTG93ZXJDYXNlKCkgPT09ICdnZXQnXG4gICAgICAgICAgICAgICAgPyB7fVxuICAgICAgICAgICAgICAgIDogKCB0aGlzLl93aXRoRmlsZXMgPyB0aGlzLmNyZWF0ZUZvcm1EYXRhKCBkYXRhICkgOiBkYXRhICksXG4gICAgICAgICAgICByZXNwb25zZVR5cGU6IHJUeXBlLFxuICAgICAgICAgICAgcGFyYW1zOiBtZXRob2QudG9Mb3dlckNhc2UoKSA9PT0gJ2dldCcgPyBkYXRhIDoge30sXG4gICAgICAgICAgICBoZWFkZXJzOiBoZWFkZXJcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLl93aXRoRmlsZXMgPSBmYWxzZTtcblxuICAgICAgICByZXR1cm4gdGhpcy5odHRwXG4gICAgICAgICAgICAucmVxdWVzdChcbiAgICAgICAgICAgICAgICB0aGlzLl9tb2NrRGF0YSA/ICdnZXQnIDogbWV0aG9kLCB0aGlzLmJ1aWxkVXJsKHVybCksXG4gICAgICAgICAgICAgICAgeyAuLi5vcHRpb25zLCAuLi5odHRwT3B0aW9ucyB9XG4gICAgICAgICAgICApXG4gICAgICAgICAgICAucGlwZSh0YWtlVW50aWwodGhpcy5jYW5jZWxQZW5kaW5nJCkpXG4gICAgICAgICAgICAucGlwZShkZWxheSggdGhpcy5fbW9ja0RhdGEgPyBtc0RlbGF5IDogMCApKTtcbiAgICB9XG59XG4iXX0=