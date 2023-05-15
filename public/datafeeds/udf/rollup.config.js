/* globals process */

import { terser } from 'rollup-plugin-terser';
import { nodeResolve } from '@rollup/plugin-node-resolve';

const environment = process.env.ENV || 'development';
const isDevelopmentEnv = (environment === 'development');

export default [
	{
		input: 'lib/udf-compatible-datafeed.js',
		output: {
			name: 'Datafeeds',
			format: 'umd',
			file: 'dist/bundle.js',
		},
		plugins: [
			nodeResolve(),
			!isDevelopmentEnv && terser({
				ecma: 2018,
				output: { inline_script: true },
			}),
		],
	},
];
