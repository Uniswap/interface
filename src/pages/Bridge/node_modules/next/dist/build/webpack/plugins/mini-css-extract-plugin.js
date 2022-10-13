"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = void 0;
var _miniCssExtractPlugin = _interopRequireDefault(require("next/dist/compiled/mini-css-extract-plugin"));
class NextMiniCssExtractPlugin extends _miniCssExtractPlugin.default {
    __next_css_remove = true;
}
exports.default = NextMiniCssExtractPlugin;
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}

//# sourceMappingURL=mini-css-extract-plugin.js.map