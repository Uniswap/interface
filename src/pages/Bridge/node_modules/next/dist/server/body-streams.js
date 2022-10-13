"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.requestToBodyStream = requestToBodyStream;
exports.bodyStreamToNodeStream = bodyStreamToNodeStream;
exports.getClonableBody = getClonableBody;
var _stream = require("stream");
function requestToBodyStream(context, stream) {
    return new context.ReadableStream({
        start (controller) {
            stream.on("data", (chunk)=>controller.enqueue(chunk));
            stream.on("end", ()=>controller.close());
            stream.on("error", (err)=>controller.error(err));
        }
    });
}
function bodyStreamToNodeStream(bodyStream) {
    const reader = bodyStream.getReader();
    return _stream.Readable.from(async function*() {
        while(true){
            const { done , value  } = await reader.read();
            if (done) {
                return;
            }
            yield value;
        }
    }());
}
function replaceRequestBody(base, stream) {
    for(const key in stream){
        let v = stream[key];
        if (typeof v === "function") {
            v = v.bind(base);
        }
        base[key] = v;
    }
    return base;
}
function getClonableBody(readable) {
    let buffered = null;
    const endPromise = new Promise((resolve, reject)=>{
        readable.on("end", resolve);
        readable.on("error", reject);
    }).catch((error)=>{
        return {
            error
        };
    });
    return {
        /**
     * Replaces the original request body if necessary.
     * This is done because once we read the body from the original request,
     * we can't read it again.
     */ async finalize () {
            if (buffered) {
                const res = await endPromise;
                if (res && typeof res === "object" && res.error) {
                    throw res.error;
                }
                replaceRequestBody(readable, buffered);
                buffered = readable;
            }
        },
        /**
     * Clones the body stream
     * to pass into a middleware
     */ cloneBodyStream () {
            const input = buffered != null ? buffered : readable;
            const p1 = new _stream.PassThrough();
            const p2 = new _stream.PassThrough();
            input.pipe(p1);
            input.pipe(p2);
            buffered = p2;
            return p1;
        }
    };
}

//# sourceMappingURL=body-streams.js.map