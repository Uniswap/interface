import { ApolloClient, ApolloLink, ApolloProvider } from '@apollo/client'
import { SchemaLink } from '@apollo/client/link/schema'
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader'
import { loadSchemaSync } from '@graphql-tools/load'
import { mergeResolvers } from '@graphql-tools/merge'
import { addMocksToSchema } from '@graphql-tools/mock'
import path from 'path'
import { PropsWithChildren } from 'react'
import { setupCache } from 'wallet/src/data/cache'
import { getErrorLink, getRestLink } from 'wallet/src/data/links'
import { Resolvers } from 'wallet/src/data/__generated__/types-and-hooks'
import { mocks as defaultMocks } from './mocks'
import { resolvers as defaultResolvers } from './resolvers'

const GQL_SCHEMA_PATH = path.join(__dirname, '../../data/__generated__/schema.graphql')

const baseSchema = loadSchemaSync(GQL_SCHEMA_PATH, { loaders: [new GraphQLFileLoader()] })

type AutoMockedApolloProviderProps = PropsWithChildren<{
  resolvers?: Partial<Resolvers>
}>

export function AutoMockedApolloProvider({
  children,
  resolvers: customResolvers,
}: AutoMockedApolloProviderProps): JSX.Element {
  const resolvers = mergeResolvers([defaultResolvers, customResolvers])
  const schema = addMocksToSchema({ schema: baseSchema, mocks: defaultMocks, resolvers })

  const client = new ApolloClient({
    link: ApolloLink.from([getErrorLink(1, 1), getRestLink(), new SchemaLink({ schema })]),
    cache: setupCache(),
  })

  return <ApolloProvider client={client}>{children}</ApolloProvider>
}
