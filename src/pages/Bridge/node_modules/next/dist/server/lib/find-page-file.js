"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.findPageFile = findPageFile;
exports.isLayoutsLeafPage = isLayoutsLeafPage;
var _fileExists = require("../../lib/file-exists");
var _getPagePaths = require("../../shared/lib/page-path/get-page-paths");
var _nonNullable = require("../../lib/non-nullable");
var _path = require("path");
var _fs = require("fs");
var _log = require("../../build/output/log");
var _chalk = _interopRequireDefault(require("../../lib/chalk"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
async function isTrueCasePagePath(pagePath, pagesDir) {
    const pageSegments = (0, _path).normalize(pagePath).split(_path.sep).filter(Boolean);
    const segmentExistsPromises = pageSegments.map(async (segment, i)=>{
        const segmentParentDir = (0, _path).join(pagesDir, ...pageSegments.slice(0, i));
        const parentDirEntries = await _fs.promises.readdir(segmentParentDir);
        return parentDirEntries.includes(segment);
    });
    return (await Promise.all(segmentExistsPromises)).every(Boolean);
}
async function findPageFile(pagesDir, normalizedPagePath, pageExtensions, isAppDir) {
    const pagePaths = (0, _getPagePaths).getPagePaths(normalizedPagePath, pageExtensions, isAppDir);
    const [existingPath, ...others] = (await Promise.all(pagePaths.map(async (path)=>{
        const filePath = (0, _path).join(pagesDir, path);
        return await (0, _fileExists).fileExists(filePath) ? path : null;
    }))).filter(_nonNullable.nonNullable);
    if (!existingPath) {
        return null;
    }
    if (!await isTrueCasePagePath(existingPath, pagesDir)) {
        return null;
    }
    if (others.length > 0) {
        (0, _log).warn(`Duplicate page detected. ${_chalk.default.cyan((0, _path).join("pages", existingPath))} and ${_chalk.default.cyan((0, _path).join("pages", others[0]))} both resolve to ${_chalk.default.cyan(normalizedPagePath)}.`);
    }
    return existingPath;
}
function isLayoutsLeafPage(filePath) {
    return /[\\/]?page\.((server|client)\.?)?[jt]sx?$/.test(filePath);
}

//# sourceMappingURL=find-page-file.js.map