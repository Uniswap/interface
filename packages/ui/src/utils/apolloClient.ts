import { InMemoryCache } from 'apollo-cache-inmemory'
import { ApolloClient } from 'apollo-client'
import { HttpLink } from 'apollo-link-http'

export const client = new ApolloClient({
  //
  link: new HttpLink({
    // uri: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswapv2'
    uri: 'https://graph-goerli.qa.davionlabs.com/subgraphs/name/gop_subgraph'
  }),
  cache: new InMemoryCache()
  //   shouldBatch: true
})
