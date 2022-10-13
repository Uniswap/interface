
export interface IEthereumRpcError<T> {
  code: number; // must be an integer
  message: string;
  data?: T;
  stack?: any; // non-standard but not forbidden, and useful if it exists
}

export interface IEthereumProviderError<T> extends IEthereumRpcError<T> {}

type DefaultError = { code: number, message: string }

export interface IErrorOptions {
  message?: string | null,
  data?: any,
}

export type ErrorArg = IErrorOptions | string;

export interface IRpcServerErrorOptions extends IErrorOptions {
  code: number,
}

export interface IProviderCustomErrorOptions extends IErrorOptions {
  code: number,
  message: string,
}

interface SerializeErrorOptions {
  fallbackError?: object,
  shouldIncludeStack?: boolean,
}

export interface ISerializeError {
  (error: any, options?: SerializeErrorOptions): IEthereumRpcError<any>
}

export interface IGetMessageFromCode {
  (error: any, fallbackMessage?: string): string
}

export interface IEthErrors {
  rpc: {
    invalidInput: (opts?: ErrorArg) => IEthereumRpcError<any>,
    resourceNotFound: (opts?: ErrorArg) => IEthereumRpcError<any>,
    resourceUnavailable: (opts?: ErrorArg) => IEthereumRpcError<any>,
    transactionRejected: (opts?: ErrorArg) => IEthereumRpcError<any>,
    methodNotSupported: (opts?: ErrorArg) => IEthereumRpcError<any>,
    limitExceeded: (opts?: ErrorArg) => IEthereumRpcError<any>,
    parse: (opts?: ErrorArg) => IEthereumRpcError<any>,
    invalidRequest: (opts?: ErrorArg) => IEthereumRpcError<any>,
    invalidParams: (opts?: ErrorArg) => IEthereumRpcError<any>,
    methodNotFound: (opts?: ErrorArg) => IEthereumRpcError<any>,
    internal: (opts?: ErrorArg) => IEthereumRpcError<any>,
    server: (opts: IRpcServerErrorOptions) => IEthereumRpcError<any>,
  },
  provider: {
    userRejectedRequest: (opts?: ErrorArg) => IEthereumProviderError<any>,
    unauthorized: (opts?: ErrorArg) => IEthereumProviderError<any>,
    unsupportedMethod: (opts?: ErrorArg) => IEthereumProviderError<any>,
    disconnected: (opts?: ErrorArg) => IEthereumProviderError<any>,
    chainDisconnected: (opts?: ErrorArg) => IEthereumProviderError<any>,
    custom: (opts: IProviderCustomErrorOptions) => IEthereumProviderError<any>,
  }
}
