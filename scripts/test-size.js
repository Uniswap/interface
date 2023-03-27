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
const LAST_SIZE_MAIN_KB = 420

// This is the async-loaded js, called <number>.<hash>.js, with a matching css file.
const LAST_SIZE_ENTRY_KB = 1442

const SIZE_TOLERANCE_KB = 10

const jsEntrypoints = entrypoints.filter((entrypoint) => entrypoint.endsWith('js'))
assert(jsEntrypoints.length === 3)

let fail = false
console.log('File sizes after gzip:\n')
jsEntrypoints.forEach((entrypoint) => {
  const name = entrypoint.match(/\/([\w\d-]*)\./)[1]
  const size = gzipSize(fs.readFileSync(path.join(buildDir, entrypoint))) / 1024

  let maxSize = LAST_SIZE_ENTRY_KB + SIZE_TOLERANCE_KB
  if (name === 'runtime-main') {
    return
  } else if (name === 'main') {
    maxSize = LAST_SIZE_MAIN_KB + SIZE_TOLERANCE_KB
  }

  const report = `\t${size.toFixed(2).padEnd(8)}kB\t${chalk.dim(
    `max: ${maxSize.toFixed().padEnd(4)} kB`
  )}\t${entrypoint}`
  if (maxSize > size) {
    console.log(chalk.green(report))
  } else {
    console.log(chalk.red(report), '\tdid you import an unnecessary dependency?')
    fail = true
  }
})
if (fail) {
  console.log(chalk.yellow('\nOne or more of your files has grown too large.'))
  console.log(chalk.yellow('Reduce the file size or update the size limit (in scripts/test-size.js)'))
  process.exit(1)
}
