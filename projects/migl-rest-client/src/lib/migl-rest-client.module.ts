import { ModuleWithProviders, NgModule} from '@angular/core';
import { CookieModule, CookieService } from 'ngx-cookie';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import { RestClientService } from './migl-rest-client.service';
import { RestServiceConfig } from './migl-rest-client.config';

@NgModule({
    imports: [
        HttpClientModule,
        CookieModule.forRoot()
    ],
    providers: [
        HttpClient,
        CookieService,
        RestClientService
    ]
})
export class RestClientModule {
    public static forRoot( config?: RestServiceConfig ): ModuleWithProviders<RestClientModule> {
        return {
            ngModule: RestClientModule,
            providers: [
                {provide: RestServiceConfig, useValue: config }
            ]
        };
    }
}
