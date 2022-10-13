import type { NextConfig } from '../server/config';
export declare type RouteHas = {
    type: 'header' | 'query' | 'cookie';
    key: string;
    value?: string;
} | {
    type: 'host';
    key?: undefined;
    value: string;
};
export declare type Rewrite = {
    source: string;
    destination: string;
    basePath?: false;
    locale?: false;
    has?: RouteHas[];
};
export declare type Header = {
    source: string;
    basePath?: false;
    locale?: false;
    headers: Array<{
        key: string;
        value: string;
    }>;
    has?: RouteHas[];
};
export declare type Redirect = {
    source: string;
    destination: string;
    basePath?: false;
    locale?: false;
    has?: RouteHas[];
} & ({
    statusCode?: never;
    permanent: boolean;
} | {
    statusCode: number;
    permanent?: never;
});
export declare type Middleware = {
    source: string;
    locale?: false;
    has?: RouteHas[];
};
export declare function normalizeRouteRegex(regex: string): string;
export declare type RouteType = 'rewrite' | 'redirect' | 'header';
export declare function checkCustomRoutes(routes: Redirect[] | Header[] | Rewrite[] | Middleware[], type: RouteType | 'middleware'): void;
export interface CustomRoutes {
    headers: Header[];
    rewrites: {
        fallback: Rewrite[];
        afterFiles: Rewrite[];
        beforeFiles: Rewrite[];
    };
    redirects: Redirect[];
}
export default function loadCustomRoutes(config: NextConfig): Promise<CustomRoutes>;
