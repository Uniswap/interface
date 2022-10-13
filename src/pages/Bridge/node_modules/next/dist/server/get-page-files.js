"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getPageFiles = getPageFiles;
var _denormalizePagePath = require("../shared/lib/page-path/denormalize-page-path");
var _normalizePagePath = require("../shared/lib/page-path/normalize-page-path");
function getPageFiles(buildManifest, page) {
    const normalizedPage = (0, _denormalizePagePath).denormalizePagePath((0, _normalizePagePath).normalizePagePath(page));
    let files = buildManifest.pages[normalizedPage];
    if (!files) {
        console.warn(`Could not find files for ${normalizedPage} in .next/build-manifest.json`);
        return [];
    }
    return files;
}

//# sourceMappingURL=get-page-files.js.map