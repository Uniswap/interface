"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.byteLength = byteLength;
function byteLength(payload) {
    return new TextEncoder().encode(payload).buffer.byteLength;
}

//# sourceMappingURL=web.js.map