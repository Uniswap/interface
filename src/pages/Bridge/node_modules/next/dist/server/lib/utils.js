"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.printAndExit = printAndExit;
exports.getNodeOptionsWithoutInspect = getNodeOptionsWithoutInspect;
exports.getPort = getPort;
function printAndExit(message, code = 1) {
    if (code === 0) {
        console.log(message);
    } else {
        console.error(message);
    }
    process.exit(code);
}
function getNodeOptionsWithoutInspect() {
    const NODE_INSPECT_RE = /--inspect(-brk)?(=\S+)?( |$)/;
    return (process.env.NODE_OPTIONS || "").replace(NODE_INSPECT_RE, "");
}
function getPort(args) {
    if (typeof args["--port"] === "number") {
        return args["--port"];
    }
    const parsed = process.env.PORT && parseInt(process.env.PORT, 10);
    if (typeof parsed === "number" && !Number.isNaN(parsed)) {
        return parsed;
    }
    return 3000;
}

//# sourceMappingURL=utils.js.map