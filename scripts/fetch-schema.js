/* eslint-env node */

require('dotenv').config({ path: '.env.production' })
const child_process = require('child_process')
const fs = require('fs/promises')
const { promisify } = require('util')
const dataConfig = require('../graphql.data.config')
const thegraphConfig = require('../graphql.thegraph.config')

const exec = promisify(child_process.exec)

function fetchSchema(url, outputFile) {
  exec(`yarn get-graphql-schema --h Origin=https://app.uniswap.org ${url}`)
    .then(({ stderr, stdout }) => {
      if (stderr) {
        throw new Error(stderr)
      } else {
        // yarn adds the command that was run to the top of stdout, so this line removes the first line so only the fetched schema is parsed
        const outputSchema = stdout.substring(stdout.indexOf('\n') + 1)
        fs.writeFile(outputFile, outputSchema)
      }
    })
    .catch((err) => {
      console.error(err)
      console.error(`Failed to fetch schema from ${url}`)
    })
}

fetchSchema(process.env.THE_GRAPH_SCHEMA_ENDPOINT, thegraphConfig.schema)
fetchSchema(process.env.REACT_APP_AWS_API_ENDPOINT, dataConfig.schema)
