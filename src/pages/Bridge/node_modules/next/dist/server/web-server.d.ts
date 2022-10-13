/// <reference types="node" />
import type { WebNextRequest, WebNextResponse } from './base-http/web';
import type { RenderOpts } from './render';
import type RenderResult from './render-result';
import type { NextParsedUrlQuery, NextUrlWithParsedQuery } from './request-meta';
import type { Params } from '../shared/lib/router/utils/route-matcher';
import type { PayloadOptions } from './send-payload';
import type { LoadComponentsReturnType } from './load-components';
import { Options } from './base-server';
import type { DynamicRoutes, PageChecker, Route } from './router';
import type { NextConfig } from './config-shared';
import BaseServer from './base-server';
import WebResponseCache from './response-cache/web';
import type { BaseNextRequest, BaseNextResponse } from './base-http';
import type { UrlWithParsedQuery } from 'url';
interface WebServerOptions extends Options {
    webServerConfig: {
        page: string;
        loadComponent: (pathname: string) => Promise<LoadComponentsReturnType | null>;
        extendRenderOpts: Partial<BaseServer['renderOpts']> & Pick<BaseServer['renderOpts'], 'buildId'>;
        pagesRenderToHTML?: typeof import('./render').renderToHTML;
        appRenderToHTML?: typeof import('./app-render').renderToHTMLOrFlight;
    };
}
export default class NextWebServer extends BaseServer<WebServerOptions> {
    constructor(options: WebServerOptions);
    protected handleCompression(): void;
    protected getResponseCache(): WebResponseCache;
    protected getCustomRoutes(): {
        headers: never[];
        rewrites: {
            fallback: never[];
            afterFiles: never[];
            beforeFiles: never[];
        };
        redirects: never[];
    };
    protected run(req: BaseNextRequest, res: BaseNextResponse, parsedUrl: UrlWithParsedQuery): Promise<void>;
    protected hasPage(page: string): Promise<boolean>;
    protected getPublicDir(): string;
    protected getBuildId(): string;
    protected loadEnvConfig(): void;
    protected getHasStaticDir(): boolean;
    protected getFallback(): Promise<string>;
    protected getFontManifest(): undefined;
    protected getPagesManifest(): {
        [x: string]: string;
    };
    protected getAppPathsManifest(): {
        [x: string]: string;
    };
    protected getFilesystemPaths(): Set<string>;
    protected attachRequestMeta(req: WebNextRequest, parsedUrl: NextUrlWithParsedQuery): void;
    protected getPrerenderManifest(): {
        version: 3;
        routes: {};
        dynamicRoutes: {};
        notFoundRoutes: never[];
        preview: {
            previewModeId: string;
            previewModeSigningKey: string;
            previewModeEncryptionKey: string;
        };
    };
    protected getServerComponentManifest(): any;
    protected getServerCSSManifest(): any;
    protected generateRoutes(): {
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
    protected handleApiRequest(): Promise<boolean>;
    protected renderHTML(req: WebNextRequest, _res: WebNextResponse, pathname: string, query: NextParsedUrlQuery, renderOpts: RenderOpts): Promise<RenderResult | null>;
    protected sendRenderResult(_req: WebNextRequest, res: WebNextResponse, options: {
        result: RenderResult;
        type: 'html' | 'json';
        generateEtags: boolean;
        poweredByHeader: boolean;
        options?: PayloadOptions | undefined;
    }): Promise<void>;
    protected runApi(): Promise<boolean>;
    protected findPageComponents({ pathname, query, params, }: {
        pathname: string;
        query: NextParsedUrlQuery;
        params: Params | null;
        isAppPath: boolean;
    }): Promise<{
        query: {
            [x: string]: any;
            __nextNotFoundSrcPage?: string | undefined;
            __nextDefaultLocale?: string | undefined;
            __nextFallback?: "true" | undefined;
            __nextLocale?: string | undefined;
            __nextSsgPath?: string | undefined;
            _nextBubbleNoFallback?: "1" | undefined;
            __nextDataReq?: "1" | undefined;
            __nextCustomErrorRender?: "1" | undefined;
            amp?: "1" | undefined;
        };
        components: LoadComponentsReturnType;
    } | null>;
}
export {};
