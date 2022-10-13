"use strict";
var _appIndex = require("./app-index");
// TODO-APP: hydration warning
window.next = {
    version: _appIndex.version,
    appDir: true
};
(0, _appIndex // TODO-APP: build indicator
).hydrate();

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=app-next-dev.js.map