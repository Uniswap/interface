"use strict";
var _appIndex = require("./app-index");
require("next/dist/client/components/app-router.client.js");
require("next/dist/client/components/layout-router.client.js");
window.next = {
    version: _appIndex.version,
    appDir: true
};
(0, _appIndex).hydrate();

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=app-next.js.map