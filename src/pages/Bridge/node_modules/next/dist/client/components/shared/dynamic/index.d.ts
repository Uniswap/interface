import React from 'react';
export declare type LoaderComponent<P = {}> = Promise<{
    default: React.ComponentType<P>;
}>;
export declare type Loader<P = {}> = () => LoaderComponent<P>;
export declare type DynamicOptions<P = {}> = {
    loader?: Loader<P>;
};
export declare type LoadableComponent<P = {}> = React.ComponentType<P>;
export default function dynamic<P = {}>(loader: Loader<P>): React.ComponentType<P>;
