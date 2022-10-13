import type { CookieSerializeOptions } from '../types';
declare type GetWithOptionsOutput = {
    value: string | undefined;
    options: {
        [key: string]: string;
    };
};
export declare class Cookies extends Map<string, string> {
    constructor(input?: string | null);
    set(key: string, value: unknown, options?: CookieSerializeOptions): this;
}
export declare class NextCookies extends Cookies {
    response: Request | Response;
    constructor(response: Request | Response);
    get: (key: string) => string | undefined;
    getWithOptions: (key: string) => GetWithOptionsOutput;
    set: (key: string, value: unknown, options?: CookieSerializeOptions | undefined) => this;
    delete: (key: string, options?: CookieSerializeOptions) => boolean;
    clear: (options?: CookieSerializeOptions) => void;
}
export { CookieSerializeOptions };
