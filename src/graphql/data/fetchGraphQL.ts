import { Variables } from 'react-relay'
import { GraphQLResponse, RequestParameters } from 'relay-runtime'

const TOKEN_URL = process.env.REACT_APP_AWS_API_ENDPOINT
const NFT_URL = process.env.REACT_APP_NFT_AWS_API_ENDPOINT ?? ''

if (!TOKEN_URL) {
  throw new Error('AWS URL MISSING FROM ENVIRONMENT')
}

const baseHeaders = {
  'Content-Type': 'application/json',
}
const nftHeaders = {
  'Content-Type': 'application/json',
  'x-api-key': process.env.REACT_APP_NFT_AWS_X_API_KEY ?? '',
}

// The issue below prevented using a custom var in metadata to gate which queries are for the nft endpoint vs base endpoint
// This is a temporary solution before the two endpoints merge
// https://github.com/relay-tools/relay-hooks/issues/215
const NFT_QUERIES = ['AssetQuery', 'AssetPaginationQuery', 'CollectionQuery', 'DetailsQuery']

const fetchQuery = (params: RequestParameters, variables: Variables): Promise<GraphQLResponse> => {
  const isNFT = NFT_QUERIES.includes(params.name)
  const body = JSON.stringify({
    query: params.text, // GraphQL text from input
    variables,
  })
  const url = isNFT ? NFT_URL : TOKEN_URL
  const headers = isNFT ? nftHeaders : baseHeaders

  return fetch(url, { method: 'POST', body, headers })
    .then((res) => res.json())
    .catch((e) => {
      console.error(e)
      return { data: [] }
    })
}

export default fetchQuery
