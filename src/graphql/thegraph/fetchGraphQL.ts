/**
 * Helpful Resources
 * https://github.com/sibelius/create-react-app-relay-modern/blob/master/src/relay/fetchQuery.js
 * https://github.com/relay-tools/relay-compiler-language-typescript/blob/master/example/ts/app.tsx
 */

import { SupportedChainId } from 'constants/chains'
import { Variables } from 'react-relay'
import { GraphQLResponse, ObservableFromValue, RequestParameters } from 'relay-runtime'

import store, { AppState } from '../../state/index'

const CHAIN_SUBGRAPH_URL: Record<number, string> = {
  [SupportedChainId.MAINNET]: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
  [SupportedChainId.RINKEBY]: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',

  [SupportedChainId.ARBITRUM_ONE]: 'https://api.thegraph.com/subgraphs/name/ianlapham/arbitrum-minimal',

  [SupportedChainId.OPTIMISM]: 'https://api.thegraph.com/subgraphs/name/ianlapham/optimism-post-regenesis',

  [SupportedChainId.POLYGON]: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-polygon',

  [SupportedChainId.CELO]: 'https://api.thegraph.com/subgraphs/name/jesse-sawa/uniswap-celo',
}

const headers = {
  Accept: 'application/json',
  'Content-type': 'application/json',
}

// Define a function that fetches the results of a request (query/mutation/etc)
// and returns its results as a Promise:
const fetchQuery = (params: RequestParameters, variables: Variables): ObservableFromValue<GraphQLResponse> => {
  const chainId = (store.getState() as AppState).application.chainId

  const subgraphUrl =
    chainId && CHAIN_SUBGRAPH_URL[chainId] ? CHAIN_SUBGRAPH_URL[chainId] : CHAIN_SUBGRAPH_URL[SupportedChainId.MAINNET]

  const body = JSON.stringify({
    query: params.text, // GraphQL text from input
    variables,
  })

  const response = fetch(subgraphUrl, {
    method: 'POST',
    headers,
    body,
  }).then((res) => res.json())

  return response
}

export default fetchQuery
