"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.normalizeAppPath = normalizeAppPath;
function normalizeAppPath(pathname) {
    return pathname.split('/').reduce((acc, segment, index, segments)=>{
        // Empty segments are ignored.
        if (!segment) {
            return acc;
        }
        if (segment.startsWith('(') && segment.endsWith(')')) {
            return acc;
        }
        if (segment.startsWith('@')) {
            return acc;
        }
        if (segment === 'page' && index === segments.length - 1) {
            return acc;
        }
        return acc + `/${segment}`;
    }, '');
}

//# sourceMappingURL=app-paths.js.map