"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.loadStaticPaths = loadStaticPaths;
require("../node-polyfill-fetch");
var _utils = require("../../build/utils");
var _loadComponents = require("../load-components");
var _config = require("../config");
let workerWasUsed = false;
async function loadStaticPaths({ distDir , pathname , serverless , config , httpAgentOptions , locales , defaultLocale , isAppPath , originalAppPath  }) {
    // we only want to use each worker once to prevent any invalid
    // caches
    if (workerWasUsed) {
        process.exit(1);
    }
    // update work memory runtime-config
    require("../../shared/lib/runtime-config").setConfig(config);
    (0, _config).setHttpAgentOptions(httpAgentOptions);
    const components = await (0, _loadComponents).loadComponents({
        distDir,
        pathname: originalAppPath || pathname,
        serverless,
        hasServerComponents: false,
        isAppPath: !!isAppPath
    });
    if (!components.getStaticPaths && !isAppPath) {
        // we shouldn't get to this point since the worker should
        // only be called for SSG pages with getStaticPaths
        throw new Error(`Invariant: failed to load page with getStaticPaths for ${pathname}`);
    }
    workerWasUsed = true;
    if (isAppPath) {
        const generateParams = (0, _utils).collectGenerateParams(components.ComponentMod.tree);
        return (0, _utils).buildAppStaticPaths({
            page: pathname,
            generateParams,
            configFileName: config.configFileName
        });
    }
    return (0, _utils).buildStaticPaths({
        page: pathname,
        getStaticPaths: components.getStaticPaths,
        configFileName: config.configFileName,
        locales,
        defaultLocale
    });
}

//# sourceMappingURL=static-paths-worker.js.map