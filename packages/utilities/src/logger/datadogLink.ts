import { ApolloLink } from '@apollo/client'
import { PlatformSplitStubError } from 'utilities/src/errors'

// Typed as ApolloLink to avoid platform import issues for this function
// Callers only require A
export const getDatadogApolloLink = (): ApolloLink => {
  throw new PlatformSplitStubError('getDatadogApolloLink')
}
