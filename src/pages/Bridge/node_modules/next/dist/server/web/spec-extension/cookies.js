"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
var _cookie = _interopRequireDefault(require("next/dist/compiled/cookie"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const normalizeCookieOptions = (options)=>{
    options = Object.assign({}, options);
    if (options.maxAge) {
        options.expires = new Date(Date.now() + options.maxAge * 1000);
    }
    if (options.path == null) {
        options.path = "/";
    }
    return options;
};
const serializeValue = (value)=>typeof value === "object" ? `j:${JSON.stringify(value)}` : String(value);
const serializeExpiredCookie = (key, options = {})=>_cookie.default.serialize(key, "", {
        expires: new Date(0),
        path: "/",
        ...options
    });
const deserializeCookie = (input)=>{
    const value = input.headers.get("set-cookie");
    return value !== undefined && value !== null ? value.split(", ") : [];
};
const serializeCookie = (input)=>input.join(", ");
class Cookies extends Map {
    constructor(input){
        const parsedInput = typeof input === "string" ? _cookie.default.parse(input) : {};
        super(Object.entries(parsedInput));
    }
    set(key, value, options = {}) {
        return super.set(key, _cookie.default.serialize(key, serializeValue(value), normalizeCookieOptions(options)));
    }
    [Symbol.for("edge-runtime.inspect.custom")]() {
        return Object.fromEntries(this.entries());
    }
}
exports.Cookies = Cookies;
class NextCookies extends Cookies {
    constructor(response){
        super(response.headers.get("cookie"));
        this.response = response;
    }
    get = (...args)=>{
        return this.getWithOptions(...args).value;
    };
    getWithOptions = (...args)=>{
        const raw = super.get(...args);
        if (typeof raw !== "string") return {
            value: raw,
            options: {}
        };
        const { [args[0]]: value , ...options } = _cookie.default.parse(raw);
        return {
            value,
            options
        };
    };
    set = (...args)=>{
        const isAlreadyAdded = super.has(args[0]);
        super.set(...args);
        const currentCookie = super.get(args[0]);
        if (typeof currentCookie !== "string") {
            throw new Error(`Invariant: failed to generate cookie for ${JSON.stringify(args)}`);
        }
        if (isAlreadyAdded) {
            const setCookie = serializeCookie(deserializeCookie(this.response).filter((value)=>!value.startsWith(`${args[0]}=`)));
            if (setCookie) {
                this.response.headers.set("set-cookie", [
                    currentCookie,
                    setCookie
                ].join(", "));
            } else {
                this.response.headers.set("set-cookie", currentCookie);
            }
        } else {
            this.response.headers.append("set-cookie", currentCookie);
        }
        return this;
    };
    delete = (key, options = {})=>{
        const isDeleted = super.delete(key);
        if (isDeleted) {
            const setCookie = serializeCookie(deserializeCookie(this.response).filter((value)=>!value.startsWith(`${key}=`)));
            const expiredCookie = serializeExpiredCookie(key, options);
            this.response.headers.set("set-cookie", [
                expiredCookie,
                setCookie
            ].join(", "));
        }
        return isDeleted;
    };
    clear = (options = {})=>{
        const expiredCookies = Array.from(super.keys()).map((key)=>serializeExpiredCookie(key, options)).join(", ");
        if (expiredCookies) this.response.headers.set("set-cookie", expiredCookies);
        return super.clear();
    };
}
exports.NextCookies = NextCookies;

//# sourceMappingURL=cookies.js.map