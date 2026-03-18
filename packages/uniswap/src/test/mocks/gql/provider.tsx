import { ApolloClient, ApolloLink, ApolloProvider, InMemoryCache } from '@apollo/client'
import { SchemaLink } from '@apollo/client/link/schema'
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader'
import { loadSchemaSync } from '@graphql-tools/load'
import { mergeResolvers } from '@graphql-tools/merge'
import { addMocksToSchema } from '@graphql-tools/mock'
import { GraphQLApi } from '@universe/api'
import path from 'path'
import { PropsWithChildren } from 'react'
import { setupSharedApolloCache } from 'uniswap/src/data/cache'
import { getErrorLink, getRestLink } from 'uniswap/src/data/links'
import { mocks as defaultMocks } from 'uniswap/src/test/mocks/gql/mocks'
import { defaultResolvers } from 'uniswap/src/test/mocks/gql/resolvers'

const GQL_SCHEMA_PATH = path.join(__dirname, '../../../../../api/src/clients/graphql/schema.graphql')

const baseSchema = loadSchemaSync(GQL_SCHEMA_PATH, { loaders: [new GraphQLFileLoader()] })

type AutoMockedApolloProviderProps = PropsWithChildren<{
  cache?: InMemoryCache
  resolvers?: Partial<GraphQLApi.Resolvers>
}>

export function AutoMockedApolloProvider({
  children,
  cache,
  resolvers: customResolvers,
}: AutoMockedApolloProviderProps): JSX.Element {
  const resolvers = mergeResolvers([defaultResolvers, customResolvers])
  const schema = addMocksToSchema({ schema: baseSchema, mocks: defaultMocks, resolvers })

  const client = new ApolloClient({
    link: ApolloLink.from([getErrorLink(1, 1), getRestLink(), new SchemaLink({ schema })]),
    cache: cache ?? setupSharedApolloCache(),
  })

  return <ApolloProvider client={client}>{children}</ApolloProvider>
}

const schema = addMocksToSchema({
  schema: baseSchema,
  mocks: defaultMocks,
  resolvers: mergeResolvers([defaultResolvers]),
})

export const mockApolloClient = new ApolloClient({
  link: ApolloLink.from([getErrorLink(1, 1), getRestLink(), new SchemaLink({ schema })]),
  cache: setupSharedApolloCache(),
})
