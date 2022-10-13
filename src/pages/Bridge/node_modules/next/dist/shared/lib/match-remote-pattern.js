"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.matchRemotePattern = matchRemotePattern;
exports.hasMatch = hasMatch;
var _micromatch = require("next/dist/compiled/micromatch");
function matchRemotePattern(pattern, url) {
    if (pattern.protocol !== undefined) {
        const actualProto = url.protocol.slice(0, -1);
        if (pattern.protocol !== actualProto) {
            return false;
        }
    }
    if (pattern.port !== undefined) {
        if (pattern.port !== url.port) {
            return false;
        }
    }
    if (pattern.hostname === undefined) {
        throw new Error(`Pattern should define hostname but found\n${JSON.stringify(pattern)}`);
    } else {
        if (!(0, _micromatch).makeRe(pattern.hostname).test(url.hostname)) {
            return false;
        }
    }
    var _pathname;
    if (!(0, _micromatch).makeRe((_pathname = pattern.pathname) != null ? _pathname : '**').test(url.pathname)) {
        return false;
    }
    return true;
}
function hasMatch(domains, remotePatterns, url) {
    return domains.some((domain)=>url.hostname === domain) || remotePatterns.some((p)=>matchRemotePattern(p, url));
}

//# sourceMappingURL=match-remote-pattern.js.map