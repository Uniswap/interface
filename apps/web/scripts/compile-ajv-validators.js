/* eslint-env node */

const fs = require('fs')
const path = require('path')
const Ajv = require('ajv')
const standaloneCode = require('ajv/dist/standalone').default
const addFormats = require('ajv-formats')
const { _ } = require('ajv')
const schema = require('@uniswap/token-lists/dist/tokenlist.schema.json')

// Generate token list validator
const tokenListAjv = new Ajv({
  code: {
    source: true,
    esm: true,
    // Tell AJV how to resolve format validators in standalone code using template literal
    formats: _`require("ajv-formats/dist/formats").fullFormats`,
  },
})
addFormats(tokenListAjv)
const validateTokenList = tokenListAjv.compile(schema)

const tokenListModuleCode = standaloneCode(tokenListAjv, validateTokenList)

const tokenListOutputPath = path.join(__dirname, '../src/utils/__generated__/validateTokenList.js')
fs.mkdirSync(path.dirname(tokenListOutputPath), { recursive: true })
fs.writeFileSync(tokenListOutputPath, tokenListModuleCode)

// Generate tokens validator
const tokensAjv = new Ajv({
  code: {
    source: true,
    esm: true,
    // Tell AJV how to resolve format validators in standalone code using template literal
    formats: _`require("ajv-formats/dist/formats").fullFormats`,
  },
})
addFormats(tokensAjv)
const validateTokens = tokensAjv.compile({ ...schema, required: ['tokens'] })

const tokensModuleCode = standaloneCode(tokensAjv, validateTokens)

const tokensOutputPath = path.join(__dirname, '../src/utils/__generated__/validateTokens.js')
fs.mkdirSync(path.dirname(tokensOutputPath), { recursive: true })
fs.writeFileSync(tokensOutputPath, tokensModuleCode)
