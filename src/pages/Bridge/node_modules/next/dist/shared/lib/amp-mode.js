"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.isInAmpMode = isInAmpMode;
function isInAmpMode({ ampFirst =false , hybrid =false , hasQuery =false ,  } = {}) {
    return ampFirst || hybrid && hasQuery;
}

//# sourceMappingURL=amp-mode.js.map