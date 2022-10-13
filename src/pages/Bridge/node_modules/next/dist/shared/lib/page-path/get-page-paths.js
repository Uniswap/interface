"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getPagePaths = getPagePaths;
var _denormalizePagePath = require("./denormalize-page-path");
var _flatten = require("../flatten");
var _path = require("../isomorphic/path");
function getPagePaths(normalizedPagePath, extensions, isAppDir) {
    const page = (0, _denormalizePagePath).denormalizePagePath(normalizedPagePath);
    return (0, _flatten).flatten(extensions.map((extension)=>{
        const appPage = `${page}.${extension}`;
        const folderIndexPage = (0, _path).join(page, `index.${extension}`);
        if (!normalizedPagePath.endsWith('/index')) {
            return isAppDir ? [
                appPage
            ] : [
                `${page}.${extension}`,
                folderIndexPage
            ];
        }
        return [
            isAppDir ? appPage : folderIndexPage
        ];
    }));
}

//# sourceMappingURL=get-page-paths.js.map