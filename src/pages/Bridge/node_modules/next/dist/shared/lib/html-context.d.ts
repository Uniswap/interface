/// <reference types="react" />
import type { BuildManifest } from '../../server/get-page-files';
import type { ServerRuntime } from 'next/types';
import type { NEXT_DATA } from './utils';
import type { FontConfig } from '../../server/font-utils';
export declare type HtmlProps = {
    __NEXT_DATA__: NEXT_DATA;
    dangerousAsPath: string;
    docComponentsRendered: {
        Html?: boolean;
        Main?: boolean;
        Head?: boolean;
        NextScript?: boolean;
    };
    buildManifest: BuildManifest;
    ampPath: string;
    inAmpMode: boolean;
    hybridAmp: boolean;
    isDevelopment: boolean;
    dynamicImports: string[];
    assetPrefix?: string;
    canonicalBase: string;
    headTags: any[];
    unstable_runtimeJS?: false;
    unstable_JsPreload?: false;
    devOnlyCacheBusterQueryString: string;
    scriptLoader: {
        afterInteractive?: string[];
        beforeInteractive?: any[];
        worker?: any[];
    };
    locale?: string;
    disableOptimizedLoading?: boolean;
    styles?: React.ReactElement[] | React.ReactFragment;
    head?: Array<JSX.Element | null>;
    crossOrigin?: string;
    optimizeCss?: any;
    optimizeFonts?: FontConfig;
    nextScriptWorkers?: boolean;
    runtime?: ServerRuntime;
    hasConcurrentFeatures?: boolean;
    largePageDataBytes?: number;
};
export declare const HtmlContext: import("react").Context<HtmlProps>;
