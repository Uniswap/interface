"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _concatStream = require("concat-stream");

var _concatStream2 = _interopRequireDefault(_concatStream);

var _lodash = require("lodash.template");

var _lodash2 = _interopRequireDefault(_lodash);

var _mapStream = require("map-stream");

var _mapStream2 = _interopRequireDefault(_mapStream);

var _vinylFs = require("vinyl-fs");

var _vinylFs2 = _interopRequireDefault(_vinylFs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = createModule;


function createModule(dir) {
  return new Promise(function (resolve, reject) {
    _vinylFs2.default.src(_path2.default.resolve(__dirname, "..", "templates", "**", "*"), { dot: true }).pipe(renameFiles({ gitignore: ".gitignore" })) // See: https://github.com/npm/npm/issues/3763
    .pipe(templateFiles({ name: _path2.default.basename(dir) })).once("error", reject).pipe(_vinylFs2.default.dest(dir)).pipe(collectFiles(resolve));
  });
}

function renameFiles(renames) {
  return (0, _mapStream2.default)(function (file, cb) {
    if (file.basename in renames) {
      file.basename = renames[file.basename];
    }
    cb(null, file);
  });
}

function templateFiles(data) {
  return (0, _mapStream2.default)(function (file, cb) {
    file.contents = new Buffer((0, _lodash2.default)(file.contents)(data));
    cb(null, file);
  });
}

function collectFiles(cb) {
  return (0, _concatStream2.default)(function (files) {
    return cb(files.map(function (file) {
      return file.path;
    }));
  });
}