/* eslint-env node */

const fs = require('fs')
const path = require('path')
const Ajv = require('ajv')
const standaloneCode = require('ajv/dist/standalone').default
const addFormats = require('ajv-formats')
const schema = require('@uniswap/token-lists/dist/tokenlist.schema.json')

const tokenListAjv = new Ajv({ code: { source: true, esm: true } })
addFormats(tokenListAjv)
const validateTokenList = tokenListAjv.compile(schema)
let tokenListModuleCode = standaloneCode(tokenListAjv, validateTokenList)
fs.writeFileSync(path.join(__dirname, '../src/utils/__generated__/validateTokenList.js'), tokenListModuleCode)

const tokensAjv = new Ajv({ code: { source: true, esm: true } })
addFormats(tokensAjv)
const validateTokens = tokensAjv.compile({ ...schema, required: ['tokens'] })
let tokensModuleCode = standaloneCode(tokensAjv, validateTokens)
fs.writeFileSync(path.join(__dirname, '../src/utils/__generated__/validateTokens.js'), tokensModuleCode)
