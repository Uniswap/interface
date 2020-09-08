/// <reference types="jest" />
import { Logger } from 'bs-logger';
import { CompilerOptions, CustomTransformers, ParsedCommandLine } from 'typescript';
import { AstTransformerDesc, BabelConfig, BabelJestTransformer, TTypeScript, TsCompiler, TsJestConfig, TsJestGlobalOptions, TsJestHooksMap } from '../types';
export declare class ConfigSet {
    readonly parentOptions?: TsJestGlobalOptions | undefined;
    get projectPackageJson(): Record<string, any>;
    get projectDependencies(): Record<string, string>;
    get jest(): jest.ProjectConfig;
    get tsJest(): TsJestConfig;
    get typescript(): ParsedCommandLine;
    get tsconfig(): any;
    get versions(): Record<string, string>;
    private static loadConfig;
    get babel(): BabelConfig | undefined;
    get compilerModule(): TTypeScript;
    get babelJestTransformer(): BabelJestTransformer | undefined;
    get tsCompiler(): TsCompiler;
    get astTransformers(): AstTransformerDesc[];
    get tsCustomTransformers(): CustomTransformers;
    get hooks(): TsJestHooksMap;
    get shouldReportDiagnostic(): (filePath: string) => boolean;
    get shouldStringifyContent(): (filePath: string) => boolean;
    get tsCacheDir(): string | undefined;
    get overriddenCompilerOptions(): Partial<CompilerOptions>;
    get rootDir(): string;
    get cwd(): string;
    get tsJestDigest(): string;
    get cacheKey(): string;
    readonly logger: Logger;
    constructor(jestConfig: jest.ProjectConfig, parentOptions?: TsJestGlobalOptions | undefined, parentLogger?: Logger);
    resolvePath(inputPath: string, { throwIfMissing, nodeResolve }?: {
        throwIfMissing?: boolean;
        nodeResolve?: boolean;
    }): string;
}
