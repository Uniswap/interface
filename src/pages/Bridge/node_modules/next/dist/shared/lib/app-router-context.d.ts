import React from 'react';
import type { FocusAndScrollRef } from '../../client/components/reducer';
import type { FlightRouterState, FlightData } from '../../server/app-render';
export declare type ChildSegmentMap = Map<string, CacheNode>;
/**
 * Cache node used in app-router / layout-router.
 */
export declare type CacheNode = {
    /**
     * In-flight request for this node.
     */
    data: ReturnType<typeof import('../../client/components/app-router.client').fetchServerResponse> | null;
    /**
     * React Component for this node.
     */
    subTreeData: React.ReactNode | null;
    /**
     * Child parallel routes.
     */
    parallelRoutes: Map<string, ChildSegmentMap>;
};
interface NavigateOptions {
    forceOptimisticNavigation?: boolean;
}
export interface AppRouterInstance {
    /**
     * Reload the current page. Fetches new data from the server.
     */
    reload(): void;
    /**
     * Hard navigate to the provided href. Fetches new data from the server.
     * Pushes a new history entry.
     */
    push(href: string, options: NavigateOptions): void;
    /**
     * Hard navigate to the provided href. Does not fetch data from the server if it was already fetched.
     * Replaces the current history entry.
     */
    replace(href: string, options: NavigateOptions): void;
    /**
     * Soft prefetch the provided href. Does not fetch data from the server if it was already fetched.
     */
    prefetch(href: string): void;
}
export declare const AppRouterContext: React.Context<AppRouterInstance>;
export declare const LayoutRouterContext: React.Context<{
    childNodes: CacheNode['parallelRoutes'];
    tree: FlightRouterState;
    url: string;
}>;
export declare const GlobalLayoutRouterContext: React.Context<{
    tree: FlightRouterState;
    changeByServerResponse: (previousTree: FlightRouterState, flightData: FlightData) => void;
    focusAndScrollRef: FocusAndScrollRef;
}>;
export declare const TemplateContext: React.Context<React.ReactNode>;
export {};
