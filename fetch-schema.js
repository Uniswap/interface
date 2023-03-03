/* eslint-env node */

require('dotenv').config({ path: '.env.production' })

const { exec } = require('child_process')
const dataConfig = require('./graphql.config')
const thegraphConfig = require('./graphql_thegraph.config')

function fetchSchema(url, outputFile) {
  exec(
    `get-graphql-schema --h Origin=https://app.uniswap.org --h X-API-KEY=da2-pl5x75xr7rhwfezyhmmzemkz7u ${url} | tee ${outputFile}.temp`,
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
fetchSchema('https://2hm3d6i3bfb43hcx33dk56mfey.appsync-api.us-east-1.amazonaws.com/graphql', dataConfig.schema)
