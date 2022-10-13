"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.mockRequest = mockRequest;
var _stream = _interopRequireDefault(require("stream"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function mockRequest(requestUrl, requestHeaders, requestMethod, requestConnection) {
    const resBuffers = [];
    const mockRes = new _stream.default.Writable();
    const isStreamFinished = new Promise(function(resolve, reject) {
        mockRes.on("finish", ()=>resolve(true));
        mockRes.on("end", ()=>resolve(true));
        mockRes.on("error", (err)=>reject(err));
    });
    mockRes.write = (chunk)=>{
        resBuffers.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    };
    mockRes._write = (chunk, _encoding, callback)=>{
        mockRes.write(chunk);
        // According to Node.js documentation, the callback MUST be invoked to signal that
        // the write completed successfully. If this callback is not invoked, the 'finish' event
        // will not be emitted.
        // https://nodejs.org/docs/latest-v16.x/api/stream.html#writable_writechunk-encoding-callback
        callback();
    };
    const mockHeaders = {};
    mockRes.writeHead = (_status, _headers)=>Object.assign(mockHeaders, _headers);
    mockRes.getHeader = (name)=>mockHeaders[name.toLowerCase()];
    mockRes.getHeaders = ()=>mockHeaders;
    mockRes.getHeaderNames = ()=>Object.keys(mockHeaders);
    mockRes.setHeader = (name, value)=>mockHeaders[name.toLowerCase()] = value;
    mockRes.removeHeader = (name)=>{
        delete mockHeaders[name.toLowerCase()];
    };
    mockRes._implicitHeader = ()=>{};
    mockRes.connection = requestConnection;
    mockRes.finished = false;
    mockRes.statusCode = 200;
    const mockReq = new _stream.default.Readable();
    mockReq._read = ()=>{
        mockReq.emit("end");
        mockReq.emit("close");
        return Buffer.from("");
    };
    mockReq.headers = requestHeaders;
    mockReq.method = requestMethod;
    mockReq.url = requestUrl;
    mockReq.connection = requestConnection;
    return {
        resBuffers,
        req: mockReq,
        res: mockRes,
        streamPromise: isStreamFinished
    };
}

//# sourceMappingURL=mock-request.js.map