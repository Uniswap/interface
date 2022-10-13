interface ErrorCodes {
    readonly rpc: {
        readonly invalidInput: -32000;
        readonly resourceNotFound: -32001;
        readonly resourceUnavailable: -32002;
        readonly transactionRejected: -32003;
        readonly methodNotSupported: -32004;
        readonly limitExceeded: -32005;
        readonly parse: -32700;
        readonly invalidRequest: -32600;
        readonly methodNotFound: -32601;
        readonly invalidParams: -32602;
        readonly internal: -32603;
    };
    readonly provider: {
        readonly userRejectedRequest: 4001;
        readonly unauthorized: 4100;
        readonly unsupportedMethod: 4200;
        readonly disconnected: 4900;
        readonly chainDisconnected: 4901;
    };
}
export declare const errorCodes: ErrorCodes;
export declare const errorValues: {
    '-32700': {
        standard: string;
        message: string;
    };
    '-32600': {
        standard: string;
        message: string;
    };
    '-32601': {
        standard: string;
        message: string;
    };
    '-32602': {
        standard: string;
        message: string;
    };
    '-32603': {
        standard: string;
        message: string;
    };
    '-32000': {
        standard: string;
        message: string;
    };
    '-32001': {
        standard: string;
        message: string;
    };
    '-32002': {
        standard: string;
        message: string;
    };
    '-32003': {
        standard: string;
        message: string;
    };
    '-32004': {
        standard: string;
        message: string;
    };
    '-32005': {
        standard: string;
        message: string;
    };
    '4001': {
        standard: string;
        message: string;
    };
    '4100': {
        standard: string;
        message: string;
    };
    '4200': {
        standard: string;
        message: string;
    };
    '4900': {
        standard: string;
        message: string;
    };
    '4901': {
        standard: string;
        message: string;
    };
};
export {};
