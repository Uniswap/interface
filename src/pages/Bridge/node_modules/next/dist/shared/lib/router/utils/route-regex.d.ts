export interface Group {
    pos: number;
    repeat: boolean;
    optional: boolean;
}
export interface RouteRegex {
    groups: {
        [groupName: string]: Group;
    };
    re: RegExp;
}
/**
 * From a normalized route this function generates a regular expression and
 * a corresponding groups object inteded to be used to store matching groups
 * from the regular expression.
 */
export declare function getRouteRegex(normalizedRoute: string): RouteRegex;
/**
 * This function extends `getRouteRegex` generating also a named regexp where
 * each group is named along with a routeKeys object that indexes the assigned
 * named group with its corresponding key.
 */
export declare function getNamedRouteRegex(normalizedRoute: string): {
    namedRegex: string;
    routeKeys: {
        [named: string]: string;
    };
    groups: {
        [groupName: string]: Group;
    };
    re: RegExp;
};
/**
 * Generates a named regexp.
 * This is intended to be using for build time only.
 */
export declare function getNamedMiddlewareRegex(normalizedRoute: string, options: {
    catchAll?: boolean;
}): {
    namedRegex: string;
};
