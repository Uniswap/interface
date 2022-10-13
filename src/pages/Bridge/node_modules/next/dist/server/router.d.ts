/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import type { NextConfig } from './config';
import type { ParsedUrlQuery } from 'querystring';
import type { BaseNextRequest, BaseNextResponse } from './base-http';
import type { RouteMatch, Params } from '../shared/lib/router/utils/route-matcher';
import type { RouteHas } from '../lib/load-custom-routes';
import { NextUrlWithParsedQuery } from './request-meta';
declare type RouteResult = {
    finished: boolean;
    pathname?: string;
    query?: ParsedUrlQuery;
};
export declare type Route = {
    match: RouteMatch;
    has?: RouteHas[];
    type: string;
    check?: boolean;
    statusCode?: number;
    name: string;
    matchesBasePath?: true;
    matchesLocale?: true;
    matchesLocaleAPIRoutes?: true;
    matchesTrailingSlash?: true;
    internal?: true;
    fn: (req: BaseNextRequest, res: BaseNextResponse, params: Params, parsedUrl: NextUrlWithParsedQuery, upgradeHead?: Buffer) => Promise<RouteResult> | RouteResult;
};
export declare type DynamicRoutes = Array<{
    page: string;
    match: RouteMatch;
}>;
export declare type PageChecker = (pathname: string) => Promise<boolean>;
export default class Router {
    catchAllMiddleware: ReadonlyArray<Route>;
    private readonly headers;
    private readonly fsRoutes;
    private readonly redirects;
    private readonly rewrites;
    private readonly catchAllRoute;
    private readonly pageChecker;
    private dynamicRoutes;
    private readonly useFileSystemPublicRoutes;
    private readonly nextConfig;
    private compiledRoutes;
    private needsRecompilation;
    /**
     * context stores information used by the router.
     */
    private readonly context;
    constructor({ headers, fsRoutes, rewrites, redirects, catchAllRoute, catchAllMiddleware, dynamicRoutes, pageChecker, useFileSystemPublicRoutes, nextConfig, }: {
        headers: ReadonlyArray<Route>;
        fsRoutes: ReadonlyArray<Route>;
        rewrites: {
            beforeFiles: ReadonlyArray<Route>;
            afterFiles: ReadonlyArray<Route>;
            fallback: ReadonlyArray<Route>;
        };
        redirects: ReadonlyArray<Route>;
        catchAllRoute: Route;
        catchAllMiddleware: ReadonlyArray<Route>;
        dynamicRoutes: DynamicRoutes | undefined;
        pageChecker: PageChecker;
        useFileSystemPublicRoutes: boolean;
        nextConfig: NextConfig;
    });
    private checkPage;
    get locales(): string[];
    get basePath(): string;
    setDynamicRoutes(dynamicRoutes: DynamicRoutes): void;
    setCatchallMiddleware(catchAllMiddleware: ReadonlyArray<Route>): void;
    addFsRoute(fsRoute: Route): void;
    private compileRoutes;
    private checkFsRoutes;
    execute(req: BaseNextRequest, res: BaseNextResponse, parsedUrl: NextUrlWithParsedQuery, upgradeHead?: Buffer): Promise<boolean>;
}
export {};
