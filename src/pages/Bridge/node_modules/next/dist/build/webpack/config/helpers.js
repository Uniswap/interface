"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.plugin = exports.unshiftLoader = exports.loader = void 0;
var _lodashCurry = _interopRequireDefault(require("next/dist/compiled/lodash.curry"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const loader = (0, _lodashCurry).default(function loader(rule, config) {
    var ref;
    if (!config.module) {
        config.module = {
            rules: []
        };
    }
    if (rule.oneOf) {
        var ref1;
        const existing = (ref1 = config.module.rules) == null ? void 0 : ref1.find((arrayRule)=>arrayRule && typeof arrayRule === "object" && arrayRule.oneOf);
        if (existing && typeof existing === "object") {
            existing.oneOf.push(...rule.oneOf);
            return config;
        }
    }
    (ref = config.module.rules) == null ? void 0 : ref.push(rule);
    return config;
});
exports.loader = loader;
const unshiftLoader = (0, _lodashCurry).default(function unshiftLoader(rule, config) {
    var ref;
    if (!config.module) {
        config.module = {
            rules: []
        };
    }
    if (rule.oneOf) {
        var ref2;
        const existing = (ref2 = config.module.rules) == null ? void 0 : ref2.find((arrayRule)=>arrayRule && typeof arrayRule === "object" && arrayRule.oneOf);
        if (existing && typeof existing === "object") {
            var ref3;
            (ref3 = existing.oneOf) == null ? void 0 : ref3.unshift(...rule.oneOf);
            return config;
        }
    }
    (ref = config.module.rules) == null ? void 0 : ref.unshift(rule);
    return config;
});
exports.unshiftLoader = unshiftLoader;
const plugin = (0, _lodashCurry).default(function plugin(p, config) {
    if (!config.plugins) {
        config.plugins = [];
    }
    config.plugins.push(p);
    return config;
});
exports.plugin = plugin;

//# sourceMappingURL=helpers.js.map