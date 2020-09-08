import { createFilter } from 'rollup-pluginutils';
import { resolve } from 'source-map-resolve';
import { readFile } from 'fs';
import * as fs from 'fs';

function sourcemaps() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      include = _ref.include,
      exclude = _ref.exclude,
      _ref$readFile = _ref.readFile,
      readFile$$1 = _ref$readFile === undefined ? readFile : _ref$readFile;

  var filter = createFilter(include, exclude);

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
            resolve(code, id, readFile$$1, function (err, sourceMap) {
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

export default sourcemaps;
//# sourceMappingURL=rollup-plugin-sourcemaps.es.js.map
