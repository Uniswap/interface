"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.hasNecessaryDependencies = hasNecessaryDependencies;
var _fs = require("fs");
var _fileExists = require("./file-exists");
var _resolveFrom = require("./resolve-from");
var _path = require("path");
async function hasNecessaryDependencies(baseDir, requiredPackages) {
    let resolutions = new Map();
    const missingPackages = [];
    await Promise.all(requiredPackages.map(async (p)=>{
        try {
            const pkgPath = await _fs.promises.realpath((0, _resolveFrom).resolveFrom(baseDir, `${p.pkg}/package.json`));
            const pkgDir = (0, _path).dirname(pkgPath);
            if (p.exportsRestrict) {
                const fileNameToVerify = (0, _path).relative(p.pkg, p.file);
                if (fileNameToVerify) {
                    const fileToVerify = (0, _path).join(pkgDir, fileNameToVerify);
                    if (await (0, _fileExists).fileExists(fileToVerify)) {
                        resolutions.set(p.pkg, fileToVerify);
                    } else {
                        return missingPackages.push(p);
                    }
                } else {
                    resolutions.set(p.pkg, pkgPath);
                }
            } else {
                resolutions.set(p.pkg, (0, _resolveFrom).resolveFrom(baseDir, p.file));
            }
        } catch (_) {
            return missingPackages.push(p);
        }
    }));
    return {
        resolved: resolutions,
        missing: missingPackages
    };
}

//# sourceMappingURL=has-necessary-dependencies.js.map