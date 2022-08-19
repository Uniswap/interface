/* eslint-disable */
require('dotenv').config({ path: '.env.local' })
const { exec } = require('child_process')
const dataConfig = require('./relay.config')
const thegraphConfig = require('./relay_thegraph.config')
/* eslint-enable */

const THEGRAPH_API_URL = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3'
exec(`get-graphql-schema ${THEGRAPH_API_URL} > ${thegraphConfig.schema}`)

const API_URL = process.env.REACT_APP_GQL_API_URL
const API_KEY = process.env.REACT_APP_GQL_API_KEY

if (API_URL && API_KEY) {
  exec(`get-graphql-schema ${API_URL} --h X-API-KEY=${API_KEY} > ${dataConfig.schema}`)
} else {
  console.log('REACT_APP_GQL_API_URL or REACT_APP_GQL_API_KEY is missing from env.local')
}
