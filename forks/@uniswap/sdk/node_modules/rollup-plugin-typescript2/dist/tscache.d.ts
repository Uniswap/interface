import { IContext } from "./context";
import * as tsTypes from "typescript";
export interface ICode {
    code: string;
    map?: string;
    dts?: tsTypes.OutputFile;
    dtsmap?: tsTypes.OutputFile;
    references?: string[];
}
export interface IDiagnostics {
    flatMessage: string;
    formatted: string;
    fileLine?: string;
    category: tsTypes.DiagnosticCategory;
    code: number;
    type: string;
}
export declare function convertEmitOutput(output: tsTypes.EmitOutput, references?: string[]): ICode;
export declare function getAllReferences(importer: string, snapshot: tsTypes.IScriptSnapshot | undefined, options: tsTypes.CompilerOptions): string[];
export declare function convertDiagnostic(type: string, data: tsTypes.Diagnostic[]): IDiagnostics[];
export declare class TsCache {
    private noCache;
    private host;
    private cacheRoot;
    private options;
    private rollupConfig;
    private context;
    private cacheVersion;
    private cachePrefix;
    private dependencyTree;
    private ambientTypes;
    private ambientTypesDirty;
    private cacheDir;
    private codeCache;
    private typesCache;
    private semanticDiagnosticsCache;
    private syntacticDiagnosticsCache;
    private hashOptions;
    constructor(noCache: boolean, hashIgnoreUnknown: boolean, host: tsTypes.LanguageServiceHost, cacheRoot: string, options: tsTypes.CompilerOptions, rollupConfig: any, rootFilenames: string[], context: IContext);
    clean(): void;
    setDependency(importee: string, importer: string): void;
    walkTree(cb: (id: string) => void | false): void;
    done(): void;
    getCompiled(id: string, snapshot: tsTypes.IScriptSnapshot, transform: () => ICode | undefined): ICode | undefined;
    getSyntacticDiagnostics(id: string, snapshot: tsTypes.IScriptSnapshot, check: () => tsTypes.Diagnostic[]): IDiagnostics[];
    getSemanticDiagnostics(id: string, snapshot: tsTypes.IScriptSnapshot, check: () => tsTypes.Diagnostic[]): IDiagnostics[];
    private checkAmbientTypes;
    private getDiagnostics;
    private init;
    private markAsDirty;
    private isDirty;
    private makeName;
}
//# sourceMappingURL=tscache.d.ts.map