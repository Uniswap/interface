/* eslint-env node */
const fs = require('fs')
const path = require('path')
const Ajv = require('ajv')
const standaloneCode = require('ajv/dist/standalone').default
const addFormats = require('ajv-formats')
const schema = require('@uniswap/token-lists/dist/tokenlist.schema.json')
const generated_path = path.join(__dirname, '../src/utils/__generated__')

if (!fs.existsSync(generated_path)) {
  fs.mkdirSync(generated_path, { recursive: true })
}

const tokenListAjv = new Ajv({ code: { source: true, esm: true } })
addFormats(tokenListAjv)
const validateTokenList = tokenListAjv.compile(schema)
let tokenListModuleCode = standaloneCode(tokenListAjv, validateTokenList)
fs.writeFileSync(generated_path + '/validateTokenList.js', tokenListModuleCode)

const tokensAjv = new Ajv({ code: { source: true, esm: true } })
addFormats(tokensAjv)
const validateTokens = tokensAjv.compile({ ...schema, required: ['tokens'] })
let tokensModuleCode = standaloneCode(tokensAjv, validateTokens)
fs.writeFileSync(generated_path + '/validateTokens.js', tokensModuleCode)
