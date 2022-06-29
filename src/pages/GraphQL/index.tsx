import { graphql } from 'babel-plugin-relay/macro'
import RelayEnvironment from 'graphql/RelayEnvironment'
import { GraphQLTokenQuery } from 'pages/GraphQL/__generated__/GraphQLTokenQuery.graphql'
import React from 'react'
import { RelayEnvironmentProvider, useLazyLoadQuery } from 'react-relay/hooks'

const { Suspense } = React

// Define a query
// Inner component that reads the preloaded query results via `usePreloadedQuery()`.
// This works as follows:
// - If the query has completed, it returns the results of the query.
// - If the query is still pending, it "suspends" (indicates to React that the
//   component isn't ready to render yet). This will show the nearest <Suspense>
//   fallback.
// - If the query failed, it throws the failure error. For simplicity we aren't
//   handling the failure case here.

function App() {
  const data = useLazyLoadQuery<GraphQLTokenQuery>(
    graphql`
      query GraphQLTokenQuery {
        tokens(first: 500) {
          id
          name
          symbol
        }
      }
    `,
    {}
  )

  return (
    <div className="App">
      <header className="App-header">
        {data.tokens.map((t) => (
          <p key={t.id}>{t.name}</p>
        ))}
      </header>
    </div>
  )
}

// The above component needs to know how to access the Relay environment, and we
// need to specify a fallback in case it suspends:
// - <RelayEnvironmentProvider> tells child components how to talk to the current
//   Relay Environment instance
// - <Suspense> specifies a fallback in case a child suspends.
function AppRoot() {
  return (
    <RelayEnvironmentProvider environment={RelayEnvironment}>
      <Suspense fallback={'Loading...'}>
        <App />
      </Suspense>
    </RelayEnvironmentProvider>
  )
}

export default AppRoot
