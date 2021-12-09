import { NgModule } from '@angular/core';
import { CookieModule, CookieService } from 'ngx-cookie';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RestClientService } from './migl-rest-client.service';
import { RestServiceConfig } from './migl-rest-client.config';
import * as i0 from "@angular/core";
import * as i1 from "ngx-cookie";
export class RestClientModule {
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
RestClientModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: RestClientModule, imports: [HttpClientModule, i1.CookieModule] });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlnbC1yZXN0LWNsaWVudC5tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9taWdsLXJlc3QtY2xpZW50L3NyYy9saWIvbWlnbC1yZXN0LWNsaWVudC5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUF1QixRQUFRLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDN0QsT0FBTyxFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFDekQsT0FBTyxFQUFFLFVBQVUsRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBRXBFLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBQy9ELE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLDJCQUEyQixDQUFDOzs7QUFhOUQsTUFBTSxPQUFPLGdCQUFnQjtJQUNsQixNQUFNLENBQUMsT0FBTyxDQUFFLE1BQTBCO1FBQzdDLE9BQU87WUFDSCxRQUFRLEVBQUUsZ0JBQWdCO1lBQzFCLFNBQVMsRUFBRTtnQkFDUCxFQUFDLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFO2FBQ2xEO1NBQ0osQ0FBQztJQUNOLENBQUM7OzZHQVJRLGdCQUFnQjs4R0FBaEIsZ0JBQWdCLFlBVHJCLGdCQUFnQjs4R0FTWCxnQkFBZ0IsYUFOZDtRQUNQLFVBQVU7UUFDVixhQUFhO1FBQ2IsaUJBQWlCO0tBQ3BCLFlBUlE7WUFDTCxnQkFBZ0I7WUFDaEIsWUFBWSxDQUFDLE9BQU8sRUFBRTtTQUN6QjsyRkFPUSxnQkFBZ0I7a0JBWDVCLFFBQVE7bUJBQUM7b0JBQ04sT0FBTyxFQUFFO3dCQUNMLGdCQUFnQjt3QkFDaEIsWUFBWSxDQUFDLE9BQU8sRUFBRTtxQkFDekI7b0JBQ0QsU0FBUyxFQUFFO3dCQUNQLFVBQVU7d0JBQ1YsYUFBYTt3QkFDYixpQkFBaUI7cUJBQ3BCO2lCQUNKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTW9kdWxlV2l0aFByb3ZpZGVycywgTmdNb2R1bGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgQ29va2llTW9kdWxlLCBDb29raWVTZXJ2aWNlIH0gZnJvbSAnbmd4LWNvb2tpZSc7XG5pbXBvcnQgeyBIdHRwQ2xpZW50LCBIdHRwQ2xpZW50TW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnO1xuXG5pbXBvcnQgeyBSZXN0Q2xpZW50U2VydmljZSB9IGZyb20gJy4vbWlnbC1yZXN0LWNsaWVudC5zZXJ2aWNlJztcbmltcG9ydCB7IFJlc3RTZXJ2aWNlQ29uZmlnIH0gZnJvbSAnLi9taWdsLXJlc3QtY2xpZW50LmNvbmZpZyc7XG5cbkBOZ01vZHVsZSh7XG4gICAgaW1wb3J0czogW1xuICAgICAgICBIdHRwQ2xpZW50TW9kdWxlLFxuICAgICAgICBDb29raWVNb2R1bGUuZm9yUm9vdCgpXG4gICAgXSxcbiAgICBwcm92aWRlcnM6IFtcbiAgICAgICAgSHR0cENsaWVudCxcbiAgICAgICAgQ29va2llU2VydmljZSxcbiAgICAgICAgUmVzdENsaWVudFNlcnZpY2VcbiAgICBdXG59KVxuZXhwb3J0IGNsYXNzIFJlc3RDbGllbnRNb2R1bGUge1xuICAgIHB1YmxpYyBzdGF0aWMgZm9yUm9vdCggY29uZmlnPzogUmVzdFNlcnZpY2VDb25maWcgKTogTW9kdWxlV2l0aFByb3ZpZGVyczxSZXN0Q2xpZW50TW9kdWxlPiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBuZ01vZHVsZTogUmVzdENsaWVudE1vZHVsZSxcbiAgICAgICAgICAgIHByb3ZpZGVyczogW1xuICAgICAgICAgICAgICAgIHtwcm92aWRlOiBSZXN0U2VydmljZUNvbmZpZywgdXNlVmFsdWU6IGNvbmZpZyB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxufVxuIl19