/**
 * Bundles the widgets library, which is released independently of the interface application.
 * This library lives in src/lib, but shares code with the interface application.
 */

// import eslint from '@rollup/plugin-eslint'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
// import resolve from '@rollup/plugin-node-resolve'
import babel from '@rollup/plugin-babel'

import { DEFAULT_EXTENSIONS } from '@babel/core'
// import replace from '@rollup/plugin-replace'
import url from '@rollup/plugin-url'
import svgr from '@svgr/rollup'
import dts from 'rollup-plugin-dts'
// import external from 'rollup-plugin-peer-deps-external'
import sass from 'rollup-plugin-scss'
import typescript from 'rollup-plugin-typescript2'

// import { dependencies } from './package.json'

// const deps = Object.keys(dependencies)

// const replacements = {
//   'process.env.REACT_APP_IS_WIDGET': true,
// }
// process.env.BABEL_ENV === 'production'

// const ignore = ['styled-components']
const babelConfig = {
  extensions: [...DEFAULT_EXTENSIONS, '.ts', 'tsx'],

  exclude: '/node_modules/**',
  babelrc: false,
  configFile: false,
  presets: [
    [
      require.resolve('babel-preset-react-app'),
      {
        runtime: 'automatic',
      },
    ],
  ],
  // plugins: [
  //   [
  //     require.resolve('babel-plugin-named-asset-import'),
  //     {
  //       loaderMap: {
  //         svg: {
  //           ReactComponent: '@svgr/webpack?-svgo,+titleProp,+ref![path]',
  //         },
  //       },
  //     },
  //   ],
  // ],
}
// const babelPlugins = [
//   // These plugins filter out non-ES2015.
//   '@babel/plugin-transform-flow-strip-types',
//   ['@babel/plugin-proposal-class-properties', { loose: true }],
//   'syntax-trailing-function-commas',
//   // These use loose mode which avoids embedding a runtime.
//   // TODO: Remove object spread from the source. Prefer Object.assign instead.
//   ['@babel/plugin-proposal-object-rest-spread', { loose: true, useBuiltIns: true }],
//   ['@babel/plugin-transform-template-literals', { loose: true }],
//   // TODO: Remove for...of from the source. It requires a runtime to be embedded.
//   '@babel/plugin-transform-for-of',
//   // TODO: Remove array spread from the source. Prefer .apply instead.
//   ['@babel/plugin-transform-spread', { loose: true, useBuiltIns: true }],
//   '@babel/plugin-transform-parameters',
//   // TODO: Remove array destructuring from the source. Requires runtime.
//   ['@babel/plugin-transform-destructuring', { loose: true, useBuiltIns: true }],
// ]

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
    // resolve(),
    typescript({ tsconfig: './tsconfig.json', useTsconfigDeclarationDir: false }),
    commonjs(),
    // commonjs({ ignore: ['node_modules/styled-components/**/*.js'] }),
    // eslint({ include: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'] }),
    // babel(babelConfig),
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
