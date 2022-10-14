/* eslint-disable */
require('dotenv').config({ path: '.env.local' })
const { exec } = require('child_process')
const dataConfig = require('./relay.config')
const thegraphConfig = require('./relay_thegraph.config')
/* eslint-enable */

const THEGRAPH_API_URL = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3'
exec(`get-graphql-schema ${THEGRAPH_API_URL} > ${thegraphConfig.schema}`)

console.log(process.env.REACT_APP_NFT_AWS_API_ENDPOINT)
exec(
  `get-graphql-schema --h Origin=https://app.uniswap.org --h x-api-key=${process.env.REACT_APP_NFT_AWS_X_API_KEY} ${process.env.REACT_APP_NFT_AWS_API_ENDPOINT} > ${dataConfig.schema}`
)
