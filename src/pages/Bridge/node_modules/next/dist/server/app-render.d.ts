/// <reference types="node" />
import type { IncomingMessage, ServerResponse } from 'http';
import type { LoadComponentsReturnType } from './load-components';
import type { ServerRuntime } from '../types';
import React from 'react';
import { NextParsedUrlQuery } from './request-meta';
import RenderResult from './render-result';
import { FlightCSSManifest, FlightManifest } from '../build/webpack/plugins/flight-manifest-plugin';
export declare type RenderOptsPartial = {
    err?: Error | null;
    dev?: boolean;
    serverComponentManifest?: FlightManifest;
    serverCSSManifest?: FlightCSSManifest;
    supportsDynamicHTML?: boolean;
    runtime?: ServerRuntime;
    serverComponents?: boolean;
    assetPrefix?: string;
};
export declare type RenderOpts = LoadComponentsReturnType & RenderOptsPartial;
export declare type DynamicParamTypesShort = 'c' | 'oc' | 'd';
/**
 * Segment in the router state.
 */
export declare type Segment = string | [param: string, value: string, type: DynamicParamTypesShort];
/**
 * Router state
 */
export declare type FlightRouterState = [
    segment: Segment,
    parallelRoutes: {
        [parallelRouterKey: string]: FlightRouterState;
    },
    url?: string,
    refresh?: 'refetch'
];
/**
 * Individual Flight response path
 */
export declare type FlightSegmentPath = any[] | [
    segment: Segment,
    parallelRouterKey: string,
    segment: Segment,
    parallelRouterKey: string,
    segment: Segment,
    parallelRouterKey: string
];
export declare type FlightDataPath = any[] | [
    ...FlightSegmentPath,
    Segment,
    FlightRouterState,
    React.ReactNode | null
];
/**
 * The Flight response data
 */
export declare type FlightData = Array<FlightDataPath> | string;
/**
 * Property holding the current subTreeData.
 */
export declare type ChildProp = {
    /**
     * Null indicates that the tree is partial
     */
    current: React.ReactNode | null;
    segment: Segment;
};
export declare function renderToHTMLOrFlight(req: IncomingMessage, res: ServerResponse, pathname: string, query: NextParsedUrlQuery, renderOpts: RenderOpts, isPagesDir: boolean, isStaticGeneration?: boolean): Promise<RenderResult | null>;
