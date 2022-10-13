"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
var _detectDomainLocale = require("../../shared/lib/i18n/detect-domain-locale");
var _formatNextPathnameInfo = require("../../shared/lib/router/utils/format-next-pathname-info");
var _getHostname = require("../../shared/lib/get-hostname");
var _getNextPathnameInfo = require("../../shared/lib/router/utils/get-next-pathname-info");
const FLIGHT_PARAMETERS = [
    "__flight__",
    "__flight_router_state_tree__",
    "__flight_prefetch__", 
];
const REGEX_LOCALHOST_HOSTNAME = /(?!^https?:\/\/)(127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}|::1|localhost)/;
function parseURL(url, base) {
    return new URL(String(url).replace(REGEX_LOCALHOST_HOSTNAME, "localhost"), base && String(base).replace(REGEX_LOCALHOST_HOSTNAME, "localhost"));
}
function parseFlightParameters(searchParams) {
    let flightSearchParameters = {};
    let flightSearchParametersUpdated = false;
    for (const name of FLIGHT_PARAMETERS){
        const value = searchParams.get(name);
        if (value === null) {
            continue;
        }
        flightSearchParameters[name] = value;
        flightSearchParametersUpdated = true;
    }
    if (!flightSearchParametersUpdated) {
        return undefined;
    }
    return flightSearchParameters;
}
const Internal = Symbol("NextURLInternal");
class NextURL {
    constructor(input, baseOrOpts, opts){
        let base;
        let options;
        if (typeof baseOrOpts === "object" && "pathname" in baseOrOpts || typeof baseOrOpts === "string") {
            base = baseOrOpts;
            options = opts || {};
        } else {
            options = opts || baseOrOpts || {};
        }
        this[Internal] = {
            url: parseURL(input, base != null ? base : options.base),
            options: options,
            basePath: ""
        };
        this.analyzeUrl();
    }
    analyzeUrl() {
        var ref, ref1, ref2, ref3, ref4;
        const pathnameInfo = (0, _getNextPathnameInfo).getNextPathnameInfo(this[Internal].url.pathname, {
            nextConfig: this[Internal].options.nextConfig,
            parseData: true
        });
        this[Internal].domainLocale = (0, _detectDomainLocale).detectDomainLocale((ref = this[Internal].options.nextConfig) == null ? void 0 : (ref1 = ref.i18n) == null ? void 0 : ref1.domains, (0, _getHostname).getHostname(this[Internal].url, this[Internal].options.headers));
        const defaultLocale = ((ref2 = this[Internal].domainLocale) == null ? void 0 : ref2.defaultLocale) || ((ref3 = this[Internal].options.nextConfig) == null ? void 0 : (ref4 = ref3.i18n) == null ? void 0 : ref4.defaultLocale);
        this[Internal].url.pathname = pathnameInfo.pathname;
        this[Internal].defaultLocale = defaultLocale;
        var _basePath;
        this[Internal].basePath = (_basePath = pathnameInfo.basePath) != null ? _basePath : "";
        this[Internal].buildId = pathnameInfo.buildId;
        var _locale;
        this[Internal].locale = (_locale = pathnameInfo.locale) != null ? _locale : defaultLocale;
        this[Internal].trailingSlash = pathnameInfo.trailingSlash;
        this[Internal].flightSearchParameters = parseFlightParameters(this[Internal].url.searchParams);
    }
    formatPathname() {
        return (0, _formatNextPathnameInfo).formatNextPathnameInfo({
            basePath: this[Internal].basePath,
            buildId: this[Internal].buildId,
            defaultLocale: !this[Internal].options.forceLocale ? this[Internal].defaultLocale : undefined,
            locale: this[Internal].locale,
            pathname: this[Internal].url.pathname,
            trailingSlash: this[Internal].trailingSlash
        });
    }
    formatSearch() {
        const flightSearchParameters = this[Internal].flightSearchParameters;
        // If no flight parameters are set, return the search string as is.
        // This is a fast path to ensure URLSearchParams only has to be recreated on Flight requests.
        if (!flightSearchParameters) {
            return this[Internal].url.search;
        }
        // Create separate URLSearchParams to ensure the original search string is not modified.
        const searchParams = new URLSearchParams(this[Internal].url.searchParams);
        // If any exist this loop is always limited to the amount of FLIGHT_PARAMETERS.
        for(const name in flightSearchParameters){
            searchParams.set(name, flightSearchParameters[name]);
        }
        const params = searchParams.toString();
        return params === "" ? "" : `?${params}`;
    }
    get buildId() {
        return this[Internal].buildId;
    }
    set buildId(buildId) {
        this[Internal].buildId = buildId;
    }
    get flightSearchParameters() {
        return this[Internal].flightSearchParameters;
    }
    set flightSearchParameters(flightSearchParams) {
        if (flightSearchParams) {
            for (const name of FLIGHT_PARAMETERS){
                // Ensure only the provided values are set
                if (flightSearchParams[name]) {
                    this[Internal].url.searchParams.set(name, flightSearchParams[name]);
                } else {
                    // Delete the ones that are not provided as flightData should be overridden.
                    this[Internal].url.searchParams.delete(name);
                }
            }
        } else {
            for (const name of FLIGHT_PARAMETERS){
                this[Internal].url.searchParams.delete(name);
            }
        }
        this[Internal].flightSearchParameters = flightSearchParams;
    }
    get locale() {
        var _locale;
        return (_locale = this[Internal].locale) != null ? _locale : "";
    }
    set locale(locale) {
        var ref, ref5;
        if (!this[Internal].locale || !((ref = this[Internal].options.nextConfig) == null ? void 0 : (ref5 = ref.i18n) == null ? void 0 : ref5.locales.includes(locale))) {
            throw new TypeError(`The NextURL configuration includes no locale "${locale}"`);
        }
        this[Internal].locale = locale;
    }
    get defaultLocale() {
        return this[Internal].defaultLocale;
    }
    get domainLocale() {
        return this[Internal].domainLocale;
    }
    get searchParams() {
        return this[Internal].url.searchParams;
    }
    get host() {
        return this[Internal].url.host;
    }
    set host(value) {
        this[Internal].url.host = value;
    }
    get hostname() {
        return this[Internal].url.hostname;
    }
    set hostname(value) {
        this[Internal].url.hostname = value;
    }
    get port() {
        return this[Internal].url.port;
    }
    set port(value) {
        this[Internal].url.port = value;
    }
    get protocol() {
        return this[Internal].url.protocol;
    }
    set protocol(value) {
        this[Internal].url.protocol = value;
    }
    get href() {
        const pathname = this.formatPathname();
        const search = this.formatSearch();
        return `${this.protocol}//${this.host}${pathname}${search}`;
    }
    set href(url) {
        this[Internal].url = parseURL(url);
        this.analyzeUrl();
    }
    get origin() {
        return this[Internal].url.origin;
    }
    get pathname() {
        return this[Internal].url.pathname;
    }
    set pathname(value) {
        this[Internal].url.pathname = value;
    }
    get hash() {
        return this[Internal].url.hash;
    }
    set hash(value) {
        this[Internal].url.hash = value;
    }
    get search() {
        return this[Internal].url.search;
    }
    set search(value) {
        this[Internal].url.search = value;
    }
    get password() {
        return this[Internal].url.password;
    }
    set password(value) {
        this[Internal].url.password = value;
    }
    get username() {
        return this[Internal].url.username;
    }
    set username(value) {
        this[Internal].url.username = value;
    }
    get basePath() {
        return this[Internal].basePath;
    }
    set basePath(value) {
        this[Internal].basePath = value.startsWith("/") ? value : `/${value}`;
    }
    toString() {
        return this.href;
    }
    toJSON() {
        return this.href;
    }
    [Symbol.for("edge-runtime.inspect.custom")]() {
        return {
            href: this.href,
            origin: this.origin,
            protocol: this.protocol,
            username: this.username,
            password: this.password,
            host: this.host,
            hostname: this.hostname,
            port: this.port,
            pathname: this.pathname,
            search: this.search,
            searchParams: this.searchParams,
            hash: this.hash
        };
    }
    clone() {
        return new NextURL(String(this), this[Internal].options);
    }
}
exports.NextURL = NextURL;

//# sourceMappingURL=next-url.js.map