/* eslint-disable no-undef */
const assert = require('assert')
const chalk = require('chalk')
const fs = require('fs')
const gzipSize = require('gzip-size').sync
const path = require('path')

const buildDir = path.join(__dirname, '../build')

let entrypoints
try {
  entrypoints = require(path.join(buildDir, 'asset-manifest.json')).entrypoints
} catch (e) {
  console.log(chalk.yellow('You must build first: `yarn build`'))
  process.exit(1)
}

// The last recorded size for these assets, as reported by `yarn build`.
const MAX_SIZE_MAIN_KB = 361.36

// This is the async-loaded js, called <number>.<hash>.js, with a matching css file.
const MAX_SIZE_ENTRY_MB = 1.38

const SIZE_TOLERANCE_KB = 5

const jsEntrypoints = entrypoints.filter((entrypoint) => entrypoint.endsWith('js'))
assert(jsEntrypoints.length === 3)

let fail = false
console.log('File sizes after gzip:\n')
jsEntrypoints.forEach((entrypoint) => {
  const name = entrypoint.match(/\/([\w\d-]*)\./)[1]
  const size = gzipSize(fs.readFileSync(path.join(buildDir, entrypoint)))

  let maxSize = MAX_SIZE_ENTRY_MB * 1024 * 1024
  if (name === 'runtime-main') {
    return
  } else if (name === 'main') {
    maxSize = MAX_SIZE_MAIN_KB * 1024
  }
  maxSize += SIZE_TOLERANCE_KB * 1024

  if (maxSize > size) {
    console.log(chalk.green(`\t${toKb(maxSize)}\t${entrypoint}`))
  } else {
    console.log(chalk.red(`\t${toKb(maxSize)}\t${entrypoint}`), '\tdid you import an unnecessary dependency?')
    fail = true
  }
})
if (fail) {
  console.log(chalk.yellow('\nOne or more of your files has grown too large.'))
  console.log(chalk.yellow('Reduce the file size or update the size limit (in scripts/test-size.js)'))
  process.exit(1)
}

function toKb(bytes) {
  return ((bytes / 1024).toFixed(2) + ' kB').padEnd(8)
}
