/* eslint-disable @typescript-eslint/no-var-requires */
const chalk = require('chalk')
const fs = require('fs')
const gzipSize = require('gzip-size').sync
const path = require('path')

const buildDir = path.join(__dirname, '../build')
const { entrypoints } = require(path.join(buildDir, 'asset-manifest.json'))

const SIZE_TOLERANCE = 100
// The last recorded size for these assets, as reported by `yarn build`.
const SIZE_MAP = {
  main: 211741,
  'runtime-main': 2544,
  2: 876893,
}

let fail = false
console.log('File sizes after gzip:\n')
entrypoints
  .filter((entrypoint) => entrypoint.endsWith('js'))
  .forEach((entrypoint) => {
    const name = entrypoint.match(/\/([\w\d-]*)\./)[1]
    const size = gzipSize(fs.readFileSync(path.join(buildDir, entrypoint)))
    const maxSize = SIZE_MAP[name] + SIZE_TOLERANCE
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
