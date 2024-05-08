import { ApolloClient, ApolloLink, ApolloProvider, InMemoryCache } from '@apollo/client'
import { SchemaLink } from '@apollo/client/link/schema'
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader'
import { loadSchemaSync } from '@graphql-tools/load'
import { mergeResolvers } from '@graphql-tools/merge'
import { addMocksToSchema } from '@graphql-tools/mock'
import path from 'path'
import { PropsWithChildren } from 'react'
import { setupWalletCache } from 'uniswap/src/data/cache'
import { Resolvers } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { getErrorLink, getRestLink } from 'wallet/src/data/links'
import { mocks as defaultMocks } from './mocks'
import { defaultResolvers } from './resolvers'

const GQL_SCHEMA_PATH = path.join(
  __dirname,
  '../../../../../uniswap/src/data/graphql/uniswap-data-api/schema.graphql'
)

const baseSchema = loadSchemaSync(GQL_SCHEMA_PATH, { loaders: [new GraphQLFileLoader()] })

type AutoMockedApolloProviderProps = PropsWithChildren<{
  cache?: InMemoryCache
  resolvers?: Partial<Resolvers>
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
    cache: cache ?? setupWalletCache(),
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
  cache: setupWalletCache(),
})
