/// <reference types="node" />
import type { IncomingMessage, ServerResponse } from 'http';
import { __ApiPreviewProps } from '.';
import type { BaseNextRequest, BaseNextResponse } from '../base-http';
import type { PreviewData } from 'next/types';
export declare function tryGetPreviewData(req: IncomingMessage | BaseNextRequest, res: ServerResponse | BaseNextResponse, options: __ApiPreviewProps): PreviewData;
/**
 * Parse incoming message like `json` or `urlencoded`
 * @param req request object
 */
export declare function parseBody(req: IncomingMessage, limit: string | number): Promise<any>;
declare type ApiContext = __ApiPreviewProps & {
    trustHostHeader?: boolean;
    revalidate?: (_req: IncomingMessage, _res: ServerResponse) => Promise<any>;
};
export declare function apiResolver(req: IncomingMessage, res: ServerResponse, query: any, resolverModule: any, apiContext: ApiContext, propagateError: boolean, dev?: boolean, page?: string): Promise<void>;
export {};
