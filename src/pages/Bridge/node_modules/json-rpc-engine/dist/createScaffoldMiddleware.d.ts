import { Json, JsonRpcMiddleware } from './JsonRpcEngine';
declare type ScaffoldMiddlewareHandler<T, U> = JsonRpcMiddleware<T, U> | Json;
export declare function createScaffoldMiddleware(handlers: {
    [methodName: string]: ScaffoldMiddlewareHandler<unknown, unknown>;
}): JsonRpcMiddleware<unknown, unknown>;
export {};
