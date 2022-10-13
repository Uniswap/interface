import type { NodejsRequestData, FetchEventResult } from '../types';
import { EdgeFunctionDefinition } from '../../../build/webpack/plugins/middleware-plugin';
import type { EdgeRuntime } from 'next/dist/compiled/edge-runtime';
export declare const ErrorSource: unique symbol;
declare type RunnerFn = (params: {
    name: string;
    env: string[];
    onWarning?: (warn: Error) => void;
    paths: string[];
    request: NodejsRequestData;
    useCache: boolean;
    edgeFunctionEntry: Pick<EdgeFunctionDefinition, 'wasm' | 'assets'>;
    distDir: string;
}) => Promise<FetchEventResult>;
export declare const getRuntimeContext: (params: {
    name: string;
    onWarning?: any;
    useCache: boolean;
    env: string[];
    edgeFunctionEntry: any;
    distDir: string;
    paths: string[];
}) => Promise<EdgeRuntime<any>>;
export declare const run: RunnerFn;
export {};
