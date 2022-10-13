import { webpack } from 'next/dist/compiled/webpack/webpack';
import type { CssImports, ClientComponentImports } from '../loaders/next-flight-client-entry-loader';
interface Options {
    dev: boolean;
    isEdgeServer: boolean;
}
export declare const injectedClientEntries: Map<any, any>;
export declare class FlightClientEntryPlugin {
    dev: boolean;
    isEdgeServer: boolean;
    constructor(options: Options);
    apply(compiler: webpack.Compiler): void;
    createClientEndpoints(compiler: any, compilation: any): Promise<void>;
    collectClientComponentsAndCSSForDependency({ layoutOrPageRequest, compilation, dependency, }: {
        layoutOrPageRequest: string;
        compilation: any;
        dependency: any;
    }): [ClientComponentImports, CssImports];
    injectClientEntryAndSSRModules({ compiler, compilation, entryName, clientComponentImports, bundlePath, }: {
        compiler: any;
        compilation: any;
        entryName: string;
        clientComponentImports: ClientComponentImports;
        bundlePath: string;
    }): Promise<boolean>;
    addEntry(compilation: any, context: string, entry: any, options: {
        name: string;
        layer: string | undefined;
    }): Promise<any>;
}
export {};
