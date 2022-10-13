/// <reference types="node" />
import type { IncomingMessage, ServerResponse } from 'http';
import type { Rewrite } from '../../../../lib/load-custom-routes';
import type { BuildManifest } from '../../../../server/get-page-files';
import type { RouteMatch } from '../../../../shared/lib/router/utils/route-matcher';
import type { NextConfig } from '../../../../server/config';
import type { GetServerSideProps, GetStaticPaths, GetStaticProps } from '../../../../types';
import type { BaseNextRequest } from '../../../../server/base-http';
import type { __ApiPreviewProps } from '../../../../server/api-utils';
import { UrlWithParsedQuery } from 'url';
import { ParsedUrlQuery } from 'querystring';
import { getNamedRouteRegex } from '../../../../shared/lib/router/utils/route-regex';
export declare const vercelHeader = "x-vercel-id";
export declare type ServerlessHandlerCtx = {
    page: string;
    pageModule: any;
    pageComponent?: any;
    pageConfig?: any;
    pageGetStaticProps?: GetStaticProps;
    pageGetStaticPaths?: GetStaticPaths;
    pageGetServerSideProps?: GetServerSideProps;
    appModule?: any;
    errorModule?: any;
    documentModule?: any;
    notFoundModule?: any;
    runtimeConfig: any;
    buildManifest?: BuildManifest;
    reactLoadableManifest?: any;
    basePath: string;
    rewrites: {
        fallback?: Rewrite[];
        afterFiles?: Rewrite[];
        beforeFiles?: Rewrite[];
    };
    pageIsDynamic: boolean;
    generateEtags: boolean;
    distDir: string;
    buildId: string;
    escapedBuildId: string;
    assetPrefix: string;
    poweredByHeader: boolean;
    canonicalBase: string;
    encodedPreviewProps: __ApiPreviewProps;
    i18n?: NextConfig['i18n'];
};
export declare function interpolateDynamicPath(pathname: string, params: ParsedUrlQuery, defaultRouteRegex?: ReturnType<typeof getNamedRouteRegex> | undefined): string;
export declare function getUtils({ page, i18n, basePath, rewrites, pageIsDynamic, trailingSlash, }: {
    page: ServerlessHandlerCtx['page'];
    i18n?: ServerlessHandlerCtx['i18n'];
    basePath: ServerlessHandlerCtx['basePath'];
    rewrites: ServerlessHandlerCtx['rewrites'];
    pageIsDynamic: ServerlessHandlerCtx['pageIsDynamic'];
    trailingSlash?: boolean;
}): {
    handleLocale: (req: IncomingMessage, res: ServerResponse, parsedUrl: UrlWithParsedQuery, routeNoAssetPath: string, shouldNotRedirect: boolean) => {
        defaultLocale: string;
        detectedLocale: string;
        routeNoAssetPath: string;
    } | undefined;
    handleRewrites: (req: BaseNextRequest | IncomingMessage, parsedUrl: UrlWithParsedQuery) => {};
    handleBasePath: (req: BaseNextRequest | IncomingMessage, parsedUrl: UrlWithParsedQuery) => void;
    defaultRouteRegex: {
        namedRegex: string;
        routeKeys: {
            [named: string]: string;
        };
        groups: {
            [groupName: string]: import("../../../../shared/lib/router/utils/route-regex").Group;
        };
        re: RegExp;
    } | undefined;
    normalizeVercelUrl: (req: BaseNextRequest | IncomingMessage, trustQuery: boolean, paramKeys?: string[]) => void;
    dynamicRouteMatcher: RouteMatch | undefined;
    defaultRouteMatches: ParsedUrlQuery | undefined;
    getParamsFromRouteMatches: (req: BaseNextRequest | IncomingMessage, renderOpts?: any, detectedLocale?: string) => ParsedUrlQuery;
    normalizeDynamicRouteParams: (params: ParsedUrlQuery, ignoreOptional?: boolean) => {
        params: ParsedUrlQuery;
        hasValidParams: boolean;
    };
    interpolateDynamicPath: (pathname: string, params: Record<string, string | string[]>) => string;
};
