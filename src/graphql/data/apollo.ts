import { ApolloClient, InMemoryCache } from '@apollo/client'
import { relayStylePagination } from '@apollo/client/utilities'

export const apolloClient = new ApolloClient({
  uri: process.env.REACT_APP_NFT_AWS_API_ENDPOINT,
  headers: {
    'Content-Type': 'application/json',
    Origin: 'https://app.uniswap.org',
    'x-api-key': process.env.REACT_APP_NFT_AWS_X_API_KEY ?? '',
  },
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          nftAssets: relayStylePagination(),
        },
      },
    },
  }),
})
