"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.findPagesDir = findPagesDir;
exports.existsSync = void 0;
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const existsSync = (f)=>{
    try {
        _fs.default.accessSync(f, _fs.default.constants.F_OK);
        return true;
    } catch (_) {
        return false;
    }
};
exports.existsSync = existsSync;
function findDir(dir, name) {
    // prioritize ./${name} over ./src/${name}
    let curDir = _path.default.join(dir, name);
    if (existsSync(curDir)) return curDir;
    curDir = _path.default.join(dir, "src", name);
    if (existsSync(curDir)) return curDir;
    return null;
}
function findPagesDir(dir, appDirEnabled) {
    const pagesDir = findDir(dir, "pages") || undefined;
    let appDir;
    if (appDirEnabled) {
        appDir = findDir(dir, "app") || undefined;
        if (appDirEnabled == null && pagesDir == null) {
            throw new Error("> Couldn't find any `pages` or `app` directory. Please create one under the project root");
        }
    }
    if (!appDirEnabled) {
        if (pagesDir == null) {
            throw new Error("> Couldn't find a `pages` directory. Please create one under the project root");
        }
    }
    return {
        pages: pagesDir,
        appDir
    };
}

//# sourceMappingURL=find-pages-dir.js.map