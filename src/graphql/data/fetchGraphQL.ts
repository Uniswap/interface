import { AwsClient } from 'aws4fetch'
import { Variables } from 'react-relay'
import { GraphQLResponse, RequestParameters } from 'relay-runtime'

const AWS_API_REGION = process.env.REACT_APP_AWS_API_REGION
const AWS_API_ACCESS_KEY = process.env.REACT_APP_AWS_API_ACCESS_KEY
const AWS_API_ACCESS_SECRET = process.env.REACT_APP_AWS_API_ACCESS_SECRET
const AWS_X_API_KEY = process.env.REACT_APP_AWS_X_API_KEY
const URL = process.env.REACT_APP_AWS_API_ENDPOINT

if (!AWS_API_REGION || !AWS_API_ACCESS_KEY || !AWS_API_ACCESS_SECRET || !AWS_X_API_KEY || !URL) {
  throw new Error('AWS KEYS MISSING FROM ENVIRONMENT')
}

const aws = new AwsClient({
  accessKeyId: AWS_API_ACCESS_KEY, // required, akin to AWS_ACCESS_KEY_ID
  secretAccessKey: AWS_API_ACCESS_SECRET, // required, akin to AWS_SECRET_ACCESS_KEY
  service: 'execute-api',
  region: AWS_API_REGION, // AWS region, by default parsed at fetch time
})

const headers = {
  'Content-Type': 'application/json',
  'x-api-key': AWS_X_API_KEY,
}
const fetchQuery = (params: RequestParameters, variables: Variables): Promise<GraphQLResponse> => {
  const body = JSON.stringify({
    query: params.text, // GraphQL text from input
    variables,
  })

  return aws.fetch(URL, { body, headers }).then((res) => res.json())
}

export default fetchQuery
