"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ensureLeadingSlash = ensureLeadingSlash;
function ensureLeadingSlash(path) {
    return path.startsWith('/') ? path : `/${path}`;
}

//# sourceMappingURL=ensure-leading-slash.js.map