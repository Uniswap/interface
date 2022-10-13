"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.removeTrailingSlash = removeTrailingSlash;
function removeTrailingSlash(route) {
    return route.replace(/\/$/, '') || '/';
}

//# sourceMappingURL=remove-trailing-slash.js.map