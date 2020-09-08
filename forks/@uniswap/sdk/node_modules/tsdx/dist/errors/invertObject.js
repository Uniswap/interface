"use strict";
/**
 * turns
 *   { 'MUCH ERROR': '0', 'SUCH WRONG': '1' }
 * into
 *   { 0: 'MUCH ERROR', 1: 'SUCH WRONG' }
 */
Object.defineProperty(exports, "__esModule", { value: true });
function invertObject(targetObj /* : ErrorMap */) {
    const result = {};
    const mapKeys = Object.keys(targetObj);
    for (const originalKey of mapKeys) {
        const originalVal = targetObj[originalKey];
        result[originalVal] = originalKey;
    }
    return result;
}
exports.invertObject = invertObject;
