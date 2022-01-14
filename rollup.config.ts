/**
 * Bundles the widgets library, which is released independently of the interface application.
 * This library lives in src/lib, but shares code with the interface application.
 */

import eslint from '@rollup/plugin-eslint'
import json from '@rollup/plugin-json'
import replace from '@rollup/plugin-replace'
import url from '@rollup/plugin-url'
import svgr from '@svgr/rollup'
import dts from 'rollup-plugin-dts'
import sass from 'rollup-plugin-scss'
import typescript from 'rollup-plugin-typescript2'

import { dependencies } from './package.json'

const deps = Object.keys(dependencies)

const replacements = {
  'process.env.REACT_APP_IS_WIDGET': true,
}

const library = {
  input: 'src/lib/index.tsx',
  output: [
    {
      file: 'dist/widgets.js',
      format: 'cjs',
      inlineDynamicImports: true,
      sourcemap: true,
    },
    {
      file: 'dist/widgets.esm.js',
      format: 'esm',
      inlineDynamicImports: true,
      sourcemap: true,
    },
  ],
  // necessary because some nested imports (eg jotai/*) would otherwise not resolve.
  external: (source: string) => Boolean(deps.find((dep) => source === dep || source.startsWith(dep + '/'))),
  plugins: [
    eslint({ include: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'] }),
    json(), // imports json
    replace({ ...replacements, preventAssignment: true }),
    url(), // imports files (including svgs) as data URIs
    svgr({ exportType: 'named', svgo: false }), // imports svgs as React components
    sass(), // imports sass styles
    typescript({ tsconfig: './tsconfig.lib.json', useTsconfigDeclarationDir: true }),
  ],
}

const typings = {
  input: 'dist/dts/lib/index.d.ts',
  output: {
    file: 'dist/widgets.d.ts',
    format: 'es',
  },
  external: (source: string) => source.endsWith('.scss'),
  plugins: [dts({ compilerOptions: { baseUrl: 'dist/dts' } })],
}

const config = [library, typings]
export default config
