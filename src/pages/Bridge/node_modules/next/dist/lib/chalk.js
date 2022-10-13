"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = void 0;
let chalk;
if (process.env.NEXT_RUNTIME === "edge") {
    chalk = require("./web/chalk").default;
} else {
    chalk = require("next/dist/compiled/chalk");
}
var _default = chalk;
exports.default = _default;

//# sourceMappingURL=chalk.js.map