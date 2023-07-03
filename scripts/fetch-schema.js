/* eslint-env node */

require('dotenv').config({ path: '.env.production' })

const { exec } = require('child_process')
const dataConfig = require('../graphql.config')
const thegraphConfig = require('../graphql_thegraph.config')

function fetchSchema(url, outputFile) {
  exec(`yarn --silent get-graphql-schema --h Origin=https://app.uniswap.org ${url}`).then(({ stderr, stdout }) => {
    if (stderr) {
      throw new Error(stderr)
    } else {
      fs.writeFile(outputFile, stdout)
    }
  })
}

fetchSchema(process.env.THE_GRAPH_SCHEMA_ENDPOINT, thegraphConfig.schema)
fetchSchema(process.env.REACT_APP_AWS_API_ENDPOINT, dataConfig.schema)
