import type { webpack } from 'next/dist/compiled/webpack/webpack';
export declare function getClientStyleLoader({ isAppDir, isDevelopment, assetPrefix, }: {
    isAppDir: boolean;
    isDevelopment: boolean;
    assetPrefix: string;
}): webpack.RuleSetUseItem;
