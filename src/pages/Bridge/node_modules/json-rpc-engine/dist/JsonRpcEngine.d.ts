import SafeEventEmitter from '@metamask/safe-event-emitter';
declare type Maybe<T> = Partial<T> | null | undefined;
export declare type Json = boolean | number | string | null | {
    [property: string]: Json;
} | Json[];
/**
 * A String specifying the version of the JSON-RPC protocol.
 * MUST be exactly "2.0".
 */
export declare type JsonRpcVersion = '2.0';
/**
 * An identifier established by the Client that MUST contain a String, Number,
 * or NULL value if included. If it is not included it is assumed to be a
 * notification. The value SHOULD normally not be Null and Numbers SHOULD
 * NOT contain fractional parts.
 */
export declare type JsonRpcId = number | string | void;
export interface JsonRpcError {
    code: number;
    message: string;
    data?: unknown;
    stack?: string;
}
export interface JsonRpcRequest<T> {
    jsonrpc: JsonRpcVersion;
    method: string;
    id: JsonRpcId;
    params?: T;
}
export interface JsonRpcNotification<T> {
    jsonrpc: JsonRpcVersion;
    method: string;
    params?: T;
}
interface JsonRpcResponseBase {
    jsonrpc: JsonRpcVersion;
    id: JsonRpcId;
}
export interface JsonRpcSuccess<T> extends JsonRpcResponseBase {
    result: Maybe<T>;
}
export interface JsonRpcFailure extends JsonRpcResponseBase {
    error: JsonRpcError;
}
export declare type JsonRpcResponse<T> = JsonRpcSuccess<T> | JsonRpcFailure;
export interface PendingJsonRpcResponse<T> extends JsonRpcResponseBase {
    result?: T;
    error?: Error | JsonRpcError;
}
export declare type JsonRpcEngineCallbackError = Error | JsonRpcError | null;
export declare type JsonRpcEngineReturnHandler = (done: (error?: JsonRpcEngineCallbackError) => void) => void;
export declare type JsonRpcEngineNextCallback = (returnHandlerCallback?: JsonRpcEngineReturnHandler) => void;
export declare type JsonRpcEngineEndCallback = (error?: JsonRpcEngineCallbackError) => void;
export declare type JsonRpcMiddleware<T, U> = (req: JsonRpcRequest<T>, res: PendingJsonRpcResponse<U>, next: JsonRpcEngineNextCallback, end: JsonRpcEngineEndCallback) => void;
/**
 * A JSON-RPC request and response processor.
 * Give it a stack of middleware, pass it requests, and get back responses.
 */
export declare class JsonRpcEngine extends SafeEventEmitter {
    private _middleware;
    constructor();
    /**
     * Add a middleware function to the engine's middleware stack.
     *
     * @param middleware - The middleware function to add.
     */
    push<T, U>(middleware: JsonRpcMiddleware<T, U>): void;
    /**
     * Handle a JSON-RPC request, and return a response.
     *
     * @param request - The request to handle.
     * @param callback - An error-first callback that will receive the response.
     */
    handle<T, U>(request: JsonRpcRequest<T>, callback: (error: unknown, response: JsonRpcResponse<U>) => void): void;
    /**
     * Handle an array of JSON-RPC requests, and return an array of responses.
     *
     * @param request - The requests to handle.
     * @param callback - An error-first callback that will receive the array of
     * responses.
     */
    handle<T, U>(requests: JsonRpcRequest<T>[], callback: (error: unknown, responses: JsonRpcResponse<U>[]) => void): void;
    /**
     * Handle a JSON-RPC request, and return a response.
     *
     * @param request - The request to handle.
     * @returns A promise that resolves with the response, or rejects with an
     * error.
     */
    handle<T, U>(request: JsonRpcRequest<T>): Promise<JsonRpcResponse<U>>;
    /**
     * Handle an array of JSON-RPC requests, and return an array of responses.
     *
     * @param request - The requests to handle.
     * @returns A promise that resolves with the array of responses, or rejects
     * with an error.
     */
    handle<T, U>(requests: JsonRpcRequest<T>[]): Promise<JsonRpcResponse<U>[]>;
    /**
     * Returns this engine as a middleware function that can be pushed to other
     * engines.
     *
     * @returns This engine as a middleware function.
     */
    asMiddleware(): JsonRpcMiddleware<unknown, unknown>;
    /**
     * Like _handle, but for batch requests.
     */
    private _handleBatch;
    /**
     * A promise-wrapped _handle.
     */
    private _promiseHandle;
    /**
     * Ensures that the request object is valid, processes it, and passes any
     * error and the response object to the given callback.
     *
     * Does not reject.
     */
    private _handle;
    /**
     * For the given request and response, runs all middleware and their return
     * handlers, if any, and ensures that internal request processing semantics
     * are satisfied.
     */
    private _processRequest;
    /**
     * Serially executes the given stack of middleware.
     *
     * @returns An array of any error encountered during middleware execution,
     * a boolean indicating whether the request was completed, and an array of
     * middleware-defined return handlers.
     */
    private static _runAllMiddleware;
    /**
     * Runs an individual middleware.
     *
     * @returns An array of any error encountered during middleware exection,
     * and a boolean indicating whether the request should end.
     */
    private static _runMiddleware;
    /**
     * Serially executes array of return handlers. The request and response are
     * assumed to be in their scope.
     */
    private static _runReturnHandlers;
    /**
     * Throws an error if the response has neither a result nor an error, or if
     * the "isComplete" flag is falsy.
     */
    private static _checkForCompletion;
}
export {};
