"use strict";
var _nodeFetch = _interopRequireWildcard(require("next/dist/compiled/node-fetch"));
function _getRequireWildcardCache() {
    if (typeof WeakMap !== "function") return null;
    var cache = new WeakMap();
    _getRequireWildcardCache = function() {
        return cache;
    };
    return cache;
}
function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache();
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {};
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
// Polyfill fetch() in the Node.js environment
if (!global.fetch) {
    const agent = ({ protocol  })=>protocol === "http:" ? global.__NEXT_HTTP_AGENT : global.__NEXT_HTTPS_AGENT;
    const fetchWithAgent = (url, opts, ...rest)=>{
        if (!opts) {
            opts = {
                agent
            };
        } else if (!opts.agent) {
            opts.agent = agent;
        }
        return (0, _nodeFetch).default(url, opts, ...rest);
    };
    global.fetch = fetchWithAgent;
    global.Headers = _nodeFetch.Headers;
    global.Request = _nodeFetch.Request;
    global.Response = _nodeFetch.Response;
}

//# sourceMappingURL=node-polyfill-fetch.js.map