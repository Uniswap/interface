/* eslint-disable no-undef */
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

// The last recorded size for main.<hash>.js, as reported by `yarn build`.
const SIZE_MAIN_KB = 1790
const SIZE_TOLERANCE_KB = 10

const [mainJs] = entrypoints.filter((entrypoint) => entrypoint.endsWith('js'))

console.log('File size after gzip:\n')
const size = gzipSize(fs.readFileSync(path.join(buildDir, mainJs))) / 1024

let maxSize = SIZE_MAIN_KB + SIZE_TOLERANCE_KB

const report = `\t${size.toFixed(2).padEnd(8)}kB\t${chalk.dim(`max: ${maxSize.toFixed().padEnd(4)} kB`)}\t${mainJs}`
if (maxSize > size) {
  console.log(chalk.green(report))
} else {
  console.log(chalk.red(report), '\tdid you import an unnecessary dependency?')
  console.log(chalk.yellow('\nThe main.<hash>.js file has grown too large.'))
  console.log(chalk.yellow('Reduce the file size or update the size limit (in scripts/test-size.js)'))
  process.exit(1)
}
