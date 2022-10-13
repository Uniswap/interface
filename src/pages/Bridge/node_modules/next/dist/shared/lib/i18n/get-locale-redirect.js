"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getLocaleRedirect = getLocaleRedirect;
var _extends = require("@swc/helpers/lib/_extends.js").default;
var _acceptHeader = require("../../../server/accept-header");
var _denormalizePagePath = require("../page-path/denormalize-page-path");
var _detectDomainLocale = require("./detect-domain-locale");
var _formatUrl = require("../router/utils/format-url");
var _apiUtils = require("../../../server/api-utils");
function getLocaleFromCookie(i18n, headers = {}) {
    var ref, ref1;
    const nextLocale = (ref = (0, _apiUtils).getCookieParser(headers || {})()) == null ? void 0 : (ref1 = ref.NEXT_LOCALE) == null ? void 0 : ref1.toLowerCase();
    return nextLocale ? i18n.locales.find((locale)=>nextLocale === locale.toLowerCase()) : undefined;
}
function detectLocale({ i18n , headers , domainLocale , preferredLocale , pathLocale  }) {
    return pathLocale || (domainLocale == null ? void 0 : domainLocale.defaultLocale) || getLocaleFromCookie(i18n, headers) || preferredLocale || i18n.defaultLocale;
}
function getAcceptPreferredLocale(i18n, headers) {
    if ((headers == null ? void 0 : headers['accept-language']) && !Array.isArray(headers['accept-language'])) {
        try {
            return (0, _acceptHeader).acceptLanguage(headers['accept-language'], i18n.locales);
        } catch (err) {}
    }
}
function getLocaleRedirect({ defaultLocale , domainLocale , pathLocale , headers , nextConfig , urlParsed  }) {
    if (nextConfig.i18n && nextConfig.i18n.localeDetection !== false && (0, _denormalizePagePath).denormalizePagePath(urlParsed.pathname) === '/') {
        const preferredLocale = getAcceptPreferredLocale(nextConfig.i18n, headers);
        const detectedLocale = detectLocale({
            i18n: nextConfig.i18n,
            preferredLocale,
            headers,
            pathLocale,
            domainLocale
        });
        const preferredDomain = (0, _detectDomainLocale).detectDomainLocale(nextConfig.i18n.domains, undefined, preferredLocale);
        if (domainLocale && preferredDomain) {
            const isPDomain = preferredDomain.domain === domainLocale.domain;
            const isPLocale = preferredDomain.defaultLocale === preferredLocale;
            if (!isPDomain || !isPLocale) {
                const scheme = `http${preferredDomain.http ? '' : 's'}`;
                const rlocale = isPLocale ? '' : preferredLocale;
                return `${scheme}://${preferredDomain.domain}/${rlocale}`;
            }
        }
        if (detectedLocale.toLowerCase() !== defaultLocale.toLowerCase()) {
            return (0, _formatUrl).formatUrl(_extends({}, urlParsed, {
                pathname: `${nextConfig.basePath || ''}/${detectedLocale}`
            }));
        }
    }
}

//# sourceMappingURL=get-locale-redirect.js.map