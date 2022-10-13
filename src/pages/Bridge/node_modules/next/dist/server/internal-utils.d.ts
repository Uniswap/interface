import type { NextParsedUrlQuery } from './request-meta';
export declare function stripInternalQueries(query: NextParsedUrlQuery): void;
export declare function stripInternalSearchParams(searchParams: URLSearchParams, extended?: boolean): URLSearchParams;
