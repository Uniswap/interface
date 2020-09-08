# rollup-plugin-typescript2

[![npm-version](https://img.shields.io/npm/v/rollup-plugin-typescript2.svg?maxAge=259200)](https://npmjs.org/package/rollup-plugin-typescript2)
![npm-monthly-downloads](https://img.shields.io/npm/dm/rollup-plugin-typescript2.svg?maxAge=259200)
[![Codeship Status](https://app.codeship.com/projects/fe9cf8f0-e8d4-0134-ec88-4e3d33dcd7ed/status?branch=master)](https://app.codeship.com/projects/207445)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/e19b72ab9658405bbfb32dd6d65d1856)](https://www.codacy.com/app/zolenkoe/rollup-plugin-typescript2?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=ezolenko/rollup-plugin-typescript2&amp;utm_campaign=Badge_Grade)

Rollup plugin for typescript with compiler errors.

This is a rewrite of original rollup-plugin-typescript, starting and borrowing from [this fork](https://github.com/alexlur/rollup-plugin-typescript).

This version is somewhat slower than original, but it will print out typescript syntactic and semantic diagnostic messages (the main reason for using typescript after all).

## Installation

```bash
# with npm
npm install rollup-plugin-typescript2 typescript --save-dev
# with yarn
yarn add rollup-plugin-typescript2 typescript --dev
```

## Usage

```js
// rollup.config.js
import typescript from 'rollup-plugin-typescript2';

export default {
	input: './main.ts',

	plugins: [
		typescript(/*{ plugin options }*/)
	]
}
```

The plugin inherits all compiler options and file lists from your `tsconfig.json` file. If your tsconfig has another name or another relative path from the root directory, see `tsconfigDefaults`, `tsconfig` and `tsconfigOverride` options below. This also allows for passing in different tsconfig files depending on your build target.

#### Some compiler options are forced

* `noEmitHelpers`: false
* `importHelpers`: true
* `noResolve`: false
* `noEmit`: false
* `inlineSourceMap`: false (see [#71](https://github.com/ezolenko/rollup-plugin-typescript2/issues/71))
* `outDir`: `./placeholder` in cache root, see [83](https://github.com/ezolenko/rollup-plugin-typescript2/issues/83) and [Microsoft/TypeScript/issues/24715](https://github.com/Microsoft/TypeScript/issues/24715)
* `declarationDir`: `process.cwd()` (*only if `useTsconfigDeclarationDir` is false in the plugin options*)
* `moduleResolution`: `node` (*`classic` is [deprecated](https://www.typescriptlang.org/docs/handbook/module-resolution.html). It also breaks this plugin, see [#12](https://github.com/ezolenko/rollup-plugin-typescript2/issues/12) and [#14](https://github.com/ezolenko/rollup-plugin-typescript2/issues/14)*)
* `allowNonTsExtensions`: true to let other plugins on the chain generate typescript, update plugin's include filter to pick them up (see [#111](https://github.com/ezolenko/rollup-plugin-typescript2/issues/111))

#### Some compiler options have more than one compatible value.

* `module`: defaults to `ES2015`, other valid value is `ESNext` (required for dynamic imports, see [#54](https://github.com/ezolenko/rollup-plugin-typescript2/issues/54)).

#### Some options need additional configuration on plugin side

* `allowJs`: lets typescript process js files as well, if you use it, modify plugin's `include` option to add `"*.js+(|x)", "**/*.js+(|x)"` (might want to exclude node_modules, it will slow down the build significantly).

### Compatibility

#### rollup-plugin-node-resolve

Must be before rollup-plugin-typescript2 in the plugin list, especially when `browser: true` option is used, see [#66](https://github.com/ezolenko/rollup-plugin-typescript2/issues/66)

#### rollup-plugin-commonjs

See explanation for `rollupCommonJSResolveHack` option below.

#### plugins using async/await

See `objectHashIgnoreUnknownHack` below.

#### rollup-plugin-babel

This plugin transpiles code, but doesn't change file extension. Babel plugin, even though it claims it processes all files, only looks at code with those extensions by default: `.js,.jsx,.es6,.es,.mjs`. To workaround add `ts` and `tsx` to the list of babel extensions.

```js
...
import { DEFAULT_EXTENSIONS } from '@babel/core';
...
	babel({
		extensions: [
			...DEFAULT_EXTENSIONS,
			'.ts',
			'.tsx'
		]
	}),
...
```

See [#108](https://github.com/ezolenko/rollup-plugin-typescript2/issues/108)

### Plugin options

* `cwd`: `string`

    The current work directory, default `process.cwd()`.

* `tsconfigDefaults`: `{}`

	The object passed as `tsconfigDefaults` will be merged with loaded `tsconfig.json`. Final config passed to typescript will be the result of values in `tsconfigDefaults` replaced by values in loaded `tsconfig.json`, replaced by values in `tsconfigOverride` and then replaced by hard `compilerOptions` overrides on top of that (see above).

	For simplicity and other tools' sake, try to minimize usage of defaults and overrides and keep everything in `tsconfig.json` file (tsconfigs can themselves be chained, so save some turtles).

	```js
	let defaults = { compilerOptions: { declaration: true } };
	let override = { compilerOptions: { declaration: false } };

	// ...
	plugins: [
		typescript({
			tsconfigDefaults: defaults,
			tsconfig: "tsconfig.json",
			tsconfigOverride: override
		})
	]
	```

	This is a [deep merge](https://lodash.com/docs/4.17.4#merge) (objects are merged, arrays are concatenated, primitives are replaced, etc), increase `verbosity` to 3 and look for `parsed tsconfig` if you get something unexpected.

* `tsconfig`: `undefined`

    Path to `tsconfig.json`. Set this if your tsconfig has another name or relative location from the project directory. By default will try to load `./tsconfig.json`, but will not fail if file is missing unless the value is set explicitly.

* `tsconfigOverride`: `{}`

	See `tsconfigDefaults`.

* `check`: true

	Set to false to avoid doing any diagnostic checks on the code.

* `verbosity`: 1

	- 0 -- Error
	- 1 -- Warning
	- 2 -- Info
	- 3 -- Debug

* `clean`: false

	Set to true for clean build (wipes out cache on every build).

* `cacheRoot`: `node_modules/.cache/rollup-plugin-typescript2`

	Path to cache. Defaults to a folder in node_modules.

* `include`: `[ "*.ts+(|x)", "**/*.ts+(|x)" ]`

	By default passes all .ts files through typescript compiler.

* `exclude`: `[ "*.d.ts", "**/*.d.ts" ]`

	But excludes type definitions.

* `abortOnError`: true

	Bail out on first syntactic or semantic error. In some cases setting this to false will result in exception in rollup itself (for example for unresolvable imports).

* `rollupCommonJSResolveHack`: false

	On windows typescript resolver favors POSIX path, while commonjs plugin (and maybe others?) uses native path as module id. This can result in `namedExports` being ignored if rollup happened to use typescript's resolution. Set to true to pass resolved module path through `resolve()` to match up with `rollup-plugin-commonjs`.
	
	`rollup-plugin-commonjs` fixed this in `10.1.0`, so projects using this option who update to new version will be broken again.
	
	This also works around the similar bug affecting code splitting (see [rollup/issues/3094](https://github.com/rollup/rollup/issues/3094)).

* `objectHashIgnoreUnknownHack`: false

	The plugin uses rollup config as part of cache key. `object-hash` is used to generate a hash, but it can't hash certain elements at the moment. Setting this option to true will make `object-hash` ignore unknowns, at the cost of not invalidating the cache if ignored elements are changed. Only enable this if you need it (`Error: Unknown object type "asyncfunction"` for example) and make sure to run with `clean: true` once in a while and definitely before a release. (See [#105](https://github.com/ezolenko/rollup-plugin-typescript2/issues/105))

* `useTsconfigDeclarationDir`: false

	If true, declaration files will be emitted in the directory given in the tsconfig. If false, the declaration files will be placed inside the destination directory given in the Rollup configuration.
	
	Set to false if any other rollup plugins need access to declaration files.

* `typescript`: typescript module installed with the plugin

	When typescript version installed by the plugin (latest 2.x) is unacceptable, you can import your own typescript module and pass it in as `typescript: require("typescript")`. Must be 2.0+, things might break if transpiler interfaces changed enough from what the plugin was built against.

* `transformers`: `undefined`

	**experimental**, typescript 2.4.1+

	Transformers will likely be available in tsconfig eventually, so this is not a stable interface, see [Microsoft/TypeScript/issues/14419](https://github.com/Microsoft/TypeScript/issues/14419).

	For example, integrating [kimamula/ts-transformer-keys](https://github.com/kimamula/ts-transformer-keys):

	```js
	const keysTransformer = require('ts-transformer-keys/transformer').default;
	const transformer = (service) =>
	{
  		before: [ keysTransformer(service.getProgram()) ],
  		after: []
	};

	// ...
	plugins: [
		typescript({ transformers: [transformer] })
	]
	```

### Declarations

This plugin respects `declaration: true` in your `tsconfig.json` file. When set, it will emit `*.d.ts` files for your bundle. The resulting file(s) can then be used with the `types` property in your `package.json` file as described [here](https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html).
By default, the declaration files will be located in the same directory as the generated Rollup bundle. If you want to override this behavior and instead use the declarationDir set `useTsconfigDeclarationDir` to `true` in the plugin options.

### Watch mode

The way typescript handles type-only imports and ambient types effectively hides them from rollup watch, because import statements are not generated and changing them doesn't trigger a rebuild.

Otherwise the plugin should work in watch mode. Make sure to run a normal build after watch session to catch any type errors.

### Requirements

TypeScript `2.4+`
Rollup `1.26.3+`
Node `6.4.0+` (basic es6 support)

### Reporting bugs

Report any bugs on github: <https://github.com/ezolenko/rollup-plugin-typescript2/issues>.

Attach your `tsconfig.json`, `package.json` (for versions of dependencies), rollup script and anything else that could influence module resolution, ambient types and typescript compilation.

Check if problem is reproducible after running `npm prune` to clear any rogue types from npm_modules (by default typescript grabs all ambient types).

Check if you get the same problem with `clean` option set to true (might indicate a bug in the cache).

If makes sense, check if running `tsc` directly produces similar results.

Attach plugin output with `verbosity` option set to 3 (this will list all files being transpiled and their imports).

### Contributing

Use the normal github process of forking, making a branch and creating a PR when ready. Fix all linting problems (run `npm lint`), fix any failed checks that are run on the PR (basically lint right now). Use an editor that supports editorconfig, or match the settings from `.editorconfig` file manually.

Fastest way to test changes is to do a self build, the plugin is part of its own build system:
- make changes
- run `npm build` (uses build committed to master branch)
- check that you get expected changes in `dist`
- run `npm build-self` (uses fresh local build)
- check `dist` for the expected changes
- run `npm build-self` _again_ to make sure plugin built by new version can still build itself

If `build-self` breaks at some point, fix the problem and restart from `build` step (a known good copy).

This repo badly needs unittests and integration tests with various scenarios and expected outcomes though.
