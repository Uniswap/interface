/* eslint-env node */

// idk why but defaultValue int working in i18next-parser.config.js

const fs = require('fs')

const path = './src/i18n/locales/source/en-US.json'
const contents = JSON.parse(fs.readFileSync(path, 'utf-8'))

for (const key in contents) {
  if (contents[key] === '') {
    contents[key] = key
  }
}

fs.writeFileSync(path, JSON.stringify(contents, null, 2))
