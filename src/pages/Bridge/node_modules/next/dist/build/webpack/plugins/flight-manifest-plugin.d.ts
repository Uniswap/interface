/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { webpack } from 'next/dist/compiled/webpack/webpack';
interface Options {
    dev: boolean;
}
/**
 * Webpack module id
 */
declare type ModuleId = string | number;
export declare type ManifestChunks = Array<`${string}:${string}` | string>;
interface ManifestNode {
    [moduleExport: string]: {
        /**
         * Webpack module id
         */
        id: ModuleId;
        /**
         * Export name
         */
        name: string;
        /**
         * Chunks for the module. JS and CSS.
         */
        chunks: ManifestChunks;
    };
}
export declare type FlightManifest = {
    __ssr_module_mapping__: {
        [moduleId: string]: ManifestNode;
    };
} & {
    [modulePath: string]: ManifestNode;
};
export declare type FlightCSSManifest = {
    [modulePath: string]: string[];
};
export declare class FlightManifestPlugin {
    dev: Options['dev'];
    constructor(options: Options);
    apply(compiler: webpack.Compiler): void;
    createAsset(assets: webpack.Compilation['assets'], compilation: webpack.Compilation, context: string): void;
}
export {};
