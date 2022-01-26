/**
 * Bundles the widgets library, which is released independently of the interface application.
 * This library lives in src/lib, but shares code with the interface application.
 */

import eslint from '@rollup/plugin-eslint'
// import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
// import resolve from '@rollup/plugin-node-resolve'
import url from '@rollup/plugin-url'
import svgr from '@svgr/rollup'
import dts from 'rollup-plugin-dts'
import sass from 'rollup-plugin-scss'
// import { DEFAULT_EXTENSIONS } from '@babel/core'

import typescript from 'rollup-plugin-typescript2'

// import babel from '@rollup/plugin-babel'
// import { DEFAULT_EXTENSIONS } from '@babel/core'
import replace from '@rollup/plugin-replace'
// import external from 'rollup-plugin-peer-deps-external'

// import { dependencies } from './package.json'

// const deps = Object.keys(dependencies)

const replacements = {
  'process.env.REACT_APP_IS_WIDGET': false,
}

// const ignore = ['styled-components']

const library = {
  input: 'src/snowflake.ts',
  output: [
    {
      file: 'dist2/snowflake.js',
      format: 'cjs',
      inlineDynamicImports: true,
      sourcemap: true,
    },
    // {
    //   file: 'dist/widgets.esm.js',
    //   format: 'esm',
    //   inlineDynamicImports: true,
    //   sourcemap: true,
    // },
  ],
  // necessary because some nested imports (eg jotai/*) would otherwise not resolve.
  // external: (source: string) => Boolean(deps.find((dep) => source === dep || source.startsWith(dep + '/'))),
  // external: ['styled-components'],
  // external: (source: string) => ignore.includes(source),
  plugins: [
    // external(),
    eslint({ include: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'] }),
    replace({ ...replacements, preventAssignment: true }),

    typescript({ tsconfig: './tsconfig.json', useTsconfigDeclarationDir: true }),
    commonjs({ esmExternals: true, requireReturnsDefault: false }),
    // resolve(),

    // babel({
    //   extensions: [...DEFAULT_EXTENSIONS, '.ts', 'tsx'],
    //   babelHelpers: 'runtime',
    //   exclude: /node_modules/,
    // }),
    // commonjs({ ignore: ['node_modules/styled-components/**/*.js'] }),
    // eslint({ include: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'] }),
    json(), // imports json
    // replace({ ...replacements, preventAssignment: true }),
    url(), // imports files (including svgs) as data URIs
    svgr({ exportType: 'named', svgo: false }), // imports svgs as React components
    sass(), // imports sass styles
  ],
}

const typings = {
  input: 'dist2/types/snowflake.d.ts',
  output: {
    file: 'dist2/snowflake.d.ts',
    format: 'es',
  },
  external: (source: string) => source.endsWith('.scss'),
  // plugins: [dts()],
  plugins: [dts({ compilerOptions: { baseUrl: 'dist2/types' } })],
}

const config = [library, typings]
// const config = [library]

export default config
