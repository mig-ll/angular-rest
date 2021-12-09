import { ModuleWithProviders } from '@angular/core';
import { RestServiceConfig } from './migl-rest-client.config';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common/http";
import * as i2 from "ngx-cookie";
export declare class RestClientModule {
    static forRoot(config?: RestServiceConfig): ModuleWithProviders<RestClientModule>;
    static ɵfac: i0.ɵɵFactoryDeclaration<RestClientModule, never>;
    static ɵmod: i0.ɵɵNgModuleDeclaration<RestClientModule, never, [typeof i1.HttpClientModule, typeof i2.CookieModule], never>;
    static ɵinj: i0.ɵɵInjectorDeclaration<RestClientModule>;
}
