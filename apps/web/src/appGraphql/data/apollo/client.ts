/* eslint-disable import/no-unused-modules */
import { ApolloClient, HttpLink, from } from '@apollo/client'
import { useMemo } from 'react'
import { setupSharedApolloCache } from 'uniswap/src/data/cache'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { setupRingSharedApolloCache } from 'uniswap/src/data/ringCache'
import { getDatadogApolloLink } from 'utilities/src/logger/datadog/datadogLink'

const API_URL = process.env.REACT_APP_AWS_API_ENDPOINT
if (!API_URL) {
  throw new Error('AWS API ENDPOINT MISSING FROM ENVIRONMENT')
}

const httpLink = new HttpLink({ uri: API_URL })
const datadogLink = getDatadogApolloLink()

export const apolloClient = new ApolloClient({
  connectToDevTools: true,
  link: from([datadogLink, httpLink]),
  headers: {
    'Content-Type': 'application/json',
    Origin: 'https://app.ring.exchange',
  },
  cache: setupSharedApolloCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
})

const ETH_GRAPHQL_ENDPOINT = 'https://api-explore-ring-production.up.railway.app'
const HYPER_GRAPHQL_ENDPOINT = 'https://api-explore-ring-production-e594.up.railway.app'

const ethClient = new ApolloClient({
  connectToDevTools: true,
  link: from([datadogLink, new HttpLink({ uri: ETH_GRAPHQL_ENDPOINT })]),
  headers: {
    'Content-Type': 'application/json',
    Origin: 'https://app.ring.exchange',
  },
  cache: setupRingSharedApolloCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
})

const hyperClient = new ApolloClient({
  link: from([datadogLink, new HttpLink({ uri: HYPER_GRAPHQL_ENDPOINT })]),
  connectToDevTools: true,
  headers: {
    'Content-Type': 'application/json',
    Origin: 'https://ring.exchange',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.110 Safari/537.36',
  },
  cache: setupRingSharedApolloCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
})

export function useQueryClient(chain: Chain) {
  return useMemo(() => {
    switch (chain) {
      case Chain.Ethereum:
        return ethClient
      case Chain.Hyper:
        return hyperClient
      default:
        throw new Error(`Unsupported chain: ${chain}`)
    }
  }, [chain])
}
