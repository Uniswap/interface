const fs = require('fs/promises')

async function check(file) {
  const json = JSON.parse(
    await fs.readFile(file)
  )
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

  // check no duplicate values
  const values = Object.values(json)
  const dedupedValues = [...new Set(values)]
  const duplicates = arrayDifference(values, dedupedValues)
  if (duplicates.length) {
    console.error(`Found duplicate values, please de-dupe!\n`, JSON.stringify(duplicates, null, 2))
    process.exit(1)
  }

  console.log(` ✅ Translations keys are sorted alphabetically and properly de-duped`)
}

check('apps/web/src/i18n/locales/source/en-US.json')

const arrayDifference = (arr1, arr2) => {
  const counts = {}

  // Count occurrences of each element in arr2
  for (const val of arr2) {
      if (counts[val]) {
          counts[val]++
      } else {
          counts[val] = 1
      }
  }

  // Filter arr1 based on the counts
  return arr1.filter(val => {
      if (counts[val]) {
          counts[val]--
          return false
      }
      return true
  })
};
