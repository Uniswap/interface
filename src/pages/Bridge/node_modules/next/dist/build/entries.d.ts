import type { NextConfigComplete } from '../server/config-shared';
import type { webpack } from 'next/dist/compiled/webpack/webpack';
import type { MiddlewareConfig } from './analysis/get-page-static-info';
import type { LoadedEnvFiles } from '@next/env';
import { CompilerNameValues } from '../shared/lib/constants';
import { __ApiPreviewProps } from '../server/api-utils';
import { ServerRuntime } from '../types';
declare type ObjectValue<T> = T extends {
    [key: string]: infer V;
} ? V : never;
/**
 * For a given page path removes the provided extensions.
 */
export declare function getPageFromPath(pagePath: string, pageExtensions: string[]): string;
export declare function createPagesMapping({ isDev, pageExtensions, pagePaths, pagesType, pagesDir, }: {
    isDev: boolean;
    pageExtensions: string[];
    pagePaths: string[];
    pagesType: 'pages' | 'root' | 'app';
    pagesDir: string | undefined;
}): {
    [page: string]: string;
};
interface CreateEntrypointsParams {
    buildId: string;
    config: NextConfigComplete;
    envFiles: LoadedEnvFiles;
    isDev?: boolean;
    pages: {
        [page: string]: string;
    };
    pagesDir?: string;
    previewMode: __ApiPreviewProps;
    rootDir: string;
    rootPaths?: Record<string, string>;
    target: 'server' | 'serverless' | 'experimental-serverless-trace';
    appDir?: string;
    appPaths?: Record<string, string>;
    pageExtensions: string[];
}
export declare function getEdgeServerEntry(opts: {
    rootDir: string;
    absolutePagePath: string;
    buildId: string;
    bundlePath: string;
    config: NextConfigComplete;
    isDev: boolean;
    isServerComponent: boolean;
    page: string;
    pages: {
        [page: string]: string;
    };
    middleware?: Partial<MiddlewareConfig>;
    pagesType?: 'app' | 'pages' | 'root';
    appDirLoader?: string;
}): string | {
    import: string;
    layer: string | undefined;
};
export declare function getAppEntry(opts: {
    name: string;
    pagePath: string;
    appDir: string;
    appPaths: string[] | null;
    pageExtensions: string[];
}): {
    import: string;
    layer: string;
};
export declare function getServerlessEntry(opts: {
    absolutePagePath: string;
    buildId: string;
    config: NextConfigComplete;
    envFiles: LoadedEnvFiles;
    page: string;
    previewMode: __ApiPreviewProps;
    pages: {
        [page: string]: string;
    };
}): ObjectValue<webpack.EntryObject>;
export declare function getClientEntry(opts: {
    absolutePagePath: string;
    page: string;
}): string | string[];
export declare function runDependingOnPageType<T>(params: {
    onClient: () => T;
    onEdgeServer: () => T;
    onServer: () => T;
    page: string;
    pageRuntime: ServerRuntime;
}): Promise<void>;
export declare function createEntrypoints(params: CreateEntrypointsParams): Promise<{
    client: webpack.EntryObject;
    server: webpack.EntryObject;
    edgeServer: webpack.EntryObject;
    middlewareMatchers: undefined;
}>;
export declare function finalizeEntrypoint({ name, compilerType, value, isServerComponent, appDir, }: {
    compilerType?: CompilerNameValues;
    name: string;
    value: ObjectValue<webpack.EntryObject>;
    isServerComponent?: boolean;
    appDir?: boolean;
}): ObjectValue<webpack.EntryObject>;
export {};
