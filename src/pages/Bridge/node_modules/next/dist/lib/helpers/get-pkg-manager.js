"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getPkgManager = getPkgManager;
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _childProcess = require("child_process");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function getPkgManager(baseDir) {
    try {
        for (const { lockFile , packageManager  } of [
            {
                lockFile: "yarn.lock",
                packageManager: "yarn"
            },
            {
                lockFile: "pnpm-lock.yaml",
                packageManager: "pnpm"
            },
            {
                lockFile: "package-lock.json",
                packageManager: "npm"
            }, 
        ]){
            if (_fs.default.existsSync(_path.default.join(baseDir, lockFile))) {
                return packageManager;
            }
        }
        const userAgent = process.env.npm_config_user_agent;
        if (userAgent) {
            if (userAgent.startsWith("yarn")) {
                return "yarn";
            } else if (userAgent.startsWith("pnpm")) {
                return "pnpm";
            }
        }
        try {
            (0, _childProcess).execSync("yarn --version", {
                stdio: "ignore"
            });
            return "yarn";
        } catch  {
            (0, _childProcess).execSync("pnpm --version", {
                stdio: "ignore"
            });
            return "pnpm";
        }
    } catch  {
        return "npm";
    }
}

//# sourceMappingURL=get-pkg-manager.js.map