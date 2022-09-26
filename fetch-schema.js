/* eslint-disable */
require('dotenv').config({ path: '.env.local' })
const { exec } = require('child_process')
const dataConfig = require('./relay.config')
const thegraphConfig = require('./relay_thegraph.config')
/* eslint-enable */

const THEGRAPH_API_URL = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3'
exec(`get-graphql-schema ${THEGRAPH_API_URL} > ${thegraphConfig.schema}`)

const DATA_API_URL = 'https://api.uniswap.org/v1/graphql'
exec(`get-graphql-schema --h Origin=https://app.uniswap.org ${DATA_API_URL} > ${dataConfig.schema}`)
