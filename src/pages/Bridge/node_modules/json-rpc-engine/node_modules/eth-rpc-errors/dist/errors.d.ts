import { EthereumRpcError, EthereumProviderError } from './classes';
interface EthereumErrorOptions<T> {
    message?: string;
    data?: T;
}
interface ServerErrorOptions<T> extends EthereumErrorOptions<T> {
    code: number;
}
declare type CustomErrorArg<T> = ServerErrorOptions<T>;
export declare const ethErrors: {
    rpc: {
        /**
         * Get a JSON RPC 2.0 Parse (-32700) error.
         */
        parse: <T>(arg?: string | EthereumErrorOptions<T> | undefined) => EthereumRpcError<T>;
        /**
         * Get a JSON RPC 2.0 Invalid Request (-32600) error.
         */
        invalidRequest: <T_1>(arg?: string | EthereumErrorOptions<T_1> | undefined) => EthereumRpcError<T_1>;
        /**
         * Get a JSON RPC 2.0 Invalid Params (-32602) error.
         */
        invalidParams: <T_2>(arg?: string | EthereumErrorOptions<T_2> | undefined) => EthereumRpcError<T_2>;
        /**
         * Get a JSON RPC 2.0 Method Not Found (-32601) error.
         */
        methodNotFound: <T_3>(arg?: string | EthereumErrorOptions<T_3> | undefined) => EthereumRpcError<T_3>;
        /**
         * Get a JSON RPC 2.0 Internal (-32603) error.
         */
        internal: <T_4>(arg?: string | EthereumErrorOptions<T_4> | undefined) => EthereumRpcError<T_4>;
        /**
         * Get a JSON RPC 2.0 Server error.
         * Permits integer error codes in the [ -32099 <= -32005 ] range.
         * Codes -32000 through -32004 are reserved by EIP-1474.
         */
        server: <T_5>(opts: ServerErrorOptions<T_5>) => EthereumRpcError<T_5>;
        /**
         * Get an Ethereum JSON RPC Invalid Input (-32000) error.
         */
        invalidInput: <T_6>(arg?: string | EthereumErrorOptions<T_6> | undefined) => EthereumRpcError<T_6>;
        /**
         * Get an Ethereum JSON RPC Resource Not Found (-32001) error.
         */
        resourceNotFound: <T_7>(arg?: string | EthereumErrorOptions<T_7> | undefined) => EthereumRpcError<T_7>;
        /**
         * Get an Ethereum JSON RPC Resource Unavailable (-32002) error.
         */
        resourceUnavailable: <T_8>(arg?: string | EthereumErrorOptions<T_8> | undefined) => EthereumRpcError<T_8>;
        /**
         * Get an Ethereum JSON RPC Transaction Rejected (-32003) error.
         */
        transactionRejected: <T_9>(arg?: string | EthereumErrorOptions<T_9> | undefined) => EthereumRpcError<T_9>;
        /**
         * Get an Ethereum JSON RPC Method Not Supported (-32004) error.
         */
        methodNotSupported: <T_10>(arg?: string | EthereumErrorOptions<T_10> | undefined) => EthereumRpcError<T_10>;
        /**
         * Get an Ethereum JSON RPC Limit Exceeded (-32005) error.
         */
        limitExceeded: <T_11>(arg?: string | EthereumErrorOptions<T_11> | undefined) => EthereumRpcError<T_11>;
    };
    provider: {
        /**
         * Get an Ethereum Provider User Rejected Request (4001) error.
         */
        userRejectedRequest: <T_12>(arg?: string | EthereumErrorOptions<T_12> | undefined) => EthereumProviderError<T_12>;
        /**
         * Get an Ethereum Provider Unauthorized (4100) error.
         */
        unauthorized: <T_13>(arg?: string | EthereumErrorOptions<T_13> | undefined) => EthereumProviderError<T_13>;
        /**
         * Get an Ethereum Provider Unsupported Method (4200) error.
         */
        unsupportedMethod: <T_14>(arg?: string | EthereumErrorOptions<T_14> | undefined) => EthereumProviderError<T_14>;
        /**
         * Get an Ethereum Provider Not Connected (4900) error.
         */
        disconnected: <T_15>(arg?: string | EthereumErrorOptions<T_15> | undefined) => EthereumProviderError<T_15>;
        /**
         * Get an Ethereum Provider Chain Not Connected (4901) error.
         */
        chainDisconnected: <T_16>(arg?: string | EthereumErrorOptions<T_16> | undefined) => EthereumProviderError<T_16>;
        /**
         * Get a custom Ethereum Provider error.
         */
        custom: <T_17>(opts: CustomErrorArg<T_17>) => EthereumProviderError<T_17>;
    };
};
export {};
