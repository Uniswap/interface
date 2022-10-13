"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = matchBundle;
var _getRouteFromAssetPath = _interopRequireDefault(require("../shared/lib/router/utils/get-route-from-asset-path"));
function matchBundle(regex, input) {
    const result = regex.exec(input);
    if (!result) {
        return null;
    }
    return (0, _getRouteFromAssetPath).default(`/${result[1]}`);
}
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}

//# sourceMappingURL=match-bundle.js.map