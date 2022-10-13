"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getPackageVersion = getPackageVersion;
var _fs = require("fs");
var _findUp = _interopRequireDefault(require("next/dist/compiled/find-up"));
var _json5 = _interopRequireDefault(require("next/dist/compiled/json5"));
var path = _interopRequireWildcard(require("path"));
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
let cachedDeps;
function getDependencies({ cwd  }) {
    if (cachedDeps) {
        return cachedDeps;
    }
    return cachedDeps = (async ()=>{
        const configurationPath = await (0, _findUp).default("package.json", {
            cwd
        });
        if (!configurationPath) {
            return {
                dependencies: {},
                devDependencies: {}
            };
        }
        const content = await _fs.promises.readFile(configurationPath, "utf-8");
        const packageJson = _json5.default.parse(content);
        const { dependencies ={} , devDependencies ={}  } = packageJson || {};
        return {
            dependencies,
            devDependencies
        };
    })();
}
async function getPackageVersion({ cwd , name  }) {
    const { dependencies , devDependencies  } = await getDependencies({
        cwd
    });
    if (!(dependencies[name] || devDependencies[name])) {
        return null;
    }
    const cwd2 = cwd.endsWith(path.posix.sep) || cwd.endsWith(path.win32.sep) ? cwd : `${cwd}/`;
    try {
        const targetPath = require.resolve(`${name}/package.json`, {
            paths: [
                cwd2
            ]
        });
        const targetContent = await _fs.promises.readFile(targetPath, "utf-8");
        var _version;
        return (_version = _json5.default.parse(targetContent).version) != null ? _version : null;
    } catch  {
        return null;
    }
}

//# sourceMappingURL=get-package-version.js.map