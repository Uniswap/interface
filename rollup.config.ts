/**
 * Bundles the widgets library, which is released independently of the interface application.
 * This library lives in src/lib, but shares code with the interface application.
 */

import alias from '@rollup/plugin-alias'
import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import typescript from '@rollup/plugin-typescript'
import url from '@rollup/plugin-url'
import svgr from '@svgr/rollup'
import path from 'path'
import { RollupWarning } from 'rollup'
import copy from 'rollup-plugin-copy'
import del from 'rollup-plugin-delete'
import dts from 'rollup-plugin-dts'
// @ts-ignore // missing types
import multi from 'rollup-plugin-multi-input'
import externals from 'rollup-plugin-node-externals'
import sass from 'rollup-plugin-scss'
import { CompilerOptions } from 'typescript'

const REPLACEMENTS = {
  'process.env.REACT_APP_IS_WIDGET': true,
  'process.env.REACT_APP_LOCALES': '"./locales"',
  // esm requires fully-specified paths:
  'react/jsx-runtime': 'react/jsx-runtime.js',
}

const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx']
const ASSET_EXTENSIONS = ['.png', '.svg']
function isAsset(source: string) {
  const extname = path.extname(source)
  return extname && [...ASSET_EXTENSIONS, '.css', '.scss'].includes(extname)
}

function isEthers(source: string) {
  // @ethersproject/* modules are provided by ethers, with the exception of experimental.
  return source.startsWith('@ethersproject/') && !source.endsWith('experimental')
}

const TS_CONFIG = './tsconfig.lib.json'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { baseUrl, paths }: CompilerOptions = require(TS_CONFIG).compilerOptions
const aliases = Object.entries({ ...paths }).flatMap(([find, replacements]) => {
  return replacements.map((replacement) => ({
    find: path.dirname(find),
    replacement: path.join(__dirname, baseUrl || '.', path.dirname(replacement)),
  }))
})

const plugins = [
  // Dependency resolution
  resolve({ extensions: EXTENSIONS }), // resolves third-party modules within node_modules/
  alias({ entries: aliases }), // resolves paths aliased through the tsconfig (babel does not use tsconfig path resolution)

  // Source code transformation
  replace({ ...REPLACEMENTS, preventAssignment: true }),
  json(), // imports json as ES6; doing so enables type-checking and module resolution
]

const check = {
  input: 'src/lib/index.tsx',
  output: { file: 'dist/widgets.tsc', inlineDynamicImports: true },
  external: (source: string) => isAsset(source) || isEthers(source),
  plugins: [
    externals({ exclude: ['constants'], deps: true, peerDeps: true }), // marks builtins, dependencies, and peerDependencies external
    ...plugins,
    typescript({ tsconfig: TS_CONFIG }),
  ],
  onwarn: squelchTranspilationWarnings, // this pipeline is only for typechecking and generating definitions
}

const type = {
  input: 'dist/dts/lib/index.d.ts',
  output: { file: 'dist/index.d.ts' },
  external: (source: string) => isAsset(source) || isEthers(source),
  plugins: [
    externals({ exclude: ['constants'], deps: true, peerDeps: true }),
    dts({ compilerOptions: { baseUrl: 'dist/dts' } }),
    process.env.ROLLUP_WATCH ? undefined : del({ hook: 'buildEnd', targets: ['dist/widgets.tsc', 'dist/dts'] }),
  ],
}

/**
 * This exports scheme works for nextjs and for CRA5.
 *
 * It will also work for CRA4 if you use direct imports:
 *   instead of `import { SwapWidget } from '@uniswap/widgets'`,
 *              `import { SwapWidget } from '@uniswap/widgets/dist/index.js'`.
 * I do not know why CRA4 does not seem to use exports for resolution.
 *
 * Note that chunks are enabled. This is so the tokenlist spec can be loaded async,
 * to improve first load time (due to ajv). Locales are also in separate chunks.
 *
 * Lastly, note that JSON and lingui are bundled into the library, as neither are fully
 * supported/compatible with ES Modules. Both _could_ be bundled only with esm, but this
 * yields a less complex pipeline.
 */

const transpile = {
  input: 'src/lib/index.tsx',
  output: [
    {
      dir: 'dist',
      format: 'esm',
      sourcemap: false,
    },
    {
      dir: 'dist/cjs',
      entryFileNames: '[name].cjs',
      chunkFileNames: '[name]-[hash].cjs',
      format: 'cjs',
      sourcemap: false,
    },
  ],
  external: isEthers,
  plugins: [
    externals({
      exclude: [
        'constants',
        /@lingui\/(core|react)/, // @lingui incorrectly exports esm, so it must be bundled in
        /\.json$/, // esm does not support JSON loading, so it must be bundled in
      ],
      deps: true,
      peerDeps: true,
    }),
    ...plugins,

    // Source code transformation
    url({ include: ASSET_EXTENSIONS.map((extname) => '**/*' + extname), limit: Infinity }), // imports assets as data URIs
    svgr({ exportType: 'named', svgo: false }), // imports svgs as React components
    sass({ output: 'dist/fonts.css' }), // generates fonts.css
    commonjs(), // transforms cjs dependencies into tree-shakeable ES modules

    babel({
      babelHelpers: 'runtime',
      presets: ['@babel/preset-env', ['@babel/preset-react', { runtime: 'automatic' }], '@babel/preset-typescript'],
      extensions: EXTENSIONS,
      plugins: [
        'macros', // enables @lingui and styled-components macros
        '@babel/plugin-transform-runtime', // embeds the babel runtime for library distribution
      ],
    }),
  ],
  onwarn: squelchTypeWarnings, // this pipeline is only for transpilation
}

const locales = {
  input: 'src/locales/*.js',
  output: [
    {
      dir: 'dist',
      format: 'esm',
      sourcemap: false,
    },
  ],
  plugins: [
    copy({
      copyOnce: true,
      targets: [{ src: 'src/locales/*.js', dest: 'dist/cjs/locales', rename: (name) => `${name}.cjs` }],
    }),
    commonjs(),
    multi(),
  ],
}

const config = [check, type, transpile, locales]
export default config

function squelchTranspilationWarnings(warning: RollupWarning, warn: (warning: RollupWarning) => void) {
  if (warning.pluginCode === 'TS5055') return
  warn(warning)
}

function squelchTypeWarnings(warning: RollupWarning, warn: (warning: RollupWarning) => void) {
  if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return
  warn(warning)
}
