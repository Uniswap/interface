"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.pitch = pitch;
exports.default = void 0;
function pitch() {
    const content = this.fs.readFileSync(this.resource);
    this.data.__checksum = (typeof content === "string" ? Buffer.from(content) : content).toString("hex");
}
const NextServerCSSLoader = function(content) {
    this.cacheable && this.cacheable();
    const isCSSModule = this.resource.match(/\.module\.css$/);
    if (isCSSModule) {
        return content + "\nmodule.exports.__checksum = " + JSON.stringify(this.data.__checksum);
    }
    return `export default ${JSON.stringify(this.data.__checksum)}`;
};
var _default = NextServerCSSLoader;
exports.default = _default;

//# sourceMappingURL=next-flight-css-dev-loader.js.map