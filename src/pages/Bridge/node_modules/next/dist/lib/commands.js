"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.commands = void 0;
const commands = {
    build: ()=>Promise.resolve(require("../cli/next-build").nextBuild),
    start: ()=>Promise.resolve(require("../cli/next-start").nextStart),
    export: ()=>Promise.resolve(require("../cli/next-export").nextExport),
    dev: ()=>Promise.resolve(require("../cli/next-dev").nextDev),
    lint: ()=>Promise.resolve(require("../cli/next-lint").nextLint),
    telemetry: ()=>Promise.resolve(require("../cli/next-telemetry").nextTelemetry),
    info: ()=>Promise.resolve(require("../cli/next-info").nextInfo)
};
exports.commands = commands;

//# sourceMappingURL=commands.js.map