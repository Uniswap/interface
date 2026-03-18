const { readdir, writeFile, mkdir, stat } = require('fs/promises')
const fs = require('fs')
const path = require('path')
const { keccak256 } = require('@ethersproject/keccak256')

async function createFileIfNotExists(filePath, content = '') {
  try {
    const dir = path.dirname(filePath)
    await mkdir(dir, { recursive: true })
    await stat(filePath)
  } catch (error) {
    if (error.code === 'ENOENT') {
      await writeFile(filePath, content)
    } else {
      console.error(error)
    }
  }
}

function getFunctionSelectors(abi) {
  const selectors = {}
  abi.forEach((item) => {
    if (item.type === 'function') {
      const signature = `${item.name}(${item.inputs.map((input) => input.type).join(',')})`
      const funcSignatureBuffer = Buffer.from(signature)
      const hash = keccak256(new Uint8Array(funcSignatureBuffer))
      const selector = hash.substring(2, 10) // First 4 bytes (after '0x')
      selectors[signature] = selector
    }
  })
  return selectors
}

async function processABIFiles(directory) {
  if (!fs.existsSync(directory)) {
    console.warn(`Directory not found: ${directory}`)
    return
  }

  let results = {}
  const directories = await readdir(directory, { withFileTypes: true })
  const promises = directories.map(async (dirent) => {
    const fullPath = path.join(directory, dirent.name)
    if (dirent.isDirectory()) {
      const subResults = await processABIFiles(fullPath) // Recursively process subdirectories
      Object.assign(results, subResults)
    } else if (dirent.isFile() && dirent.name.endsWith('.json')) {
      const abi = require(fullPath).abi
      if (abi) {
        const relativePath = fullPath.split(`${path.sep}node_modules${path.sep}`)[1]
        results[relativePath] = getFunctionSelectors(abi)
      }
    }
  })

  await Promise.all(promises)
  return results
}

const packages = [
  '@uniswap/v3-periphery/artifacts',
  '@uniswap/v3-core/artifacts',
  '@uniswap/v2-core/build',
  '@uniswap/universal-router/artifacts',
  '@uniswap/swap-router-contracts/artifacts',
]

function mapHashesToSignatures(data) {
  const hashToSignatureMap = {}
  for (const file in data) {
    const functionMappings = data[file]
    for (const signature in functionMappings) {
      const hash = functionMappings[signature]
      hashToSignatureMap[hash] = signature
    }
  }
  return hashToSignatureMap
}

async function main() {
  createFileIfNotExists('scripts/dist/file-to-signature-to-hash.json')
  createFileIfNotExists('scripts/dist/hash-to-signature.json')

  const calls = packages.map((packageName) => {
    const packagePath = path.join(process.cwd(), 'node_modules', packageName)
    return processABIFiles(packagePath)
  })
  const data = await Promise.all(calls)
  const results = data.reduce((acc, cur) => ({ ...acc, ...cur }), {})

  await writeFile('scripts/dist/file-to-signature-to-hash.json', JSON.stringify(results, null, 2))
  await writeFile('scripts/dist/hash-to-signature.json', JSON.stringify(mapHashesToSignatures(results), null, 2))
}
main()
  .then(() => console.log('done'))
  .catch(console.error)
