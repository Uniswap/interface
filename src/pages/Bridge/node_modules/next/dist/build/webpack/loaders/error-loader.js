"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = void 0;
var _chalk = _interopRequireDefault(require("next/dist/compiled/chalk"));
var _path = _interopRequireDefault(require("path"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const ErrorLoader = function() {
    var ref, ref1, ref2;
    // @ts-ignore exists
    const options = this.getOptions() || {};
    const { reason ="An unknown error has occurred"  } = options;
    var ref3;
    // @ts-expect-error
    const resource = (ref3 = (ref = this._module) == null ? void 0 : (ref1 = ref.issuer) == null ? void 0 : ref1.resource) != null ? ref3 : null;
    var _rootContext;
    const context = (_rootContext = this.rootContext) != null ? _rootContext : (ref2 = this._compiler) == null ? void 0 : ref2.context;
    const issuer = resource ? context ? _path.default.relative(context, resource) : resource : null;
    const err = new Error(reason + (issuer ? `\nLocation: ${_chalk.default.cyan(issuer)}` : ""));
    this.emitError(err);
};
var _default = ErrorLoader;
exports.default = _default;

//# sourceMappingURL=error-loader.js.map