"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const constants_1 = require("./constants");
const util_1 = tslib_1.__importDefault(require("util"));
const mkdirp_1 = tslib_1.__importDefault(require("mkdirp"));
const progressEstimator = require('progress-estimator');
async function createProgressEstimator() {
    await util_1.default.promisify(mkdirp_1.default)(constants_1.paths.progressEstimatorCache);
    return progressEstimator({
        // All configuration keys are optional, but it's recommended to specify a storage location.
        storagePath: constants_1.paths.progressEstimatorCache,
    });
}
exports.createProgressEstimator = createProgressEstimator;
