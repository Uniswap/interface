"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.pick = pick;
function pick(obj, keys) {
    const newObj = {};
    for (const key of keys){
        newObj[key] = obj[key];
    }
    return newObj;
}

//# sourceMappingURL=pick.js.map