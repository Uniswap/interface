import { JsonRpcMiddleware, JsonRpcRequest, PendingJsonRpcResponse } from './JsonRpcEngine';
export declare type AsyncJsonRpcEngineNextCallback = () => Promise<void>;
export declare type AsyncJsonrpcMiddleware<T, U> = (req: JsonRpcRequest<T>, res: PendingJsonRpcResponse<U>, next: AsyncJsonRpcEngineNextCallback) => Promise<void>;
/**
 * JsonRpcEngine only accepts callback-based middleware directly.
 * createAsyncMiddleware exists to enable consumers to pass in async middleware
 * functions.
 *
 * Async middleware have no "end" function. Instead, they "end" if they return
 * without calling "next". Rather than passing in explicit return handlers,
 * async middleware can simply await "next", and perform operations on the
 * response object when execution resumes.
 *
 * To accomplish this, createAsyncMiddleware passes the async middleware a
 * wrapped "next" function. That function calls the internal JsonRpcEngine
 * "next" function with a return handler that resolves a promise when called.
 *
 * The return handler will always be called. Its resolution of the promise
 * enables the control flow described above.
 */
export declare function createAsyncMiddleware<T, U>(asyncMiddleware: AsyncJsonrpcMiddleware<T, U>): JsonRpcMiddleware<T, U>;
