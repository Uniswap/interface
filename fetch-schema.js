/* eslint-disable */
require('dotenv').config({ path: '.env.production' })
const { exec } = require('child_process')
const dataConfig = require('./relay.config')
const thegraphConfig = require('./relay_thegraph.config')
/* eslint-enable */

function fetchSchema(url, outputFile) {
  exec(
    `get-graphql-schema --h Origin=https://app.uniswap.org ${url} | tee ${outputFile}.temp`,
    (error, stdout, stderr) => {
      if (error || stderr) {
        console.log(`Failed to fetch schema from ${url}`)
      } else if (stdout) {
        exec(`mv ${outputFile}.temp ${outputFile}`)
      }
    }
  )
}

fetchSchema(process.env.THE_GRAPH_SCHEMA_ENDPOINT, thegraphConfig.schema)
fetchSchema(process.env.REACT_APP_AWS_API_ENDPOINT, dataConfig.schema)
