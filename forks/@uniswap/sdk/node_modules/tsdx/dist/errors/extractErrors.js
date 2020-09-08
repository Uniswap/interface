"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const fs_extra_1 = tslib_1.__importDefault(require("fs-extra"));
const babylon = tslib_1.__importStar(require("babylon"));
const babel_traverse_1 = tslib_1.__importDefault(require("babel-traverse"));
const invertObject_1 = require("./invertObject");
const evalToString_1 = require("./evalToString");
const constants_1 = require("../constants");
const utils_1 = require("../utils");
const pascal_case_1 = tslib_1.__importDefault(require("pascal-case"));
const babylonOptions = {
    sourceType: 'module',
    // As a parser, babylon has its own options and we can't directly
    // import/require a babel preset. It should be kept **the same** as
    // the `babel-plugin-syntax-*` ones specified in
    // https://github.com/facebook/fbjs/blob/master/packages/babel-preset-fbjs/configure.js
    plugins: [
        'classProperties',
        'flow',
        'jsx',
        'trailingFunctionCommas',
        'objectRestSpread',
    ],
};
async function extractErrors(opts) {
    if (!opts || !('errorMapFilePath' in opts)) {
        throw new Error('Missing options. Ensure you pass an object with `errorMapFilePath`.');
    }
    if (!opts.name || !('name' in opts)) {
        throw new Error('Missing options. Ensure you pass --name flag to tsdx');
    }
    const errorMapFilePath = opts.errorMapFilePath;
    let existingErrorMap;
    try {
        // Using `fs.readFile` instead of `require` here, because `require()`
        // calls are cached, and the cache map is not properly invalidated after
        // file changes.
        existingErrorMap = JSON.parse(await fs_extra_1.default.readFile(errorMapFilePath, 'utf8'));
    }
    catch (e) {
        existingErrorMap = {};
    }
    const allErrorIDs = Object.keys(existingErrorMap);
    let currentID;
    if (allErrorIDs.length === 0) {
        // Map is empty
        currentID = 0;
    }
    else {
        currentID = Math.max.apply(null, allErrorIDs) + 1;
    }
    // Here we invert the map object in memory for faster error code lookup
    existingErrorMap = invertObject_1.invertObject(existingErrorMap);
    function transform(source) {
        const ast = babylon.parse(source, babylonOptions);
        babel_traverse_1.default(ast, {
            CallExpression: {
                exit(astPath) {
                    if (astPath.get('callee').isIdentifier({ name: 'invariant' })) {
                        const node = astPath.node;
                        // error messages can be concatenated (`+`) at runtime, so here's a
                        // trivial partial evaluator that interprets the literal value
                        const errorMsgLiteral = evalToString_1.evalToString(node.arguments[1]);
                        addToErrorMap(errorMsgLiteral);
                    }
                },
            },
        });
    }
    function addToErrorMap(errorMsgLiteral) {
        if (existingErrorMap.hasOwnProperty(errorMsgLiteral)) {
            return;
        }
        existingErrorMap[errorMsgLiteral] = '' + currentID++;
    }
    async function flush() {
        const prettyName = pascal_case_1.default(utils_1.safeVariableName(opts.name));
        // Ensure that the ./src/errors directory exists or create it
        await fs_extra_1.default.ensureDir(constants_1.paths.appErrors);
        // Output messages to ./errors/codes.json
        await fs_extra_1.default.writeFile(errorMapFilePath, JSON.stringify(invertObject_1.invertObject(existingErrorMap), null, 2) + '\n', 'utf-8');
        // Write the error files, unless they already exist
        await fs_extra_1.default.writeFile(constants_1.paths.appErrors + '/ErrorDev.js', `
function ErrorDev(message) {
  const error = new Error(message);
  error.name = 'Invariant Violation';
  return error;
}

export default ErrorDev;      
      `, 'utf-8');
        await fs_extra_1.default.writeFile(constants_1.paths.appErrors + '/ErrorProd.js', `
function ErrorProd(code) {
  // TODO: replace this URL with yours
  let url = 'https://reactjs.org/docs/error-decoder.html?invariant=' + code;
  for (let i = 1; i < arguments.length; i++) {
    url += '&args[]=' + encodeURIComponent(arguments[i]);
  }
  return new Error(
    \`Minified ${prettyName} error #$\{code}; visit $\{url} for the full message or \` +
      'use the non-minified dev environment for full errors and additional ' +
      'helpful warnings. '
  );
}

export default ErrorProd;
`, 'utf-8');
    }
    return async function extractErrors(source) {
        transform(source);
        await flush();
    };
}
exports.extractErrors = extractErrors;
