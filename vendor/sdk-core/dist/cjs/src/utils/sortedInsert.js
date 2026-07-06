"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortedInsert = void 0;
const tslib_1 = require("tslib");
const tiny_invariant_1 = tslib_1.__importDefault(require("tiny-invariant"));
// given an array of items sorted by `comparator`, insert an item into its sort index and constrain the size to
// `maxSize` by removing the last item
function sortedInsert(items, add, maxSize, comparator) {
    (0, tiny_invariant_1.default)(maxSize > 0, 'MAX_SIZE_ZERO');
    // this is an invariant because the interface cannot return multiple removed items if items.length exceeds maxSize
    (0, tiny_invariant_1.default)(items.length <= maxSize, 'ITEMS_SIZE');
    // short circuit first item add
    if (items.length === 0) {
        items.push(add);
        return null;
    }
    else {
        const isFull = items.length === maxSize;
        // short circuit if full and the additional item does not come before the last item
        if (isFull && comparator(items[items.length - 1], add) <= 0) {
            return add;
        }
        let lo = 0, hi = items.length;
        while (lo < hi) {
            const mid = (lo + hi) >>> 1;
            if (comparator(items[mid], add) <= 0) {
                lo = mid + 1;
            }
            else {
                hi = mid;
            }
        }
        items.splice(lo, 0, add);
        return isFull ? items.pop() : null;
    }
}
exports.sortedInsert = sortedInsert;
//# sourceMappingURL=sortedInsert.js.map