/**
 * Bundles the widgets library, which is released independently of the interface application.
 * This library lives in src/lib, but shares code with the interface application.
 */

import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import eslint from '@rollup/plugin-eslint'
import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import url from '@rollup/plugin-url'
import svgr from '@svgr/rollup'
import { RollupWarning } from 'rollup'
import dts from 'rollup-plugin-dts'
import externals from 'rollup-plugin-node-externals'
import sass from 'rollup-plugin-scss'
import resolveTsconfigPaths from 'rollup-plugin-typescript-paths'
import typescript from 'rollup-plugin-typescript2'

const replacements = {
  'process.env.REACT_APP_IS_WIDGET': true,
}

const extensions = ['.js', '.jsx', '.ts', '.tsx']
const TS_CONFIG = './tsconfig.lib.json'

// Babel warnings that will be squelched. These are checked (correctly) by tsc, not by babel.
const BENIGN_BABEL_WARNINGS = [
  '"ThemeProviderComponent", "ThemedCssFunction" and "ThemedBaseStyledInterface" are imported from external module "styled-components" but never used in "src/lib/theme/styled.ts".',
]

const plugins = [
  // Dependency resolution
  externals({ deps: true }), // marks builtins and dependencies as external
  resolve({ extensions }), // resolves third-party modules within node_modules/

  // Source code transformation
  json(), // imports json
  replace({ ...replacements, preventAssignment: true }),
  url(), // imports files (including svgs) as data URIs
  svgr({ exportType: 'named', svgo: false }), // imports svgs as React components
  sass(), // imports sass styles
]

const check = {
  input: 'src/lib/index.tsx',
  output: {
    file: 'dist/dts/widgets.esm.js',
    format: 'esm',
  },
  plugins: [
    eslint({ include: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'] }),
    ...plugins,
    typescript({ tsconfig: TS_CONFIG, useTsconfigDeclarationDir: true }),
  ],
}

const types = {
  input: 'dist/dts/lib/index.d.ts',
  output: {
    file: 'dist/widgets.d.ts',
    format: 'esm',
  },
  external: (source: string) => source.endsWith('.scss'),
  plugins: [dts({ compilerOptions: { baseUrl: 'dist/dts' } })],
}

const library = ({ file, format }: { file: string; format: 'cjs' | 'esm' }) => ({
  input: 'src/lib/index.tsx',
  output: [
    {
      file: 'dist/' + file,
      format,
      inlineDynamicImports: true,
      sourcemap: true,
    },
  ],
  plugins: [
    ...plugins,
    resolveTsconfigPaths({
      tsConfigPath: TS_CONFIG, // NB: This does not load any base tsconfigs, so resolveJsonModule must be true.
      preserveExtensions: true,
    }), // resolves paths aliased through the tsconfig
    commonjs(), // transforms cjs dependencies into tree-shakeable ES modules
    babel({
      babelHelpers: 'runtime',
      presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
      extensions,
      plugins: ['macros', ['@babel/plugin-transform-runtime', { useESModules: format === 'esm' }]],
    }),
  ],
  onwarn: (warning: RollupWarning, warn: (warning: RollupWarning) => void) => {
    if (BENIGN_BABEL_WARNINGS.includes(warning.message)) return // squelches benign warnings
    warn(warning)
  },
})

const esm = library({ file: 'widgets.esm.js', format: 'esm' })
const cjs = library({ file: 'widgets.js', format: 'cjs' })
const config = [check, types, esm, cjs]
export default config
