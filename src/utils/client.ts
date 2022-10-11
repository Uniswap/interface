import { ApolloClient, InMemoryCache, NormalizedCacheObject } from '@apollo/client'

export const createClient = (url: string): ApolloClient<NormalizedCacheObject> =>
  new ApolloClient({
    uri: url,
    cache: new InMemoryCache({
      addTypename: false,
    }),
  })
