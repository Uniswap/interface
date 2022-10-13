"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.fetchInlineAsset = fetchInlineAsset;
var _fs = require("fs");
var _bodyStreams = require("../../body-streams");
var _path = require("path");
async function fetchInlineAsset(options) {
    var ref;
    const inputString = String(options.input);
    if (!inputString.startsWith("blob:")) {
        return;
    }
    const hash = inputString.replace("blob:", "");
    const asset = (ref = options.assets) == null ? void 0 : ref.find((x)=>x.name === hash);
    if (!asset) {
        return;
    }
    const filePath = (0, _path).resolve(options.distDir, asset.filePath);
    const fileIsReadable = await _fs.promises.access(filePath).then(()=>true, ()=>false);
    if (fileIsReadable) {
        const readStream = (0, _fs).createReadStream(filePath);
        return new options.context.Response((0, _bodyStreams).requestToBodyStream(options.context, readStream));
    }
}

//# sourceMappingURL=fetch-inline-assets.js.map