import type { NodeHeaders } from './types';
export declare function fromNodeHeaders(object: NodeHeaders): Headers;
export declare function splitCookiesString(cookiesString: string): string[];
export declare function toNodeHeaders(headers?: Headers): NodeHeaders;
/**
 * Validate the correctness of a user-provided URL.
 */
export declare function validateURL(url: string | URL): string;
