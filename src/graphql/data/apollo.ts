import { ApolloClient, InMemoryCache } from '@apollo/client'
import { Reference } from '@apollo/client/utilities'

const GRAPHQL_URL = process.env.REACT_APP_AWS_API_ENDPOINT
if (!GRAPHQL_URL) {
  throw new Error('AWS URL MISSING FROM ENVIRONMENT')
}
export const apolloClient = new ApolloClient({
  connectToDevTools: true,
  uri: 'GRAPHQL_URL',
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          token: {
            read(_, { toReference }): Reference | undefined {
              return toReference({
                __typename: 'Token',
              })
            },
          },
        },
      },
      Token: {
        keyFields: false,
        fields: {
          address: {
            read(address: string | null): string | null {
              return address?.toLowerCase() ?? null
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
})

