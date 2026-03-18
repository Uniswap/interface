import { ApolloError } from '@apollo/client'
import { useRef } from 'react'
/*
Apollo client clears errors when repolling, so if there's an error and we have a
polling interval defined for the endpoint, then `error` will flicker between
being defined and not defined. This hook helps persist returned errors when polling
until the network request returns.

Feature request to enable persisted errors: https://github.com/apollographql/apollo-feature-requests/issues/348
*/
export function usePersistedError(loading: boolean, error?: ApolloError): ApolloError | undefined {
  const persistedErrorRef = useRef<ApolloError>(undefined)

  if (error || !loading) {
    persistedErrorRef.current = error
  }

  return persistedErrorRef.current
}
