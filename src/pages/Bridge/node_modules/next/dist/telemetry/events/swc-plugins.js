"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.eventSwcPlugins = eventSwcPlugins;
var _findUp = _interopRequireDefault(require("next/dist/compiled/find-up"));
var _path = _interopRequireDefault(require("path"));
var _fileExists = require("../../lib/file-exists");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const EVENT_SWC_PLUGIN_PRESENT = "NEXT_SWC_PLUGIN_DETECTED";
async function eventSwcPlugins(dir, config) {
    try {
        var ref, ref1;
        const packageJsonPath = await (0, _findUp).default("package.json", {
            cwd: dir
        });
        if (!packageJsonPath) {
            return [];
        }
        const { dependencies ={} , devDependencies ={}  } = require(packageJsonPath);
        const deps = {
            ...devDependencies,
            ...dependencies
        };
        var ref2;
        const swcPluginPackages = (ref2 = (ref = config.experimental) == null ? void 0 : (ref1 = ref.swcPlugins) == null ? void 0 : ref1.map(([name, _])=>name)) != null ? ref2 : [];
        return Promise.all(swcPluginPackages.map(async (plugin)=>{
            var _plugin;
            // swc plugins can be non-npm pkgs with absolute path doesn't have version
            const version = (_plugin = deps[plugin]) != null ? _plugin : undefined;
            let pluginName = plugin;
            if (await (0, _fileExists).fileExists(pluginName)) {
                pluginName = _path.default.basename(plugin, ".wasm");
            }
            return {
                eventName: EVENT_SWC_PLUGIN_PRESENT,
                payload: {
                    pluginName: pluginName,
                    pluginVersion: version
                }
            };
        }));
    } catch (_) {
        return [];
    }
}

//# sourceMappingURL=swc-plugins.js.map