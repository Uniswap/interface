"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "setRevalidateHeaders", {
    enumerable: true,
    get: function() {
        return _revalidateHeaders.setRevalidateHeaders;
    }
});
exports.sendEtagResponse = sendEtagResponse;
exports.sendRenderResult = sendRenderResult;
var _utils = require("../../shared/lib/utils");
var _etag = require("../lib/etag");
var _fresh = _interopRequireDefault(require("next/dist/compiled/fresh"));
var _revalidateHeaders = require("./revalidate-headers");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function sendEtagResponse(req, res, etag) {
    if (etag) {
        /**
     * The server generating a 304 response MUST generate any of the
     * following header fields that would have been sent in a 200 (OK)
     * response to the same request: Cache-Control, Content-Location, Date,
     * ETag, Expires, and Vary. https://tools.ietf.org/html/rfc7232#section-4.1
     */ res.setHeader("ETag", etag);
    }
    if ((0, _fresh).default(req.headers, {
        etag
    })) {
        res.statusCode = 304;
        res.end();
        return true;
    }
    return false;
}
async function sendRenderResult({ req , res , result , type , generateEtags , poweredByHeader , options  }) {
    if ((0, _utils).isResSent(res)) {
        return;
    }
    if (poweredByHeader && type === "html") {
        res.setHeader("X-Powered-By", "Next.js");
    }
    const payload = result.isDynamic() ? null : await result.toUnchunkedString();
    if (payload) {
        const etag = generateEtags ? (0, _etag).generateETag(payload) : undefined;
        if (sendEtagResponse(req, res, etag)) {
            return;
        }
    }
    const resultContentType = result.contentType();
    if (!res.getHeader("Content-Type")) {
        res.setHeader("Content-Type", resultContentType ? resultContentType : type === "json" ? "application/json" : "text/html; charset=utf-8");
    }
    if (payload) {
        res.setHeader("Content-Length", Buffer.byteLength(payload));
    }
    if (options != null) {
        (0, _revalidateHeaders).setRevalidateHeaders(res, options);
    }
    if (req.method === "HEAD") {
        res.end(null);
    } else if (payload) {
        res.end(payload);
    } else {
        await result.pipe(res);
    }
}

//# sourceMappingURL=index.js.map