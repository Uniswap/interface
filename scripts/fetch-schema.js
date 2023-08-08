/* eslint-env node */

require('dotenv').config({ path: '.env.production' })
const child_process = require('child_process')
const fs = require('fs/promises')
const { promisify } = require('util')
const dataConfig = require('../graphql.data.config')
const thegraphConfig = require('../graphql.thegraph.config')

const exec = promisify(child_process.exec)

function fetchSchema(url, outputFile) {
  exec(
    `yarn --silent get-graphql-schema -h x-api-key=da2-ph3nd2i4uzblzpnrmn5ytukvje -h from-x-api-key=RltH8d0amOTHlsPeFuS4uYOBrA9i7abRi6OcRu94Ki --h Origin=https://app.uniswap.org ${url}`
  )
    .then(({ stderr, stdout }) => {
      if (stderr) {
        throw new Error(stderr)
      } else {
        fs.writeFile(outputFile, stdout)
      }
    })
    .catch((err) => {
      console.error(err)
      console.error(`Failed to fetch schema from ${url}`)
    })
}

fetchSchema(process.env.THE_GRAPH_SCHEMA_ENDPOINT, thegraphConfig.schema)
fetchSchema(process.env.REACT_APP_AWS_API_ENDPOINT, dataConfig.schema)
