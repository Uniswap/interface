import type { I18NConfig } from '../../config-shared';
import { NextURL } from '../next-url';
import { NextCookies } from './cookies';
declare const INTERNALS: unique symbol;
export declare class NextResponse extends Response {
    [INTERNALS]: {
        cookies: NextCookies;
        url?: NextURL;
    };
    constructor(body?: BodyInit | null, init?: ResponseInit);
    get cookies(): NextCookies;
    static json(body: any, init?: ResponseInit): NextResponse;
    static redirect(url: string | NextURL | URL, init?: number | ResponseInit): NextResponse;
    static rewrite(destination: string | NextURL | URL, init?: ResponseInit): NextResponse;
    static next(init?: ResponseInit): NextResponse;
}
interface ResponseInit extends globalThis.ResponseInit {
    nextConfig?: {
        basePath?: string;
        i18n?: I18NConfig;
        trailingSlash?: boolean;
    };
    url?: string;
}
export {};
