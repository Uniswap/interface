/// <reference types="node" />
/// <reference types="node" />
import type { __ApiPreviewProps } from './api-utils';
import type { CustomRoutes } from '../lib/load-custom-routes';
import type { DomainLocale } from './config';
import type { DynamicRoutes, PageChecker, Route } from './router';
import type { FontManifest, FontConfig } from './font-utils';
import type { LoadComponentsReturnType } from './load-components';
import type { RouteMatch } from '../shared/lib/router/utils/route-matcher';
import type { MiddlewareRouteMatch } from '../shared/lib/router/utils/middleware-route-matcher';
import type { Params } from '../shared/lib/router/utils/route-matcher';
import type { NextConfig, NextConfigComplete } from './config-shared';
import type { NextParsedUrlQuery, NextUrlWithParsedQuery } from './request-meta';
import type { ParsedUrlQuery } from 'querystring';
import type { RenderOpts, RenderOptsPartial } from './render';
import type { ResponseCacheBase } from './response-cache';
import type { UrlWithParsedQuery } from 'url';
import type { ServerRuntime } from 'next/types';
import type { PagesManifest } from '../build/webpack/plugins/pages-manifest-plugin';
import type { BaseNextRequest, BaseNextResponse } from './base-http';
import type { PayloadOptions } from './send-payload';
import type { PrerenderManifest } from '../build';
import Router from './router';
import RenderResult from './render-result';
import { ImageConfigComplete } from '../shared/lib/image-config';
import { MiddlewareMatcher } from '../build/analysis/get-page-static-info';
export declare type FindComponentsResult = {
    components: LoadComponentsReturnType;
    query: NextParsedUrlQuery;
};
export interface RoutingItem {
    page: string;
    match: RouteMatch;
    re?: RegExp;
}
export interface MiddlewareRoutingItem {
    page: string;
    match: MiddlewareRouteMatch;
    matchers?: MiddlewareMatcher[];
}
export interface Options {
    /**
     * Object containing the configuration next.config.js
     */
    conf: NextConfig;
    /**
     * Set to false when the server was created by Next.js
     */
    customServer?: boolean;
    /**
     * Tells if Next.js is running in dev mode
     */
    dev?: boolean;
    /**
     * Where the Next project is located
     */
    dir?: string;
    /**
     * Tells if Next.js is running in a Serverless platform
     */
    minimalMode?: boolean;
    /**
     * Hide error messages containing server information
     */
    quiet?: boolean;
    /**
     * The hostname the server is running behind
     */
    hostname?: string;
    /**
     * The port the server is running behind
     */
    port?: number;
    /**
     * The HTTP Server that Next.js is running behind
     */
    httpServer?: import('http').Server;
}
export interface BaseRequestHandler {
    (req: BaseNextRequest, res: BaseNextResponse, parsedUrl?: NextUrlWithParsedQuery | undefined): Promise<void>;
}
export declare type RequestContext = {
    req: BaseNextRequest;
    res: BaseNextResponse;
    pathname: string;
    query: NextParsedUrlQuery;
    renderOpts: RenderOptsPartial;
};
export declare class NoFallbackError extends Error {
}
export declare class WrappedBuildError extends Error {
    innerError: Error;
    constructor(innerError: Error);
}
declare type ResponsePayload = {
    type: 'html' | 'json';
    body: RenderResult;
    revalidateOptions?: any;
};
export declare function prepareServerlessUrl(req: BaseNextRequest, query: ParsedUrlQuery): void;
export default abstract class Server<ServerOptions extends Options = Options> {
    protected dir: string;
    protected quiet: boolean;
    protected nextConfig: NextConfigComplete;
    protected distDir: string;
    protected publicDir: string;
    protected hasStaticDir: boolean;
    protected pagesManifest?: PagesManifest;
    protected appPathsManifest?: PagesManifest;
    protected buildId: string;
    protected minimalMode: boolean;
    protected renderOpts: {
        poweredByHeader: boolean;
        buildId: string;
        generateEtags: boolean;
        runtimeConfig?: {
            [key: string]: any;
        };
        assetPrefix?: string;
        canonicalBase: string;
        dev?: boolean;
        previewProps: __ApiPreviewProps;
        customServer?: boolean;
        ampOptimizerConfig?: {
            [key: string]: any;
        };
        basePath: string;
        optimizeFonts: FontConfig;
        images: ImageConfigComplete;
        fontManifest?: FontManifest;
        disableOptimizedLoading?: boolean;
        optimizeCss: any;
        nextScriptWorkers: any;
        locale?: string;
        locales?: string[];
        defaultLocale?: string;
        domainLocales?: DomainLocale[];
        distDir: string;
        runtime?: ServerRuntime;
        serverComponents?: boolean;
        crossOrigin?: string;
        supportsDynamicHTML?: boolean;
        serverComponentManifest?: any;
        serverCSSManifest?: any;
        renderServerComponentData?: boolean;
        serverComponentProps?: any;
        largePageDataBytes?: number;
    };
    protected serverOptions: ServerOptions;
    private responseCache;
    protected router: Router;
    protected dynamicRoutes?: DynamicRoutes;
    protected appPathRoutes?: Record<string, string[]>;
    protected customRoutes: CustomRoutes;
    protected serverComponentManifest?: any;
    protected serverCSSManifest?: any;
    readonly hostname?: string;
    readonly port?: number;
    protected abstract getPublicDir(): string;
    protected abstract getHasStaticDir(): boolean;
    protected abstract getPagesManifest(): PagesManifest | undefined;
    protected abstract getAppPathsManifest(): PagesManifest | undefined;
    protected abstract getBuildId(): string;
    protected abstract getFilesystemPaths(): Set<string>;
    protected abstract findPageComponents(params: {
        pathname: string;
        query: NextParsedUrlQuery;
        params: Params;
        isAppPath: boolean;
        appPaths?: string[] | null;
        sriEnabled?: boolean;
    }): Promise<FindComponentsResult | null>;
    protected abstract getFontManifest(): FontManifest | undefined;
    protected abstract getPrerenderManifest(): PrerenderManifest;
    protected abstract getServerComponentManifest(): any;
    protected abstract getServerCSSManifest(): any;
    protected abstract attachRequestMeta(req: BaseNextRequest, parsedUrl: NextUrlWithParsedQuery): void;
    protected abstract getFallback(page: string): Promise<string>;
    protected abstract getCustomRoutes(): CustomRoutes;
    protected abstract hasPage(pathname: string): Promise<boolean>;
    protected abstract generateRoutes(): {
        headers: Route[];
        rewrites: {
            beforeFiles: Route[];
            afterFiles: Route[];
            fallback: Route[];
        };
        fsRoutes: Route[];
        redirects: Route[];
        catchAllRoute: Route;
        catchAllMiddleware: Route[];
        pageChecker: PageChecker;
        useFileSystemPublicRoutes: boolean;
        dynamicRoutes: DynamicRoutes | undefined;
        nextConfig: NextConfig;
    };
    protected abstract sendRenderResult(req: BaseNextRequest, res: BaseNextResponse, options: {
        result: RenderResult;
        type: 'html' | 'json';
        generateEtags: boolean;
        poweredByHeader: boolean;
        options?: PayloadOptions;
    }): Promise<void>;
    protected abstract runApi(req: BaseNextRequest, res: BaseNextResponse, query: ParsedUrlQuery, params: Params | undefined, page: string, builtPagePath: string): Promise<boolean>;
    protected abstract renderHTML(req: BaseNextRequest, res: BaseNextResponse, pathname: string, query: NextParsedUrlQuery, renderOpts: RenderOpts): Promise<RenderResult | null>;
    protected abstract handleCompression(req: BaseNextRequest, res: BaseNextResponse): void;
    protected abstract getResponseCache(options: {
        dev: boolean;
    }): ResponseCacheBase;
    protected abstract loadEnvConfig(params: {
        dev: boolean;
        forceReload?: boolean;
    }): void;
    constructor(options: ServerOptions);
    logError(err: Error): void;
    private handleRequest;
    getRequestHandler(): BaseRequestHandler;
    protected handleUpgrade(_req: BaseNextRequest, _socket: any, _head?: any): Promise<void>;
    setAssetPrefix(prefix?: string): void;
    prepare(): Promise<void>;
    protected close(): Promise<void>;
    protected getPreviewProps(): __ApiPreviewProps;
    protected _beforeCatchAllRender(_req: BaseNextRequest, _res: BaseNextResponse, _params: Params, _parsedUrl: UrlWithParsedQuery): Promise<boolean>;
    protected getDynamicRoutes(): Array<RoutingItem>;
    protected getAppPathRoutes(): Record<string, string[]>;
    protected run(req: BaseNextRequest, res: BaseNextResponse, parsedUrl: UrlWithParsedQuery): Promise<void>;
    private pipe;
    private getStaticHTML;
    render(req: BaseNextRequest, res: BaseNextResponse, pathname: string, query?: NextParsedUrlQuery, parsedUrl?: NextUrlWithParsedQuery, internalRender?: boolean): Promise<void>;
    protected getStaticPaths({ pathname, }: {
        pathname: string;
        originalAppPath?: string;
    }): Promise<{
        staticPaths?: string[];
        fallbackMode?: 'static' | 'blocking' | false;
    }>;
    private renderToResponseWithComponents;
    private stripNextDataPath;
    protected getOriginalAppPaths(route: string): string[] | null;
    protected renderPageComponent(ctx: RequestContext, bubbleNoFallback: boolean): Promise<false | ResponsePayload | null>;
    private renderToResponse;
    renderToHTML(req: BaseNextRequest, res: BaseNextResponse, pathname: string, query?: ParsedUrlQuery): Promise<string | null>;
    renderError(err: Error | null, req: BaseNextRequest, res: BaseNextResponse, pathname: string, query?: NextParsedUrlQuery, setHeaders?: boolean): Promise<void>;
    private customErrorNo404Warn;
    private renderErrorToResponse;
    renderErrorToHTML(err: Error | null, req: BaseNextRequest, res: BaseNextResponse, pathname: string, query?: ParsedUrlQuery): Promise<string | null>;
    protected getFallbackErrorComponents(): Promise<LoadComponentsReturnType | null>;
    render404(req: BaseNextRequest, res: BaseNextResponse, parsedUrl?: NextUrlWithParsedQuery, setHeaders?: boolean): Promise<void>;
}
export {};
