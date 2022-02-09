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
import externals from 'rollup-plugin-node-externals'
import sass from 'rollup-plugin-scss'
import { CompilerOptions } from 'typescript'

const REPLACEMENTS = {
  'process.env.REACT_APP_IS_WIDGET': true,
  'process.env.REACT_APP_LOCALES': "'./locales'",
}

const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx']
const ASSET_EXTENSIONS = ['.png', '.svg']
function isAsset(source: string) {
  const extname = path.extname(source)
  return extname && [...ASSET_EXTENSIONS, '.css', '.scss'].includes(extname)
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
  externals({ exclude: ['constants'], deps: true, peerDeps: true }), // marks builtins, dependencies, and peerDependencies external
  resolve({ extensions: EXTENSIONS }), // resolves third-party modules within node_modules/
  alias({ entries: aliases }), // resolves paths aliased through the tsconfig (babel does not use tsconfig path resolution)

  // Source code transformation
  replace({ ...REPLACEMENTS, preventAssignment: true }),
  json(), // imports json; doing so type-checking allows the json to be type-checked
]

const check = {
  input: 'src/lib/index.tsx',
  output: { file: 'dist/widgets.tsc' },
  external: isAsset,
  plugins: [...plugins, typescript({ tsconfig: TS_CONFIG })],
  onwarn: squelchTranspilationWarnings, // this pipeline is only for typechecking and generating definitions
}

const type = {
  input: 'dist/dts/lib/index.d.ts',
  output: { file: 'dist/widgets.d.ts' },
  external: isAsset,
  plugins: [
    dts({ compilerOptions: { baseUrl: 'dist/dts' } }),
    process.env.ROLLUP_WATCH ? undefined : del({ hook: 'buildEnd', targets: ['dist/widgets.tsc', 'dist/dts'] }),
  ],
}

const transpile = {
  input: 'src/lib/index.tsx',
  output: [
    {
      file: 'dist/widgets.js',
      format: 'cjs',
      sourcemap: false,
    },
    {
      file: 'dist/widgets.esm.js',
      format: 'esm',
      sourcemap: false,
    },
  ],
  plugins: [
    ...plugins,

    // Source code transformation
    url({ include: ASSET_EXTENSIONS.map((extname) => '**/*' + extname) }), // imports assets as data URIs
    svgr({ exportType: 'named', svgo: false }), // imports svgs as React components
    sass({ insert: true }), // imports inlined sass styles
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

    copy({
      copyOnce: true,
      targets: [{ src: 'src/locales/*.js', dest: 'dist/locales' }],
    }),
  ],
  onwarn: squelchTypeWarnings, // this pipeline is only for transpilation
}

const config = [check, type, transpile]
export default config

function squelchTranspilationWarnings(warning: RollupWarning, warn: (warning: RollupWarning) => void) {
  if (warning.pluginCode === 'TS5055') return
  warn(warning)
}

function squelchTypeWarnings(warning: RollupWarning, warn: (warning: RollupWarning) => void) {
  if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return
  warn(warning)
}
