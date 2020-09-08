<p align="center">
  <img src="https://github.com/terkelg/tiny-glob/raw/master/tiny-glob.png" alt="Tiny Glob" width="450" />
</p>

<h1 align="center">tiny glob</h1>

<p align="center">
  <a href="https://npmjs.org/package/tiny-glob">
    <img src="https://img.shields.io/npm/v/tiny-glob.svg" alt="version" />
  </a>
  <a href="https://travis-ci.org/terkelg/tiny-glob">
    <img src="https://img.shields.io/travis/terkelg/tiny-glob.svg" alt="travis" />
  </a>
  <a href="https://ci.appveyor.com/project/terkelg/tiny-glob/branch/master">
    <img src="https://ci.appveyor.com/api/projects/status/qe8sm2c7mwm0hxud/branch/master?svg=true" alt="AppVeyor"/>
  </a>
  <a href="https://npmjs.org/package/tiny-glob">
    <img src="https://img.shields.io/npm/dm/tiny-glob.svg" alt="downloads" />
  </a>
  <a href="https://packagephobia.now.sh/result?p=tiny-glob">
    <img src="https://packagephobia.now.sh/badge?p=tiny-glob" alt="install size" />
  </a>
</p>

<p align="center"><b>Tiny and extremely fast library to match files and folders using glob patterns.</b></p>

<br />


"Globs" is the common name for a specific type of pattern used to match files and folders. It's the patterns you type when you do stuff like `ls *.js` in your shell or put `src/*` in a `.gitignore` file. When used to match filenames, it's sometimes called a "wildcard".


## Install

```
npm install tiny-glob
```


## Core Features

- 🔥 **extremely fast:** ~350% faster than [node-glob](https://github.com/isaacs/node-glob) and ~230% faster than [fast-glob](https://github.com/mrmlnc/fast-glob)
- 💪 **powerful:** supports advanced globbing patterns (`ExtGlob`)
- 📦 **tiny**: only ~45 LOC with 2 small dependencies
- 👫 **friendly**: simple and easy to use api
- 🎭 **cross-platform**: supports both unix and windows


## Usage

```js
const glob = require('tiny-glob');

(async function(){
    let files = await glob('src/*/*.{js,md}');
    // => [ ... ] array of matching files
})();
```


## API


### glob(str, options)

Type: `function`<br>
Returns: `Array`

Return array of matching files and folders
This function is `async` and returns a promise.

#### str

Type: `String`

The glob pattern to match against.
> **OBS**: Please only use forward-slashes in glob expressions. Even on [windows](#windows)

#### options.cwd

Type: `String`<br>
Default: `'.'`

Change default working directory.

#### options.dot

Type: `Boolean`<br>
Default: `false`

Allow patterns to match filenames or directories that begin with a period (`.`).

#### options.absolute

Type: `Boolean`<br>
Default: `false`

Return matches as absolute paths.

#### options.filesOnly

Type: `Boolean`<br>
Default: `false`

Skip directories and return matched files only.

#### options.flush

Type: `Boolean`<br>
Default: `false`

Flush the internal cache object.


## Windows

Though Windows may use `/`, `\`, or `\\` as path separators, you can **only** use forward-slashes (`/`) when specifying glob expressions. Any back-slashes (`\`) will be interpreted as escape characters instead of path separators.

This is common across many glob-based modules; see [`node-glob`](https://github.com/isaacs/node-glob#windows) for corroboration.


## Benchmarks

```
glob x 13,405 ops/sec ±1.80% (85 runs sampled)
fast-glob x 25,745 ops/sec ±2.76% (59 runs sampled)
tiny-glob x 102,658 ops/sec ±0.79% (91 runs sampled)
Fastest is tiny-glob
┌───────────┬─────────────────────────┬─────────────┬────────────────┐
│ Name      │ Mean time               │ Ops/sec     │ Diff           │
├───────────┼─────────────────────────┼─────────────┼────────────────┤
│ glob      │ 0.00007459990597268128  │ 13,404.843  │ N/A            │
├───────────┼─────────────────────────┼─────────────┼────────────────┤
│ fast-glob │ 0.000038842529587611705 │ 25,744.976  │ 92.06% faster  │
├───────────┼─────────────────────────┼─────────────┼────────────────┤
│ tiny-glob │ 0.00000974110141018254  │ 102,657.796 │ 298.75% faster │
└───────────┴─────────────────────────┴─────────────┴────────────────┘
```

## Advanced Globbing

Learn more about advanced globbing

 - [Greg's Wiki](https://mywiki.wooledge.org/glob)
 - [Bash Extended Globbing](https://www.linuxjournal.com/content/bash-extended-globbing)


## License

MIT © [Terkel Gjervig](https://terkel.com)
