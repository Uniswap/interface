import * as tsTypes from "typescript";
import { TransformerFactoryCreator } from "./ioptions";
export declare class LanguageServiceHost implements tsTypes.LanguageServiceHost {
    private parsedConfig;
    private transformers;
    private cwd;
    private snapshots;
    private versions;
    private service?;
    private fileNames;
    constructor(parsedConfig: tsTypes.ParsedCommandLine, transformers: TransformerFactoryCreator[], cwd: string);
    reset(): void;
    setLanguageService(service: tsTypes.LanguageService): void;
    setSnapshot(fileName: string, data: string): tsTypes.IScriptSnapshot;
    getScriptSnapshot(fileName: string): tsTypes.IScriptSnapshot | undefined;
    getCurrentDirectory(): string;
    getScriptVersion(fileName: string): string;
    getScriptFileNames(): string[];
    getCompilationSettings(): tsTypes.CompilerOptions;
    getDefaultLibFileName(opts: tsTypes.CompilerOptions): string;
    useCaseSensitiveFileNames(): boolean;
    readDirectory(path: string, extensions?: string[], exclude?: string[], include?: string[]): string[];
    readFile(path: string, encoding?: string): string | undefined;
    fileExists(path: string): boolean;
    getTypeRootsVersion(): number;
    directoryExists(directoryName: string): boolean;
    getDirectories(directoryName: string): string[];
    getCustomTransformers(): tsTypes.CustomTransformers | undefined;
}
//# sourceMappingURL=host.d.ts.map