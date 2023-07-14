const GRAPHQL_ENDPOINT = 'https://api.uniswap.org/v1/graphql'

//TODO: Figure out how to make ApolloClient global variable
export const getApolloClient = async () => {
  const { ApolloClient } = await import('@apollo/client/core')
  const { InMemoryCache } = await import('@apollo/client/cache')
  return new ApolloClient({
    connectToDevTools: true,
    uri: GRAPHQL_ENDPOINT,
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://app.uniswap.org',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.110 Safari/537.36',
    },
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-first',
      },
    },
  })
}
