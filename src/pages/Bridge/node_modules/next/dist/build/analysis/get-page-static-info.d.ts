import type { NextConfig } from '../../server/config-shared';
import type { RouteHas } from '../../lib/load-custom-routes';
import { ServerRuntime } from 'next/types';
export interface MiddlewareConfig {
    matchers: MiddlewareMatcher[];
    unstable_allowDynamicGlobs: string[];
}
export interface MiddlewareMatcher {
    regexp: string;
    locale?: false;
    has?: RouteHas[];
}
export interface PageStaticInfo {
    runtime?: ServerRuntime;
    ssg?: boolean;
    ssr?: boolean;
    rsc?: RSCModuleType;
    middleware?: Partial<MiddlewareConfig>;
}
export declare type RSCModuleType = 'server' | 'client';
export declare function getRSCModuleType(source: string): RSCModuleType;
/**
 * Receives a parsed AST from SWC and checks if it belongs to a module that
 * requires a runtime to be specified. Those are:
 *   - Modules with `export function getStaticProps | getServerSideProps`
 *   - Modules with `export { getStaticProps | getServerSideProps } <from ...>`
 */
export declare function checkExports(swcAST: any): {
    ssr: boolean;
    ssg: boolean;
};
/**
 * For a given pageFilePath and nextConfig, if the config supports it, this
 * function will read the file and return the runtime that should be used.
 * It will look into the file content only if the page *requires* a runtime
 * to be specified, that is, when gSSP or gSP is used.
 * Related discussion: https://github.com/vercel/next.js/discussions/34179
 */
export declare function getPageStaticInfo(params: {
    nextConfig: Partial<NextConfig>;
    pageFilePath: string;
    isDev?: boolean;
    page?: string;
}): Promise<PageStaticInfo>;
