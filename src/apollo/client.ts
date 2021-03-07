import { ApolloClient, InMemoryCache, NormalizedCacheObject } from '@apollo/client'

export const client: ApolloClient<NormalizedCacheObject> = new ApolloClient({
  uri: process.env.REACT_APP_SUBGRAPH_URL,
  cache: new InMemoryCache()
})
