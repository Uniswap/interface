"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.eventSwcLoadFailure = eventSwcLoadFailure;
var _shared = require("../../trace/shared");
var _packageJson = require("next/package.json");
const EVENT_PLUGIN_PRESENT = "NEXT_SWC_LOAD_FAILURE";
async function eventSwcLoadFailure(event) {
    const telemetry = _shared.traceGlobals.get("telemetry");
    // can't continue if telemetry isn't set
    if (!telemetry) return;
    let glibcVersion;
    let installedSwcPackages;
    try {
        var ref;
        // @ts-ignore
        glibcVersion = (ref = process.report) == null ? void 0 : ref.getReport().header.glibcVersionRuntime;
    } catch (_) {}
    try {
        const pkgNames = Object.keys(_packageJson.optionalDependencies || {}).filter((pkg)=>pkg.startsWith("@next/swc"));
        const installedPkgs = [];
        for (const pkg1 of pkgNames){
            try {
                const { version  } = require(`${pkg1}/package.json`);
                installedPkgs.push(`${pkg1}@${version}`);
            } catch (_) {}
        }
        if (installedPkgs.length > 0) {
            installedSwcPackages = installedPkgs.sort().join(",");
        }
    } catch (_1) {}
    telemetry.record({
        eventName: EVENT_PLUGIN_PRESENT,
        payload: {
            nextVersion: _packageJson.version,
            glibcVersion,
            installedSwcPackages,
            arch: process.arch,
            platform: process.platform,
            nodeVersion: process.versions.node,
            wasm: event == null ? void 0 : event.wasm
        }
    });
    // ensure this event is flushed before process exits
    await telemetry.flush();
}

//# sourceMappingURL=swc-load-failure.js.map