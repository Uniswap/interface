"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ImageConfigContext = void 0;
var _interop_require_default = require("@swc/helpers/lib/_interop_require_default.js").default;
var _react = _interop_require_default(require("react"));
var _imageConfig = require("./image-config");
const ImageConfigContext = _react.default.createContext(_imageConfig.imageConfigDefault);
exports.ImageConfigContext = ImageConfigContext;
if (process.env.NODE_ENV !== 'production') {
    ImageConfigContext.displayName = 'ImageConfigContext';
}

//# sourceMappingURL=image-config-context.js.map