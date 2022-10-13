import type { Header, Redirect, Rewrite, RouteType } from '../lib/load-custom-routes';
import type { Route } from './router';
import type { BaseNextRequest } from './base-http';
import type { ParsedUrlQuery } from 'querystring';
export declare function getCustomRoute(params: {
    rule: Header;
    type: RouteType;
    restrictedRedirectPaths: string[];
}): Route & Header;
export declare function getCustomRoute(params: {
    rule: Rewrite;
    type: RouteType;
    restrictedRedirectPaths: string[];
}): Route & Rewrite;
export declare function getCustomRoute(params: {
    rule: Redirect;
    type: RouteType;
    restrictedRedirectPaths: string[];
}): Route & Redirect;
export declare const createHeaderRoute: ({ rule, restrictedRedirectPaths, }: {
    rule: Header;
    restrictedRedirectPaths: string[];
}) => Route;
export declare const stringifyQuery: (req: BaseNextRequest, query: ParsedUrlQuery) => string;
export declare const createRedirectRoute: ({ rule, restrictedRedirectPaths, }: {
    rule: Redirect;
    restrictedRedirectPaths: string[];
}) => Route;
