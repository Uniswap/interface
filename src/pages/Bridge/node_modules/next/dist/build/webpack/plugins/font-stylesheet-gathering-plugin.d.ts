import { webpack } from 'next/dist/compiled/webpack/webpack';
import { FontManifest } from '../../../server/font-utils';
export declare class FontStylesheetGatheringPlugin {
    compiler?: webpack.Compiler;
    gatheredStylesheets: Array<string>;
    manifestContent: FontManifest;
    isLikeServerless: boolean;
    adjustFontFallbacks?: boolean;
    constructor({ isLikeServerless, adjustFontFallbacks, }: {
        isLikeServerless: boolean;
        adjustFontFallbacks?: boolean;
    });
    private parserHandler;
    apply(compiler: webpack.Compiler): void;
}
