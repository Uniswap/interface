import { BaseQueryFn } from '@reduxjs/toolkit/query';
import { DocumentNode } from 'graphql';
import { ClientError } from 'graphql-request';
export declare const api: import("@reduxjs/toolkit/query").Api<BaseQueryFn<{
    document: string | DocumentNode;
    variables?: any;
}, unknown, Pick<ClientError, "name" | "message" | "stack">, Partial<Pick<ClientError, "request" | "response">>, {}>, {
    allV3Ticks: import("@reduxjs/toolkit/query").QueryDefinition<any, BaseQueryFn<{
        document: string | DocumentNode;
        variables?: any;
    }, unknown, Pick<ClientError, "name" | "message" | "stack">, Partial<Pick<ClientError, "request" | "response">>, {}>, never, any, string>;
    feeTierDistribution: import("@reduxjs/toolkit/query").QueryDefinition<any, BaseQueryFn<{
        document: string | DocumentNode;
        variables?: any;
    }, unknown, Pick<ClientError, "name" | "message" | "stack">, Partial<Pick<ClientError, "request" | "response">>, {}>, never, any, string>;
}, "dataApi", never, typeof import("@reduxjs/toolkit/dist/query/core/module").coreModuleName | typeof import("@reduxjs/toolkit/dist/query/react/module").reactHooksModuleName>;
