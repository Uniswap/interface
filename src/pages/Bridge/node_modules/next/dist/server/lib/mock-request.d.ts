/// <reference types="node" />
/// <reference types="node" />
export declare function mockRequest(requestUrl: string, requestHeaders: Record<string, string | string[] | undefined>, requestMethod: string, requestConnection?: any): {
    resBuffers: Buffer[];
    req: any;
    res: any;
    streamPromise: Promise<unknown>;
};
