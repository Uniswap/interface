"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.patchIncorrectLockfile = patchIncorrectLockfile;
var _fs = require("fs");
require("../server/node-polyfill-fetch");
var Log = _interopRequireWildcard(require("../build/output/log"));
var _findUp = _interopRequireDefault(require("next/dist/compiled/find-up"));
var _childProcess = require("child_process");
var _packageJson = _interopRequireDefault(require("next/package.json"));
var _ciInfo = require("../telemetry/ci-info");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _getRequireWildcardCache() {
    if (typeof WeakMap !== "function") return null;
    var cache = new WeakMap();
    _getRequireWildcardCache = function() {
        return cache;
    };
    return cache;
}
function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache();
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {};
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
let registry;
async function fetchPkgInfo(pkg) {
    if (!registry) {
        try {
            const output = (0, _childProcess).execSync("npm config get registry").toString().trim();
            if (output.startsWith("http")) {
                registry = output;
                if (!registry.endsWith("/")) {
                    registry += "/";
                }
            }
        } catch (_) {
            registry = `https://registry.npmjs.org/`;
        }
    }
    const res = await fetch(`${registry}${pkg}`);
    if (!res.ok) {
        throw new Error(`Failed to fetch registry info for ${pkg}, got status ${res.status}`);
    }
    const data = await res.json();
    const versionData = data.versions[_packageJson.default.version];
    return {
        os: versionData.os,
        cpu: versionData.cpu,
        engines: versionData.engines,
        tarball: versionData.dist.tarball,
        integrity: versionData.dist.integrity
    };
}
async function patchIncorrectLockfile(dir) {
    if (process.env.NEXT_IGNORE_INCORRECT_LOCKFILE) {
        return;
    }
    const lockfilePath = await (0, _findUp).default("package-lock.json", {
        cwd: dir
    });
    if (!lockfilePath) {
        // if no lockfile present there is no action to take
        return;
    }
    const content = await _fs.promises.readFile(lockfilePath, "utf8");
    // maintain current line ending
    const endingNewline = content.endsWith("\r\n") ? "\r\n" : content.endsWith("\n") ? "\n" : "";
    const lockfileParsed = JSON.parse(content);
    const lockfileVersion = parseInt(lockfileParsed == null ? void 0 : lockfileParsed.lockfileVersion, 10);
    const expectedSwcPkgs = Object.keys(_packageJson.default.optionalDependencies || {});
    const patchDependency = (pkg, pkgData)=>{
        lockfileParsed.dependencies[pkg] = {
            version: _packageJson.default.version,
            resolved: pkgData.tarball,
            integrity: pkgData.integrity,
            optional: true
        };
    };
    const patchPackage = (pkg, pkgData)=>{
        lockfileParsed.packages[pkg] = {
            version: _packageJson.default.version,
            resolved: pkgData.tarball,
            integrity: pkgData.integrity,
            cpu: pkgData.cpu,
            optional: true,
            os: pkgData.os,
            engines: pkgData.engines
        };
    };
    try {
        const supportedVersions = [
            1,
            2,
            3
        ];
        if (!supportedVersions.includes(lockfileVersion)) {
            // bail on unsupported version
            return;
        }
        // v1 only uses dependencies
        // v2 uses dependencies and packages
        // v3 only uses packages
        const shouldPatchDependencies = lockfileVersion === 1 || lockfileVersion === 2;
        const shouldPatchPackages = lockfileVersion === 2 || lockfileVersion === 3;
        if (shouldPatchDependencies && !lockfileParsed.dependencies || shouldPatchPackages && !lockfileParsed.packages) {
            // invalid lockfile so bail
            return;
        }
        const missingSwcPkgs = [];
        let pkgPrefix;
        if (shouldPatchPackages) {
            pkgPrefix = "";
            for (const pkg of Object.keys(lockfileParsed.packages)){
                if (pkg.endsWith("node_modules/next")) {
                    pkgPrefix = pkg.substring(0, pkg.length - 4);
                }
            }
            if (!pkgPrefix) {
                // unable to locate the next package so bail
                return;
            }
        }
        for (const pkg1 of expectedSwcPkgs){
            if (shouldPatchDependencies && !lockfileParsed.dependencies[pkg1] || shouldPatchPackages && !lockfileParsed.packages[`${pkgPrefix}${pkg1}`]) {
                missingSwcPkgs.push(pkg1);
            }
        }
        if (missingSwcPkgs.length === 0) {
            return;
        }
        Log.warn(`Found lockfile missing swc dependencies,`, _ciInfo.isCI ? "run next locally to automatically patch" : "patching...");
        if (_ciInfo.isCI) {
            // no point in updating in CI as the user can't save the patch
            return;
        }
        const pkgsData = await Promise.all(missingSwcPkgs.map((pkg)=>fetchPkgInfo(pkg)));
        for(let i = 0; i < pkgsData.length; i++){
            const pkg = missingSwcPkgs[i];
            const pkgData = pkgsData[i];
            if (shouldPatchDependencies) {
                patchDependency(pkg, pkgData);
            }
            if (shouldPatchPackages) {
                patchPackage(`${pkgPrefix}${pkg}`, pkgData);
            }
        }
        await _fs.promises.writeFile(lockfilePath, JSON.stringify(lockfileParsed, null, 2) + endingNewline);
        Log.warn('Lockfile was successfully patched, please run "npm install" to ensure @next/swc dependencies are downloaded');
    } catch (err) {
        Log.error(`Failed to patch lockfile, please try uninstalling and reinstalling next in this workspace`);
        console.error(err);
    }
}

//# sourceMappingURL=patch-incorrect-lockfile.js.map