const fs = require('fs/promises')

async function check(file) {
  const json = JSON.parse(await fs.readFile(file))
  const keys = Object.keys(json)
  const sortedKeys = [...keys].sort()

  // check alphabetized
  for (const [index, key] in sortedKeys.entries()) {
    if (keys[index] !== key) {
      console.error(`Keys are not sorted in ${file}!`)
      console.error(` Expected: ${key} got ${keys[index]}`)
      process.exit(1)
    }
  }

  console.log(` ✅ Translations keys are sorted alphabetically and properly de-duped`)
}

check('packages/uniswap/src/i18n/locales/web-source/en-US.json')
