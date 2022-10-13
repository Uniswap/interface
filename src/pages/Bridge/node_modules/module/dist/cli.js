#!/usr/bin/env node
"use strict";

var _ = require("./");

var _2 = _interopRequireDefault(_);

var _package = require("../package.json");

var _package2 = _interopRequireDefault(_package);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _chalk = require("chalk");

var _chalk2 = _interopRequireDefault(_chalk);

var _tildify = require("tildify");

var _tildify2 = _interopRequireDefault(_tildify);

var _yargs = require("yargs");

var _yargs2 = _interopRequireDefault(_yargs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _yargs$usage$demand$o = _yargs2.default.usage("Usage: " + _chalk2.default.cyan(_package2.default.name, _chalk2.default.underline("<dir>"))).demand(0, 1, _chalk2.default.red("Too many directories specified.")).option("h", { alias: "help", describe: "Show help", type: "boolean" }).option("v", { alias: "version", describe: "Show version", type: "boolean" });

var argv = _yargs$usage$demand$o.argv;


if (argv.help || argv.h) {
  _yargs2.default.showHelp();
  process.exit();
}

if (argv.version || argv.v) {
  console.log(_package2.default.version);
  process.exit();
}

Promise.resolve(_path2.default.resolve(process.cwd(), argv._.length > 0 ? String(argv._[0]) : ".")).then(function (dir) {
  console.log(_chalk2.default.green("Creating module..."));
  return (0, _2.default)(dir);
}).then(function (files) {
  files.map(_tildify2.default).forEach(function (file) {
    return console.log(_chalk2.default.green("+", file));
  });
  console.log(_chalk2.default.green("Module created!"));
  process.exit();
}).catch(function () {
  console.error(_chalk2.default.red("An error occurred."));
  process.exit(1);
});