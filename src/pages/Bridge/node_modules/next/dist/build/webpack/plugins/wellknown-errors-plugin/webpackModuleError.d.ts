import type { webpack } from 'next/dist/compiled/webpack/webpack';
import { SimpleWebpackError } from './simpleWebpackError';
export declare function getModuleBuildError(compilation: webpack.Compilation, input: any): Promise<SimpleWebpackError | false>;
