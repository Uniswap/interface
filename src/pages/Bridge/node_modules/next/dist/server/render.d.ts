/// <reference types="node" />
/// <reference types="node" />
import type { IncomingMessage, ServerResponse } from 'http';
import type { ParsedUrlQuery } from 'querystring';
import type { DomainLocale } from './config';
import type { ImageConfigComplete } from '../shared/lib/image-config';
import type { __ApiPreviewProps } from './api-utils';
import type { FontManifest, FontConfig } from './font-utils';
import type { LoadComponentsReturnType } from './load-components';
import type { ServerRuntime } from 'next/types';
import React from 'react';
import { NextParsedUrlQuery } from './request-meta';
import RenderResult from './render-result';
export declare type RenderOptsPartial = {
    buildId: string;
    canonicalBase: string;
    runtimeConfig?: {
        [key: string]: any;
    };
    assetPrefix?: string;
    err?: Error | null;
    nextExport?: boolean;
    dev?: boolean;
    ampPath?: string;
    ErrorDebug?: React.ComponentType<{
        error: Error;
    }>;
    ampValidator?: (html: string, pathname: string) => Promise<void>;
    ampSkipValidation?: boolean;
    ampOptimizerConfig?: {
        [key: string]: any;
    };
    isDataReq?: boolean;
    params?: ParsedUrlQuery;
    previewProps: __ApiPreviewProps;
    basePath: string;
    unstable_runtimeJS?: false;
    unstable_JsPreload?: false;
    optimizeFonts: FontConfig;
    fontManifest?: FontManifest;
    optimizeCss: any;
    nextScriptWorkers: any;
    devOnlyCacheBusterQueryString?: string;
    resolvedUrl?: string;
    resolvedAsPath?: string;
    serverComponentManifest?: any;
    serverCSSManifest?: any;
    distDir?: string;
    locale?: string;
    locales?: string[];
    defaultLocale?: string;
    domainLocales?: DomainLocale[];
    disableOptimizedLoading?: boolean;
    supportsDynamicHTML?: boolean;
    runtime?: ServerRuntime;
    serverComponents?: boolean;
    customServer?: boolean;
    crossOrigin?: string;
    images: ImageConfigComplete;
    largePageDataBytes?: number;
};
export declare type RenderOpts = LoadComponentsReturnType & RenderOptsPartial;
export declare function renderToHTML(req: IncomingMessage, res: ServerResponse, pathname: string, query: NextParsedUrlQuery, renderOpts: RenderOpts): Promise<RenderResult | null>;
