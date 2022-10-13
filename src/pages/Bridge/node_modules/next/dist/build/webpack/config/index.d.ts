import type { webpack } from 'next/dist/compiled/webpack/webpack';
import type { NextConfigComplete } from '../../../server/config-shared';
export declare function build(config: webpack.Configuration, { supportedBrowsers, rootDirectory, customAppFile, isDevelopment, isServer, isEdgeRuntime, targetWeb, assetPrefix, sassOptions, productionBrowserSourceMaps, future, experimental, disableStaticImages, }: {
    supportedBrowsers: string[] | undefined;
    rootDirectory: string;
    customAppFile: RegExp | undefined;
    isDevelopment: boolean;
    isServer: boolean;
    isEdgeRuntime: boolean;
    targetWeb: boolean;
    assetPrefix: string;
    sassOptions: any;
    productionBrowserSourceMaps: boolean;
    future: NextConfigComplete['future'];
    experimental: NextConfigComplete['experimental'];
    disableStaticImages: NextConfigComplete['disableStaticImages'];
}): Promise<webpack.Configuration>;
