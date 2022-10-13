import type { NextConfigComplete } from '../config-shared';
import '../node-polyfill-fetch';
declare type RuntimeConfig = any;
export declare function loadStaticPaths({ distDir, pathname, serverless, config, httpAgentOptions, locales, defaultLocale, isAppPath, originalAppPath, }: {
    distDir: string;
    pathname: string;
    serverless: boolean;
    config: RuntimeConfig;
    httpAgentOptions: NextConfigComplete['httpAgentOptions'];
    locales?: string[];
    defaultLocale?: string;
    isAppPath?: boolean;
    originalAppPath?: string;
}): Promise<{
    paths?: string[];
    encodedPaths?: string[];
    fallback?: boolean | 'blocking';
}>;
export {};
