import { ApolloClient, gql, InMemoryCache, useQuery } from '@apollo/client'

const TOKEN_PRICE = (tokenId = '') => {
  const queryString =
    `
    query tokenPrice {
      tokenHourDatas(where:{token_: {id:"` +
    tokenId.toLocaleLowerCase() +
    `"}}
        orderBy: periodStartUnix, orderDirection: desc, subgraphError: allow) {
        volumeUSD
        volume
        untrackedVolumeUSD
        totalValueLockedUSD
        totalValueLocked
        priceUSD
        open
        low
        id
        high
        feesUSD
        periodStartUnix
        close
    }
  }
    `
  return gql(queryString)
}

const fujiClient = new ApolloClient({
  uri: 'https://subgraph.satsuma-prod.com/09c9cf3574cc/orbital-apes/v3-subgraph/api',
  cache: new InMemoryCache({
    typePolicies: {
      Token: {
        // Singleton types that have no identifying field can use an empty
        // array for their keyFields.
        keyFields: false,
      },
      Pool: {
        // Singleton types that have no identifying field can use an empty
        // array for their keyFields.
        keyFields: false,
      },
    },
  }),
  queryDeduplication: true,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'no-cache',
    },
    query: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    },
  },
})

export function useTokenPrice(token: string) {
  // derive blocks based on active network
  const { loading, error, data } = useQuery(TOKEN_PRICE(token), {
    client: fujiClient,
  })

  if (error || loading) {
    return {
      loading,
      error,
      data: undefined,
    }
  }

  return {
    loading,
    error,
    data: data?.tokenHourDatas?.map((td: any) => ({
      timestamp: td?.periodStartUnix,
      time: td?.periodStartUnix,
      open: parseFloat(td?.open) == 0.0 ? 0.0 : parseFloat(td?.open),
      high: parseFloat(td?.high) == 0.0 ? 0.0 : parseFloat(td?.high),
      low: parseFloat(td?.low) == 0.0 ? 0.0 : parseFloat(td?.low),
      close: parseFloat(td?.close) == 0.0 ? 0.0 : parseFloat(td?.close),
      value: parseFloat(td?.priceUSD) == 0.0 ? 0.0 : parseFloat(td?.priceUSD),
    })),
  }
}
