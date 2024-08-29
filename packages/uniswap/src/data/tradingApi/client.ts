import { ApolloClient, ApolloLink, from } from '@apollo/client'
import { RestLink } from 'apollo-link-rest'
import { config } from 'uniswap/src/config'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { createNewInMemoryCache } from 'uniswap/src/data/cache'
import { REQUEST_SOURCE, getVersionHeader } from 'uniswap/src/data/constants'
import { getDatadogApolloLink } from 'utilities/src/logger/datadogLink'
import { isMobileApp } from 'utilities/src/platform'

export const TRADING_API_HEADERS = {
  'Content-Type': 'application/json',
  'X-API-KEY': config.tradingApiKey,
  'x-request-source': REQUEST_SOURCE,
  'x-app-version': getVersionHeader(),
  Origin: uniswapUrls.requestOriginUrl,
} as const

const restLink = new RestLink({
  uri: uniswapUrls.tradingApiUrl,
  headers: TRADING_API_HEADERS,
})

const linkList: ApolloLink[] = [restLink]
if (isMobileApp) {
  linkList.push(getDatadogApolloLink())
}

export const TradingApiApolloClient = new ApolloClient({
  link: from(linkList),
  cache: createNewInMemoryCache(),
  defaultOptions: {
    watchQuery: {
      // ensures query is returning data even if some fields errored out
      errorPolicy: 'all',
      // This isn't really being used because `useRestQuery` overrides this attribute.
      // We need to explicitly pass `fetchPolicy: 'no-cache'` when calling `useRestQuery` to apply this policy.
      fetchPolicy: 'no-cache',
    },
  },
})
