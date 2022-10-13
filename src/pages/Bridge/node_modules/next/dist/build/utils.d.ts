/// <reference types="node" />
import type { NextConfigComplete } from '../server/config-shared';
import '../server/node-polyfill-fetch';
import { CustomRoutes } from '../lib/load-custom-routes';
import { GetStaticPaths, ServerRuntime } from 'next/types';
import { BuildManifest } from '../server/get-page-files';
import { UnwrapPromise } from '../lib/coalesced-function';
import { MiddlewareManifest } from './webpack/plugins/middleware-plugin';
import { AppBuildManifest } from './webpack/plugins/app-build-manifest-plugin';
export declare type ROUTER_TYPE = 'pages' | 'app';
export declare function unique<T>(main: ReadonlyArray<T>, sub: ReadonlyArray<T>): T[];
export declare function difference<T>(main: ReadonlyArray<T> | ReadonlySet<T>, sub: ReadonlyArray<T> | ReadonlySet<T>): T[];
declare type ComputeFilesGroup = {
    files: ReadonlyArray<string>;
    size: {
        total: number;
    };
};
declare type ComputeFilesManifest = {
    unique: ComputeFilesGroup;
    common: ComputeFilesGroup;
};
declare type ComputeFilesManifestResult = {
    router: {
        pages: ComputeFilesManifest;
        app?: ComputeFilesManifest;
    };
    sizes: Map<string, number>;
};
export declare function computeFromManifest(manifests: {
    build: BuildManifest;
    app?: AppBuildManifest;
}, distPath: string, gzipSize?: boolean, pageInfos?: Map<string, PageInfo>): Promise<ComputeFilesManifestResult>;
export declare function isMiddlewareFilename(file?: string): boolean;
export interface PageInfo {
    isHybridAmp?: boolean;
    size: number;
    totalSize: number;
    static: boolean;
    isSsg: boolean;
    ssgPageRoutes: string[] | null;
    initialRevalidateSeconds: number | false;
    pageDuration: number | undefined;
    ssgPageDurations: number[] | undefined;
    runtime: ServerRuntime;
}
export declare function printTreeView(lists: {
    pages: ReadonlyArray<string>;
    app?: ReadonlyArray<string>;
}, pageInfos: Map<string, PageInfo>, serverless: boolean, { distPath, buildId, pagesDir, pageExtensions, buildManifest, appBuildManifest, middlewareManifest, useStatic404, gzipSize, }: {
    distPath: string;
    buildId: string;
    pagesDir?: string;
    pageExtensions: string[];
    buildManifest: BuildManifest;
    appBuildManifest?: AppBuildManifest;
    middlewareManifest: MiddlewareManifest;
    useStatic404: boolean;
    gzipSize?: boolean;
}): Promise<void>;
export declare function printCustomRoutes({ redirects, rewrites, headers, }: CustomRoutes): void;
export declare function getJsPageSizeInKb(routerType: ROUTER_TYPE, page: string, distPath: string, buildManifest: BuildManifest, appBuildManifest?: AppBuildManifest, gzipSize?: boolean, cachedStats?: ComputeFilesManifestResult): Promise<[number, number]>;
export declare function buildStaticPaths({ page, getStaticPaths, staticPathsResult, configFileName, locales, defaultLocale, }: {
    page: string;
    getStaticPaths?: GetStaticPaths;
    staticPathsResult?: UnwrapPromise<ReturnType<GetStaticPaths>>;
    configFileName: string;
    locales?: string[];
    defaultLocale?: string;
}): Promise<Omit<UnwrapPromise<ReturnType<GetStaticPaths>>, 'paths'> & {
    paths: string[];
    encodedPaths: string[];
}>;
export declare type AppConfig = {
    revalidate?: number | false;
    dynamicParams?: true | false;
    dynamic?: 'auto' | 'error' | 'force-static';
    fetchCache?: 'force-cache' | 'only-cache';
    preferredRegion?: string;
};
declare type GenerateParams = Array<{
    config: AppConfig;
    segmentPath: string;
    getStaticPaths?: GetStaticPaths;
    generateStaticParams?: any;
    isLayout?: boolean;
}>;
export declare const collectGenerateParams: (segment: any, parentSegments?: string[], generateParams?: GenerateParams) => GenerateParams;
export declare function buildAppStaticPaths({ page, configFileName, generateParams, }: {
    page: string;
    configFileName: string;
    generateParams: GenerateParams;
}): Promise<(Omit<import("next/types").GetStaticPathsResult<import("querystring").ParsedUrlQuery>, "paths"> & {
    paths: string[];
    encodedPaths: string[];
}) | {
    paths: undefined;
    fallback: undefined;
    encodedPaths: undefined;
}>;
export declare function isPageStatic({ page, distDir, serverless, configFileName, runtimeEnvConfig, httpAgentOptions, locales, defaultLocale, parentId, pageRuntime, edgeInfo, pageType, hasServerComponents, originalAppPath, }: {
    page: string;
    distDir: string;
    serverless: boolean;
    configFileName: string;
    runtimeEnvConfig: any;
    httpAgentOptions: NextConfigComplete['httpAgentOptions'];
    locales?: string[];
    defaultLocale?: string;
    parentId?: any;
    edgeInfo?: any;
    pageType?: 'pages' | 'app';
    pageRuntime: ServerRuntime;
    hasServerComponents?: boolean;
    originalAppPath?: string;
}): Promise<{
    isStatic?: boolean;
    isAmpOnly?: boolean;
    isHybridAmp?: boolean;
    hasServerProps?: boolean;
    hasStaticProps?: boolean;
    prerenderRoutes?: string[];
    encodedPrerenderRoutes?: string[];
    prerenderFallback?: boolean | 'blocking';
    isNextImageImported?: boolean;
    traceIncludes?: string[];
    traceExcludes?: string[];
    appConfig?: AppConfig;
}>;
export declare function hasCustomGetInitialProps(page: string, distDir: string, isLikeServerless: boolean, runtimeEnvConfig: any, checkingApp: boolean): Promise<boolean>;
export declare function getNamedExports(page: string, distDir: string, isLikeServerless: boolean, runtimeEnvConfig: any): Promise<Array<string>>;
export declare function detectConflictingPaths(combinedPages: string[], ssgPages: Set<string>, additionalSsgPaths: Map<string, string[]>): void;
export declare function copyTracedFiles(dir: string, distDir: string, pageKeys: ReadonlyArray<string>, tracingRoot: string, serverConfig: {
    [key: string]: any;
}, middlewareManifest: MiddlewareManifest): Promise<void>;
export declare function isReservedPage(page: string): boolean;
export declare function isCustomErrorPage(page: string): boolean;
export declare function isMiddlewareFile(file: string): boolean;
export declare function getPossibleMiddlewareFilenames(folder: string, extensions: string[]): string[];
export declare class MiddlewareInServerlessTargetError extends Error {
    constructor();
}
export declare class NestedMiddlewareError extends Error {
    constructor(nestedFileNames: string[], mainDir: string, pagesDir: string);
}
export {};
