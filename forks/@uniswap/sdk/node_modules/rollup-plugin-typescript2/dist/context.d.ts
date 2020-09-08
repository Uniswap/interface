export interface IContext {
    warn(message: string | (() => string)): void;
    error(message: string | (() => string)): void;
    info(message: string | (() => string)): void;
    debug(message: string | (() => string)): void;
}
export declare enum VerbosityLevel {
    Error = 0,
    Warning = 1,
    Info = 2,
    Debug = 3
}
export declare class ConsoleContext implements IContext {
    private verbosity;
    private prefix;
    constructor(verbosity: VerbosityLevel, prefix?: string);
    warn(message: string | (() => string)): void;
    error(message: string | (() => string)): void;
    info(message: string | (() => string)): void;
    debug(message: string | (() => string)): void;
}
//# sourceMappingURL=context.d.ts.map