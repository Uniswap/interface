/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { webpack } from 'next/dist/compiled/webpack/webpack';
import type { NextConfigComplete } from '../config-shared';
import type { CustomRoutes } from '../../lib/load-custom-routes';
import { IncomingMessage, ServerResponse } from 'http';
import { UrlObject } from 'url';
import getBaseWebpackConfig from '../../build/webpack-config';
import { __ApiPreviewProps } from '../api-utils';
import { UnwrapPromise } from '../../lib/coalesced-function';
export declare function renderScriptError(res: ServerResponse, error: Error, { verbose }?: {
    verbose?: boolean | undefined;
}): Promise<void>;
export default class HotReloader {
    private dir;
    private buildId;
    private interceptors;
    private pagesDir?;
    private distDir;
    private webpackHotMiddleware?;
    private config;
    hasServerComponents: boolean;
    hasReactRoot: boolean;
    clientStats: webpack.Stats | null;
    serverStats: webpack.Stats | null;
    edgeServerStats: webpack.Stats | null;
    private clientError;
    private serverError;
    private serverPrevDocumentHash;
    private prevChunkNames?;
    private onDemandEntries?;
    private previewProps;
    private watcher;
    private rewrites;
    private fallbackWatcher;
    private hotReloaderSpan;
    private pagesMapping;
    private appDir?;
    multiCompiler?: webpack.MultiCompiler;
    activeConfigs?: Array<UnwrapPromise<ReturnType<typeof getBaseWebpackConfig>>>;
    constructor(dir: string, { config, pagesDir, distDir, buildId, previewProps, rewrites, appDir, }: {
        config: NextConfigComplete;
        pagesDir?: string;
        distDir: string;
        buildId: string;
        previewProps: __ApiPreviewProps;
        rewrites: CustomRoutes['rewrites'];
        appDir?: string;
    });
    run(req: IncomingMessage, res: ServerResponse, parsedUrl: UrlObject): Promise<{
        finished?: true;
    }>;
    onHMR(req: IncomingMessage, _res: ServerResponse, head: Buffer): void;
    private clean;
    private getWebpackConfig;
    buildFallbackError(): Promise<void>;
    start(initial?: boolean): Promise<void>;
    invalidate(): void;
    stop(): Promise<void>;
    getCompilationErrors(page: string): Promise<any[]>;
    send(action?: string | any, ...args: any[]): void;
    ensurePage({ page, clientOnly, appPaths, }: {
        page: string;
        clientOnly: boolean;
        appPaths?: string[] | null;
    }): Promise<void>;
}
