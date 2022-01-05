#!/bin/node
/**
 * Checks if any dependencies have been bundled with the interface library.
 * Exits with non-zero status if dependencies are included in the bundle.
 */
/* eslint-disable */

const { readFile } = require('fs')

function checkDeps(err, sourcemap) {
  if (err) {
      console.error(err)
      process.exit(1)
  }

  const includesDeps = sourcemap.includes('node_modules')
  if (includesDeps) {
      const deps = [...sourcemap.toString().matchAll(/node_modules[\\\/]([^\\\/]*)/g)].map(([, match]) => match)
      console.error(`
Sourcemap includes node_modules folder(s). External deps must be bundled under "dependencies".

To fix, run: \`yarn add ${deps.join(' ')}\`
`)
      process.exit(1)
  }
}

readFile('dist/interface.esm.js.map', checkDeps)
