export declare const CHAIN_TAG = "Chain";
export declare const api: import("@reduxjs/toolkit/dist/query").Api<import("@reduxjs/toolkit/dist/query").BaseQueryFn<{
    document: string | import("graphql").DocumentNode;
    variables?: any;
}, unknown, Pick<import("graphql-request").ClientError, "name" | "message" | "stack">, Partial<Pick<import("graphql-request").ClientError, "request" | "response">>, {}>, import("@reduxjs/toolkit/dist/query/endpointDefinitions").ReplaceTagTypes<{
    allV3Ticks: import("@reduxjs/toolkit/dist/query").QueryDefinition<any, import("@reduxjs/toolkit/dist/query").BaseQueryFn<{
        document: string | import("graphql").DocumentNode;
        variables?: any;
    }, unknown, Pick<import("graphql-request").ClientError, "name" | "message" | "stack">, Partial<Pick<import("graphql-request").ClientError, "request" | "response">>, {}>, never, any, string>;
    feeTierDistribution: import("@reduxjs/toolkit/dist/query").QueryDefinition<any, import("@reduxjs/toolkit/dist/query").BaseQueryFn<{
        document: string | import("graphql").DocumentNode;
        variables?: any;
    }, unknown, Pick<import("graphql-request").ClientError, "name" | "message" | "stack">, Partial<Pick<import("graphql-request").ClientError, "request" | "response">>, {}>, never, any, string>;
} & {
    allV3Ticks: import("@reduxjs/toolkit/dist/query").QueryDefinition<import("./generated").Exact<{
        poolAddress: string;
        skip: number;
    }>, import("@reduxjs/toolkit/dist/query").BaseQueryFn<{
        document: string | import("graphql").DocumentNode;
        variables?: any;
    }, unknown, Pick<import("graphql-request").ClientError, "name" | "message" | "stack">, Partial<Pick<import("graphql-request").ClientError, "request" | "response">>, {}>, never, import("./generated").AllV3TicksQuery, string>;
    feeTierDistribution: import("@reduxjs/toolkit/dist/query").QueryDefinition<import("./generated").Exact<{
        token0: string;
        token1: string;
    }>, import("@reduxjs/toolkit/dist/query").BaseQueryFn<{
        document: string | import("graphql").DocumentNode;
        variables?: any;
    }, unknown, Pick<import("graphql-request").ClientError, "name" | "message" | "stack">, Partial<Pick<import("graphql-request").ClientError, "request" | "response">>, {}>, never, import("./generated").FeeTierDistributionQuery, string>;
}, "Chain">, "dataApi", "Chain", typeof import("@reduxjs/toolkit/dist/query/core/module").coreModuleName | typeof import("@reduxjs/toolkit/dist/query/react/module").reactHooksModuleName>;
export declare const useAllV3TicksQuery: import("@reduxjs/toolkit/dist/query/react/buildHooks").UseQuery<import("@reduxjs/toolkit/dist/query").QueryDefinition<import("./generated").Exact<{
    poolAddress: string;
    skip: number;
}>, import("@reduxjs/toolkit/dist/query").BaseQueryFn<{
    document: string | import("graphql").DocumentNode;
    variables?: any;
}, unknown, Pick<import("graphql-request").ClientError, "name" | "message" | "stack">, Partial<Pick<import("graphql-request").ClientError, "request" | "response">>, {}>, "Chain", any, string>>, useFeeTierDistributionQuery: import("@reduxjs/toolkit/dist/query/react/buildHooks").UseQuery<import("@reduxjs/toolkit/dist/query").QueryDefinition<import("./generated").Exact<{
    token0: string;
    token1: string;
}>, import("@reduxjs/toolkit/dist/query").BaseQueryFn<{
    document: string | import("graphql").DocumentNode;
    variables?: any;
}, unknown, Pick<import("graphql-request").ClientError, "name" | "message" | "stack">, Partial<Pick<import("graphql-request").ClientError, "request" | "response">>, {}>, "Chain", any, string>>;
