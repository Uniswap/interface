import { ApolloClient, ApolloProvider, from } from '@apollo/client'
import { PropsWithChildren } from 'react'
import { setupCache } from 'wallet/src/data/cache'
import { getHttpLink, getRestLink } from 'wallet/src/data/links'

const client = new ApolloClient({
  link: from([getRestLink(), getHttpLink()]),
  cache: setupCache(),
})

export function GraphqlProvider({ children }: PropsWithChildren<unknown>): JSX.Element {
  return <ApolloProvider client={client}>{children}</ApolloProvider>
}
