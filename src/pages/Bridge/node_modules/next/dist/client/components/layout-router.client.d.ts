import React from 'react';
import type { ChildProp } from '../../server/app-render';
import type { ChildSegmentMap } from '../../shared/lib/app-router-context';
import type { FlightRouterState, FlightSegmentPath } from '../../server/app-render';
/**
 * InnerLayoutRouter handles rendering the provided segment based on the cache.
 */
export declare function InnerLayoutRouter({ parallelRouterKey, url, childNodes, childProp, segmentPath, tree, path, rootLayoutIncluded, }: {
    parallelRouterKey: string;
    url: string;
    childNodes: ChildSegmentMap;
    childProp: ChildProp | null;
    segmentPath: FlightSegmentPath;
    tree: FlightRouterState;
    isActive: boolean;
    path: string;
    rootLayoutIncluded: boolean;
}): JSX.Element | null;
declare type ErrorComponent = React.ComponentType<{
    error: Error;
    reset: () => void;
}>;
/**
 * OuterLayoutRouter handles the current segment as well as <Offscreen> rendering of other segments.
 * It can be rendered next to each other with a different `parallelRouterKey`, allowing for Parallel routes.
 */
export default function OuterLayoutRouter({ parallelRouterKey, segmentPath, childProp, error, loading, template, rootLayoutIncluded, }: {
    parallelRouterKey: string;
    segmentPath: FlightSegmentPath;
    childProp: ChildProp;
    error: ErrorComponent;
    template: React.ReactNode;
    loading: React.ReactNode | undefined;
    rootLayoutIncluded: boolean;
}): JSX.Element;
export {};
