import { Variables } from 'react-relay'
import { GraphQLResponse, RequestParameters } from 'relay-runtime'

const URL = process.env.REACT_APP_AWS_API_ENDPOINT
const NFT_URL = process.env.REACT_APP_NFT_AWS_API_ENDPOINT ?? ''

if (!URL) {
  throw new Error('AWS URL MISSING FROM ENVIRONMENT')
}

const baseHeaders = {
  'Content-Type': 'application/json',
}
const nftHeaders = {
  'Content-Type': 'application/json',
  'x-api-key': process.env.REACT_APP_NFT_AWS_X_API_KEY ?? '',
}

interface CacheConfig {
  isNFt: boolean
}

const fetchQuery = (
  params: RequestParameters,
  variables: Variables,
  cacheConfig: CacheConfig = { isNFt: false }
): Promise<GraphQLResponse> => {
  const body = JSON.stringify({
    query: params.text, // GraphQL text from input
    variables,
  })
  const url = cacheConfig.isNFt ? NFT_URL : URL
  const headers = cacheConfig.isNFt ? nftHeaders : baseHeaders

  return fetch(url, { method: 'POST', body, headers })
    .then((res) => res.json())
    .catch((e) => {
      console.error(e)
      return { data: [] }
    })
}

export default fetchQuery
