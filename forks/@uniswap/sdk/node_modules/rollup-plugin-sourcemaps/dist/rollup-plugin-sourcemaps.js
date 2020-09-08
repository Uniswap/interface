'use strict';

var rollupPluginutils = require('rollup-pluginutils');
var sourceMapResolve = require('source-map-resolve');
var fs = require('fs');

function sourcemaps() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      include = _ref.include,
      exclude = _ref.exclude,
      _ref$readFile = _ref.readFile,
      readFile$$1 = _ref$readFile === undefined ? fs.readFile : _ref$readFile;

  var filter = rollupPluginutils.createFilter(include, exclude);

  return {
    name: 'sourcemaps',

    load(id) {
      if (!filter(id)) {
        return null;
      }

      return new Promise(function (resolve$$1) {
        readFile$$1(id, 'utf8', function (err, code) {
          if (err) {
            // Failed reading file, let the next plugin deal with it
            resolve$$1(null);
          } else {
            sourceMapResolve.resolve(code, id, readFile$$1, function (err, sourceMap) {
              if (err || sourceMap === null) {
                // Either something went wrong, or there was no source map
                resolve$$1(code);
              } else {
                var map = sourceMap.map,
                    sourcesContent = sourceMap.sourcesContent;

                map.sourcesContent = sourcesContent;
                resolve$$1({ code, map });
              }
            });
          }
        });
      });
    }
  };
}

module.exports = sourcemaps;
//# sourceMappingURL=rollup-plugin-sourcemaps.js.map
