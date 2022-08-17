/**
 * Helpful Resources
 * https://github.com/sibelius/create-react-app-relay-modern/blob/master/src/relay/fetchQuery.js
 * https://github.com/relay-tools/relay-compiler-language-typescript/blob/master/example/ts/app.tsx
 */
//import { aws4Interceptor } from 'aws4-axios'
import { Variables } from 'react-relay'
import { GraphQLResponse, ObservableFromValue, RequestParameters } from 'relay-runtime'

// Define a function that fetches the results of a request (query/mutation/etc)
// and returns its results as a Promise:
const fetchQuery = (params: RequestParameters, variables: Variables): ObservableFromValue<GraphQLResponse> => {
  const body = JSON.stringify({
    query: params.text, // GraphQL text from input
    variables,
  })
  const url = process.env.REACT_APP_GQL_API_URL ?? ''
  const apiKey = process.env.REACT_APP_GQL_API_KEY ?? ''

  const response = fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
    body,
  }).then((res) => res.json())
  return response
}

export default fetchQuery
