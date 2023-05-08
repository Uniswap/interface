/* eslint-disable */

const fs = require('fs')
const path = require('path')
const Ajv = require('ajv')
const standaloneCode = require('ajv/dist/standalone').default
const addFormats = require('ajv-formats')
const schema = require('@uniswap/token-lists/dist/tokenlist.schema.json')

const ajv = new Ajv({ code: { source: true, esm: true } })
addFormats(ajv)
const validate = ajv.compile(schema)
let moduleCode = standaloneCode(ajv, validate)
fs.writeFileSync(path.join(__dirname, '../src/utils/__generated__/validateTokenList.js'), moduleCode)

const ajv2 = new Ajv({ code: { source: true, esm: true } })
addFormats(ajv2)
const validate2 = ajv2.compile(Object.assign({}, schema, { required: ['tokens']}))
let moduleCode2 = standaloneCode(ajv2, validate2)
fs.writeFileSync(path.join(__dirname, '../src/utils/__generated__/validateTokens.js'), moduleCode2)