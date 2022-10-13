"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
var _webpackModuleError = require("./webpackModuleError");
const NAME = "WellKnownErrorsPlugin";
class WellKnownErrorsPlugin {
    apply(compiler) {
        compiler.hooks.compilation.tap(NAME, (compilation)=>{
            compilation.hooks.afterSeal.tapPromise(NAME, async ()=>{
                var ref;
                if ((ref = compilation.errors) == null ? void 0 : ref.length) {
                    await Promise.all(compilation.errors.map(async (err, i)=>{
                        try {
                            const moduleError = await (0, _webpackModuleError).getModuleBuildError(compilation, err);
                            if (moduleError !== false) {
                                compilation.errors[i] = moduleError;
                            }
                        } catch (e) {
                            console.log(e);
                        }
                    }));
                }
            });
        });
    }
}
exports.WellKnownErrorsPlugin = WellKnownErrorsPlugin;

//# sourceMappingURL=index.js.map