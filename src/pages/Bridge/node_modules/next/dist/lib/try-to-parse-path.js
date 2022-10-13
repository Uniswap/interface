"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.tryToParsePath = tryToParsePath;
var _pathToRegexp = require("next/dist/compiled/path-to-regexp");
var _url = require("url");
var _isError = _interopRequireDefault(require("./is-error"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
/**
 * If there is an error show our error link but still show original error or
 * a formatted one if we can
 */ function reportError({ route , parsedPath  }, err) {
    let errMatches;
    if ((0, _isError).default(err) && (errMatches = err.message.match(/at (\d{0,})/))) {
        const position = parseInt(errMatches[1], 10);
        console.error(`\nError parsing \`${route}\` ` + `https://nextjs.org/docs/messages/invalid-route-source\n` + `Reason: ${err.message}\n\n` + `  ${parsedPath}\n` + `  ${new Array(position).fill(" ").join("")}^\n`);
    } else {
        console.error(`\nError parsing ${route} https://nextjs.org/docs/messages/invalid-route-source`, err);
    }
}
function tryToParsePath(route, options) {
    const result = {
        route,
        parsedPath: route
    };
    try {
        if (options == null ? void 0 : options.handleUrl) {
            const parsed = (0, _url).parse(route, true);
            result.parsedPath = `${parsed.pathname}${parsed.hash || ""}`;
        }
        result.tokens = (0, _pathToRegexp).parse(result.parsedPath);
        result.regexStr = (0, _pathToRegexp).tokensToRegexp(result.tokens).source;
    } catch (err) {
        reportError(result, err);
        result.error = err;
    }
    return result;
}

//# sourceMappingURL=try-to-parse-path.js.map