import { ApolloLink } from '@apollo/client'
import { DatadogLink } from '@datadog/mobile-react-native-apollo-client'

export const getDatadogApolloLink = (): ApolloLink => {
  return new DatadogLink()
}
