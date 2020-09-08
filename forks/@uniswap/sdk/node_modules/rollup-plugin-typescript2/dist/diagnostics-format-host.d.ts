import * as tsTypes from "typescript";
export declare class FormatHost implements tsTypes.FormatDiagnosticsHost {
    getCurrentDirectory(): string;
    getCanonicalFileName(fileName: string): string;
    getNewLine(): string;
}
export declare const formatHost: FormatHost;
//# sourceMappingURL=diagnostics-format-host.d.ts.map