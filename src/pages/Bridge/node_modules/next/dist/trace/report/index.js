"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.reporter = void 0;
var _toTelemetry = _interopRequireDefault(require("./to-telemetry"));
var _toJson = _interopRequireDefault(require("./to-json"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
class MultiReporter {
    reporters = [];
    constructor(reporters){
        this.reporters = reporters;
    }
    async flushAll() {
        await Promise.all(this.reporters.map((reporter1)=>reporter1.flushAll()));
    }
    report(spanName, duration, timestamp, id, parentId, attrs, startTime) {
        this.reporters.forEach((reporter2)=>reporter2.report(spanName, duration, timestamp, id, parentId, attrs, startTime));
    }
}
const reporter = new MultiReporter([
    _toJson.default,
    _toTelemetry.default
]);
exports.reporter = reporter;

//# sourceMappingURL=index.js.map