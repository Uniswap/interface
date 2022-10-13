"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.addLocale = addLocale;
var _addPathPrefix = require("./add-path-prefix");
var _pathHasPrefix = require("./path-has-prefix");
function addLocale(path, locale, defaultLocale, ignorePrefix) {
    if (locale && locale !== defaultLocale && (ignorePrefix || !(0, _pathHasPrefix).pathHasPrefix(path.toLowerCase(), `/${locale.toLowerCase()}`) && !(0, _pathHasPrefix).pathHasPrefix(path.toLowerCase(), '/api'))) {
        return (0, _addPathPrefix).addPathPrefix(path, `/${locale}`);
    }
    return path;
}

//# sourceMappingURL=add-locale.js.map