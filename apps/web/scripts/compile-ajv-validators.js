/* eslint-env node */

const fs = require('fs')
const path = require('path')
const Ajv = require('ajv')
const standaloneCode = require('ajv/dist/standalone').default
const addFormats = require('ajv-formats')
const schema = require('@uniswap/token-lists/dist/tokenlist.schema.json')
const outputDir = path.join(__dirname, '../src/utils/__generated__')

// ensure the directory exists
fs.mkdirSync(outputDir, { recursive: true })

const tokenListAjv = new Ajv({ code: { source: true, esm: true } })
addFormats(tokenListAjv)
const validateTokenList = tokenListAjv.compile(schema)
let tokenListModuleCode = standaloneCode(tokenListAjv, validateTokenList)
fs.writeFileSync(path.join(outputDir, 'validateTokenList.js'), tokenListModuleCode)

const tokensAjv = new Ajv({ code: { source: true, esm: true } })
addFormats(tokensAjv)
const validateTokens = tokensAjv.compile({ ...schema, required: ['tokens'] })
let tokensModuleCode = standaloneCode(tokensAjv, validateTokens)
fs.writeFileSync(path.join(outputDir, 'validateTokens.js'), tokensModuleCode)
