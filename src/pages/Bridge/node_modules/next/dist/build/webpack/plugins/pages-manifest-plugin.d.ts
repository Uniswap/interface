import { webpack } from 'next/dist/compiled/webpack/webpack';
export declare type PagesManifest = {
    [page: string]: string;
};
export default class PagesManifestPlugin implements webpack.WebpackPluginInstance {
    serverless: boolean;
    dev: boolean;
    isEdgeRuntime: boolean;
    appDirEnabled: boolean;
    constructor({ serverless, dev, isEdgeRuntime, appDirEnabled, }: {
        serverless: boolean;
        dev: boolean;
        isEdgeRuntime: boolean;
        appDirEnabled: boolean;
    });
    createAssets(compilation: any, assets: any): void;
    apply(compiler: webpack.Compiler): void;
}
