"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.flatReaddir = flatReaddir;
var _path = require("path");
var _nonNullable = require("./non-nullable");
var _fs = require("fs");
async function flatReaddir(dir, include) {
    const dirents = await _fs.promises.readdir(dir, {
        withFileTypes: true
    });
    const result = await Promise.all(dirents.map(async (part)=>{
        const absolutePath = (0, _path).join(dir, part.name);
        if (part.isSymbolicLink()) {
            const stats = await _fs.promises.stat(absolutePath);
            if (stats.isDirectory()) {
                return null;
            }
        }
        if (part.isDirectory() || !include.test(part.name)) {
            return null;
        }
        return absolutePath;
    }));
    return result.filter(_nonNullable.nonNullable);
}

//# sourceMappingURL=flat-readdir.js.map