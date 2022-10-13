"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.eventCliSession = eventCliSession;
var _path = _interopRequireDefault(require("path"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const EVENT_VERSION = "NEXT_CLI_SESSION_STARTED";
function hasBabelConfig(dir) {
    try {
        var ref4, ref1, ref2, ref3;
        const noopFile = _path.default.join(dir, "noop.js");
        const res = require("next/dist/compiled/babel/core").loadPartialConfig({
            cwd: dir,
            filename: noopFile,
            sourceFileName: noopFile
        });
        const isForTooling = ((ref4 = res.options) == null ? void 0 : (ref1 = ref4.presets) == null ? void 0 : ref1.every((e)=>{
            var ref;
            return (e == null ? void 0 : (ref = e.file) == null ? void 0 : ref.request) === "next/babel";
        })) && ((ref2 = res.options) == null ? void 0 : (ref3 = ref2.plugins) == null ? void 0 : ref3.length) === 0;
        return res.hasFilesystemConfig() && !isForTooling;
    } catch  {
        return false;
    }
}
function eventCliSession(dir, nextConfig, event) {
    // This should be an invariant, if it fails our build tooling is broken.
    if (typeof "12.3.1" !== "string") {
        return [];
    }
    const { images , i18n  } = nextConfig || {};
    const payload = {
        nextVersion: "12.3.1",
        nodeVersion: process.version,
        cliCommand: event.cliCommand,
        isSrcDir: event.isSrcDir,
        hasNowJson: event.hasNowJson,
        isCustomServer: event.isCustomServer,
        hasNextConfig: nextConfig.configOrigin !== "default",
        buildTarget: nextConfig.target === "server" ? "default" : nextConfig.target,
        hasWebpackConfig: typeof (nextConfig == null ? void 0 : nextConfig.webpack) === "function",
        hasBabelConfig: hasBabelConfig(dir),
        imageEnabled: !!images,
        imageFutureEnabled: !!images,
        basePathEnabled: !!(nextConfig == null ? void 0 : nextConfig.basePath),
        i18nEnabled: !!i18n,
        locales: (i18n == null ? void 0 : i18n.locales) ? i18n.locales.join(",") : null,
        localeDomainsCount: (i18n == null ? void 0 : i18n.domains) ? i18n.domains.length : null,
        localeDetectionEnabled: !i18n ? null : i18n.localeDetection !== false,
        imageDomainsCount: (images == null ? void 0 : images.domains) ? images.domains.length : null,
        imageRemotePatternsCount: (images == null ? void 0 : images.remotePatterns) ? images.remotePatterns.length : null,
        imageSizes: (images == null ? void 0 : images.imageSizes) ? images.imageSizes.join(",") : null,
        imageLoader: images == null ? void 0 : images.loader,
        imageFormats: (images == null ? void 0 : images.formats) ? images.formats.join(",") : null,
        trailingSlashEnabled: !!(nextConfig == null ? void 0 : nextConfig.trailingSlash),
        reactStrictMode: !!(nextConfig == null ? void 0 : nextConfig.reactStrictMode),
        webpackVersion: event.webpackVersion || null
    };
    return [
        {
            eventName: EVENT_VERSION,
            payload
        }
    ];
}

//# sourceMappingURL=version.js.map