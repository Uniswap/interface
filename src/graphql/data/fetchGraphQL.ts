import { Variables } from 'react-relay'
import { GraphQLResponse, RequestParameters } from 'relay-runtime'

const TOKEN_URL = process.env.REACT_APP_AWS_API_ENDPOINT
const NFT_URL = process.env.REACT_APP_NFT_AWS_API_ENDPOINT
if (!TOKEN_URL) throw new Error('Token URL missing from environment')

const baseHeaders = { 'Content-Type': 'application/json' }
const tokenHeaders = { ...baseHeaders }
const nftHeaders = {
  ...baseHeaders,
  'from-x-api-key': process.env.REACT_APP_NFT_FROM_AWS_X_API_KEY ?? '',
  'x-api-key': process.env.REACT_APP_NFT_AWS_X_API_KEY ?? '',
}

// The issue below prevented using a custom var in metadata to gate which queries are for the nft endpoint vs base endpoint
// This is a temporary solution before the two endpoints merge
// https://github.com/relay-tools/relay-hooks/issues/215
const NFT_QUERIES = [
  'AssetQuery',
  'AssetPaginationQuery',
  'CollectionQuery',
  'DetailsQuery',
  'NftBalanceQuery',
  'NftBalancePaginationQuery',
]

const fetchToken = (body: string): Promise<Response> => {
  return fetch(TOKEN_URL, { method: 'POST', body, headers: tokenHeaders })
}

const fetchNFT = (body: string): Promise<Response> => {
  if (!NFT_URL) {
    throw new Error('NFT URL missing from environment')
  }
  return fetch(NFT_URL, { method: 'POST', body, headers: nftHeaders })
}

const fetchQuery = (params: RequestParameters, variables: Variables): Promise<GraphQLResponse> => {
  const body = JSON.stringify({
    query: params.text, // GraphQL text from input
    variables,
  })
  const isNFT = NFT_QUERIES.includes(params.name)
  const response = isNFT ? fetchNFT(body) : fetchToken(body)
  return response
    .then((res) => res.json())
    .catch((e) => {
      console.error(e)
      return { data: [] }
    })
}

export default fetchQuery
