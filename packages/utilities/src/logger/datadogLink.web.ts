import { ApolloLink } from '@apollo/client'
import { NotImplementedError } from 'utilities/src/errors'

// This is currently only used on native. No implementation exists for web.
export const getDatadogApolloLink = (): ApolloLink => {
  throw new NotImplementedError('getDatadogApolloLink')
}
