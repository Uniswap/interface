import { ApolloClient, from, HttpLink } from '@apollo/client'
import { setupSharedApolloCache } from 'uniswap/src/data/graphql/cache'
import { getDatadogApolloLink } from 'utilities/src/logger/datadog/datadogLink'
import { getConfig } from '~/config'
import { getRetryLink } from '~/data/apollo/retryLink'

const httpLink = new HttpLink({ uri: getConfig().awsApiEndpoint })
const datadogLink = getDatadogApolloLink()
const retryLink = getRetryLink()

export const apolloClient = new ApolloClient({
  connectToDevTools: true,
  link: from([datadogLink, retryLink, httpLink]),
  headers: {
    'Content-Type': 'application/json',
    Origin: 'https://app.uniswap.org',
  },
  cache: setupSharedApolloCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
})
