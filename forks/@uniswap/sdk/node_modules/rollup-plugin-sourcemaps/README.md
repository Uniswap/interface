# rollup-plugin-sourcemaps

[![npm](https://img.shields.io/npm/v/rollup-plugin-sourcemaps.svg)](https://www.npmjs.com/package/rollup-plugin-sourcemaps)
[![Build Status](https://img.shields.io/travis/maxdavidson/rollup-plugin-sourcemaps/master.svg)](https://travis-ci.org/maxdavidson/rollup-plugin-sourcemaps)
[![Coverage Status](https://img.shields.io/coveralls/maxdavidson/rollup-plugin-sourcemaps/master.svg)](https://coveralls.io/github/maxdavidson/rollup-plugin-sourcemaps?branch=master)
[![Dependency Status](https://img.shields.io/david/maxdavidson/rollup-plugin-sourcemaps.svg)](https://david-dm.org/maxdavidson/rollup-plugin-sourcemaps)
[![devDependency Status](https://img.shields.io/david/dev/maxdavidson/rollup-plugin-sourcemaps.svg)](https://david-dm.org/maxdavidson/rollup-plugin-sourcemaps?type=dev)
[![Greenkeeper badge](https://badges.greenkeeper.io/maxdavidson/rollup-plugin-sourcemaps.svg)](https://greenkeeper.io/)

[Rollup](https://rollupjs.org) plugin for grabbing source maps from sourceMappingURLs.

Useful for working with precompiled modules with existing source maps, without resorting to [sorcery](https://github.com/Rich-Harris/sorcery).

Requires Rollup v0.31.2 or later.

Inspired by [webpack/source-map-loader](https://github.com/webpack/source-map-loader).


## Usage

```javascript
import sourcemaps from 'rollup-plugin-sourcemaps';

export default {
  entry: 'src/index.js',
  dest: 'dist/my-awesome-package.js',
  sourceMap: true,
  plugins: [
    sourcemaps()
  ]
};
```
