import * as tsTypes from "typescript";
import { IOptions } from "./ioptions";
import { IContext } from "./context";
export declare function getOptionsOverrides({ useTsconfigDeclarationDir, cacheRoot, cwd }: IOptions, preParsedTsconfig?: tsTypes.ParsedCommandLine): tsTypes.CompilerOptions;
export declare function createFilter(context: IContext, pluginOptions: IOptions, parsedConfig: tsTypes.ParsedCommandLine): any;
//# sourceMappingURL=get-options-overrides.d.ts.map