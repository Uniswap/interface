/// <reference types="node" />
/// <reference types="node" />
import type { HtmlProps } from './html-context';
import type { ComponentType } from 'react';
import type { DomainLocale } from '../../server/config';
import type { Env } from '@next/env';
import type { IncomingMessage, ServerResponse } from 'http';
import type { NextRouter } from './router/router';
import type { ParsedUrlQuery } from 'querystring';
import type { PreviewData } from 'next/types';
import { COMPILER_NAMES } from './constants';
export declare type NextComponentType<C extends BaseContext = NextPageContext, IP = {}, P = {}> = ComponentType<P> & {
    /**
     * Used for initial page load data population. Data returned from `getInitialProps` is serialized when server rendered.
     * Make sure to return plain `Object` without using `Date`, `Map`, `Set`.
     * @param ctx Context of `page`
     */
    getInitialProps?(context: C): IP | Promise<IP>;
};
export declare type DocumentType = NextComponentType<DocumentContext, DocumentInitialProps, DocumentProps>;
export declare type AppType<P = {}> = NextComponentType<AppContextType, P, AppPropsType<any, P>>;
export declare type AppTreeType = ComponentType<AppInitialProps & {
    [name: string]: any;
}>;
/**
 * Web vitals provided to _app.reportWebVitals by Core Web Vitals plugin developed by Google Chrome team.
 * https://nextjs.org/blog/next-9-4#integrated-web-vitals-reporting
 */
export declare type NextWebVitalsMetric = {
    id: string;
    startTime: number;
    value: number;
} & ({
    label: 'web-vital';
    name: 'FCP' | 'LCP' | 'CLS' | 'FID' | 'TTFB' | 'INP';
} | {
    label: 'custom';
    name: 'Next.js-hydration' | 'Next.js-route-change-to-render' | 'Next.js-render';
});
export declare type Enhancer<C> = (Component: C) => C;
export declare type ComponentsEnhancer = {
    enhanceApp?: Enhancer<AppType>;
    enhanceComponent?: Enhancer<NextComponentType>;
} | Enhancer<NextComponentType>;
export declare type RenderPageResult = {
    html: string;
    head?: Array<JSX.Element | null>;
};
export declare type RenderPage = (options?: ComponentsEnhancer) => DocumentInitialProps | Promise<DocumentInitialProps>;
export declare type BaseContext = {
    res?: ServerResponse;
    [k: string]: any;
};
export declare type NEXT_DATA = {
    props: Record<string, any>;
    page: string;
    query: ParsedUrlQuery;
    buildId: string;
    assetPrefix?: string;
    runtimeConfig?: {
        [key: string]: any;
    };
    nextExport?: boolean;
    autoExport?: boolean;
    isFallback?: boolean;
    dynamicIds?: (string | number)[];
    err?: Error & {
        statusCode?: number;
        source?: typeof COMPILER_NAMES.server | typeof COMPILER_NAMES.edgeServer;
    };
    gsp?: boolean;
    gssp?: boolean;
    customServer?: boolean;
    gip?: boolean;
    appGip?: boolean;
    locale?: string;
    locales?: string[];
    defaultLocale?: string;
    domainLocales?: DomainLocale[];
    scriptLoader?: any[];
    isPreview?: boolean;
    notFoundSrcPage?: string;
};
/**
 * `Next` context
 */
export interface NextPageContext {
    /**
     * Error object if encountered during rendering
     */
    err?: (Error & {
        statusCode?: number;
    }) | null;
    /**
     * `HTTP` request object.
     */
    req?: IncomingMessage;
    /**
     * `HTTP` response object.
     */
    res?: ServerResponse;
    /**
     * Path section of `URL`.
     */
    pathname: string;
    /**
     * Query string section of `URL` parsed as an object.
     */
    query: ParsedUrlQuery;
    /**
     * `String` of the actual path including query.
     */
    asPath?: string;
    /**
     * The currently active locale
     */
    locale?: string;
    /**
     * All configured locales
     */
    locales?: string[];
    /**
     * The configured default locale
     */
    defaultLocale?: string;
    /**
     * `Component` the tree of the App to use if needing to render separately
     */
    AppTree: AppTreeType;
}
export declare type AppContextType<R extends NextRouter = NextRouter> = {
    Component: NextComponentType<NextPageContext>;
    AppTree: AppTreeType;
    ctx: NextPageContext;
    router: R;
};
export declare type AppInitialProps<P = any> = {
    pageProps: P;
};
export declare type AppPropsType<R extends NextRouter = NextRouter, P = {}> = AppInitialProps<P> & {
    Component: NextComponentType<NextPageContext, any, any>;
    router: R;
    __N_SSG?: boolean;
    __N_SSP?: boolean;
};
export declare type DocumentContext = NextPageContext & {
    renderPage: RenderPage;
    defaultGetInitialProps(ctx: DocumentContext, options?: {
        nonce?: string;
    }): Promise<DocumentInitialProps>;
};
export declare type DocumentInitialProps = RenderPageResult & {
    styles?: React.ReactElement[] | React.ReactFragment | JSX.Element;
};
export declare type DocumentProps = DocumentInitialProps & HtmlProps;
/**
 * Next `API` route request
 */
export interface NextApiRequest extends IncomingMessage {
    /**
     * Object of `query` values from url
     */
    query: Partial<{
        [key: string]: string | string[];
    }>;
    /**
     * Object of `cookies` from header
     */
    cookies: Partial<{
        [key: string]: string;
    }>;
    body: any;
    env: Env;
    preview?: boolean;
    /**
     * Preview data set on the request, if any
     * */
    previewData?: PreviewData;
}
/**
 * Send body of response
 */
declare type Send<T> = (body: T) => void;
/**
 * Next `API` route response
 */
export declare type NextApiResponse<T = any> = ServerResponse & {
    /**
     * Send data `any` data in response
     */
    send: Send<T>;
    /**
     * Send data `json` data in response
     */
    json: Send<T>;
    status: (statusCode: number) => NextApiResponse<T>;
    redirect(url: string): NextApiResponse<T>;
    redirect(status: number, url: string): NextApiResponse<T>;
    /**
     * Set preview data for Next.js' prerender mode
     */
    setPreviewData: (data: object | string, options?: {
        /**
         * Specifies the number (in seconds) for the preview session to last for.
         * The given number will be converted to an integer by rounding down.
         * By default, no maximum age is set and the preview session finishes
         * when the client shuts down (browser is closed).
         */
        maxAge?: number;
        /**
         * Specifies the path for the preview session to work under. By default,
         * the path is considered the "default path", i.e., any pages under "/".
         */
        path?: string;
    }) => NextApiResponse<T>;
    /**
     * Clear preview data for Next.js' prerender mode
     */
    clearPreviewData: (options?: {
        path?: string;
    }) => NextApiResponse<T>;
    /**
     * @deprecated `unstable_revalidate` has been renamed to `revalidate`
     */
    unstable_revalidate: () => void;
    revalidate: (urlPath: string, opts?: {
        unstable_onlyGenerated?: boolean;
    }) => Promise<void>;
};
/**
 * Next `API` route handler
 */
export declare type NextApiHandler<T = any> = (req: NextApiRequest, res: NextApiResponse<T>) => unknown | Promise<unknown>;
/**
 * Utils
 */
export declare function execOnce<T extends (...args: any[]) => ReturnType<T>>(fn: T): T;
export declare const isAbsoluteUrl: (url: string) => boolean;
export declare function getLocationOrigin(): string;
export declare function getURL(): string;
export declare function getDisplayName<P>(Component: ComponentType<P>): string;
export declare function isResSent(res: ServerResponse): boolean;
export declare function normalizeRepeatedSlashes(url: string): string;
export declare function loadGetInitialProps<C extends BaseContext, IP = {}, P = {}>(App: NextComponentType<C, IP, P>, ctx: C): Promise<IP>;
declare let warnOnce: (_: string) => void;
export { warnOnce };
export declare const SP: boolean;
export declare const ST: boolean;
export declare class DecodeError extends Error {
}
export declare class NormalizeError extends Error {
}
export declare class PageNotFoundError extends Error {
    code: string;
    constructor(page: string);
}
export declare class MissingStaticPage extends Error {
    constructor(page: string, message: string);
}
export declare class MiddlewareNotFoundError extends Error {
    code: string;
    constructor();
}
export interface CacheFs {
    readFile(f: string): Promise<string>;
    readFileSync(f: string): string;
    writeFile(f: string, d: any): Promise<void>;
    mkdir(dir: string): Promise<void | string>;
    stat(f: string): Promise<{
        mtime: Date;
    }>;
}
