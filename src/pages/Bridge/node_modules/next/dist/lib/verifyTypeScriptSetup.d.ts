import { TypeCheckResult } from './typescript/runTypeCheck';
export declare function verifyTypeScriptSetup({ dir, cacheDir, intentDirs, tsconfigPath, typeCheckPreflight, disableStaticImages, }: {
    dir: string;
    cacheDir?: string;
    tsconfigPath: string;
    intentDirs: string[];
    typeCheckPreflight: boolean;
    disableStaticImages: boolean;
}): Promise<{
    result?: TypeCheckResult;
    version: string | null;
}>;
