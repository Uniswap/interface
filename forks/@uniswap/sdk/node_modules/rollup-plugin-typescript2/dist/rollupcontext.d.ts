import { IContext, VerbosityLevel } from "./context";
import { PluginContext } from "rollup";
export declare class RollupContext implements IContext {
    private verbosity;
    private bail;
    private context;
    private prefix;
    private hasContext;
    constructor(verbosity: VerbosityLevel, bail: boolean, context: PluginContext, prefix?: string);
    warn(message: string | (() => string)): void;
    error(message: string | (() => string)): void;
    info(message: string | (() => string)): void;
    debug(message: string | (() => string)): void;
}
//# sourceMappingURL=rollupcontext.d.ts.map