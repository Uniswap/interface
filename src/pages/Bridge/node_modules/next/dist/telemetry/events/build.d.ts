import { TelemetryPlugin } from '../../build/webpack/plugins/telemetry-plugin';
import type { SWC_TARGET_TRIPLE } from '../../build/webpack/plugins/telemetry-plugin';
declare type EventTypeCheckCompleted = {
    durationInSeconds: number;
    typescriptVersion: string | null;
    inputFilesCount?: number;
    totalFilesCount?: number;
    incremental?: boolean;
};
export declare function eventTypeCheckCompleted(event: EventTypeCheckCompleted): {
    eventName: string;
    payload: EventTypeCheckCompleted;
};
export declare type EventLintCheckCompleted = {
    durationInSeconds: number;
    eslintVersion: string | null;
    lintedFilesCount?: number;
    lintFix?: boolean;
    buildLint?: boolean;
    nextEslintPluginVersion?: string | null;
    nextEslintPluginErrorsCount?: number;
    nextEslintPluginWarningsCount?: number;
    nextRulesEnabled: {
        [ruleName: `@next/next/${string}`]: 'off' | 'warn' | 'error';
    };
};
export declare function eventLintCheckCompleted(event: EventLintCheckCompleted): {
    eventName: string;
    payload: EventLintCheckCompleted;
};
declare type EventBuildCompleted = {
    durationInSeconds: number;
    totalPageCount: number;
    hasDunderPages: boolean;
    hasTestPages: boolean;
};
export declare function eventBuildCompleted(pagePaths: string[], event: Omit<EventBuildCompleted, 'totalPageCount' | 'hasDunderPages' | 'hasTestPages'>): {
    eventName: string;
    payload: EventBuildCompleted;
};
declare type EventBuildOptimized = {
    durationInSeconds: number;
    totalPageCount: number;
    staticPageCount: number;
    staticPropsPageCount: number;
    serverPropsPageCount: number;
    ssrPageCount: number;
    hasDunderPages: boolean;
    hasTestPages: boolean;
    hasStatic404: boolean;
    hasReportWebVitals: boolean;
    headersCount: number;
    rewritesCount: number;
    redirectsCount: number;
    headersWithHasCount: number;
    rewritesWithHasCount: number;
    redirectsWithHasCount: number;
    middlewareCount: number;
};
export declare function eventBuildOptimize(pagePaths: string[], event: Omit<EventBuildOptimized, 'totalPageCount' | 'hasDunderPages' | 'hasTestPages'>): {
    eventName: string;
    payload: EventBuildOptimized;
};
export declare const EVENT_BUILD_FEATURE_USAGE = "NEXT_BUILD_FEATURE_USAGE";
export declare type EventBuildFeatureUsage = {
    featureName: 'next/image' | 'next/future/image' | 'next/script' | 'next/dynamic' | 'experimental/optimizeCss' | 'experimental/nextScriptWorkers' | 'optimizeFonts' | 'swcLoader' | 'swcMinify' | 'swcRelay' | 'swcStyledComponents' | 'swcReactRemoveProperties' | 'swcExperimentalDecorators' | 'swcRemoveConsole' | 'swcImportSource' | 'swcEmotion' | `swc/target/${SWC_TARGET_TRIPLE}` | 'build-lint';
    invocationCount: number;
};
export declare function eventBuildFeatureUsage(telemetryPlugin: TelemetryPlugin): Array<{
    eventName: string;
    payload: EventBuildFeatureUsage;
}>;
export declare const EVENT_NAME_PACKAGE_USED_IN_GET_SERVER_SIDE_PROPS = "NEXT_PACKAGE_USED_IN_GET_SERVER_SIDE_PROPS";
export declare type EventPackageUsedInGetServerSideProps = {
    package: string;
};
export declare function eventPackageUsedInGetServerSideProps(telemetryPlugin: TelemetryPlugin): Array<{
    eventName: string;
    payload: EventPackageUsedInGetServerSideProps;
}>;
export {};
