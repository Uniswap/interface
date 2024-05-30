import { ApolloLink, HttpLink, split } from '@apollo/client'
import { getMainDefinition } from '@apollo/client/utilities'
import { SubscriptionLink } from 'utilities/src/apollo/SubscriptionLink'

export function splitSubscription(
  subscriptionLink: SubscriptionLink,
  httpLink: HttpLink
): ApolloLink {
  // Use the subscriptionLink for subscriptions, and the httpLink for everything else;
  // see https://www.apollographql.com/docs/react/api/link/introduction/#directional-composition.
  return split(
    ({ query }) => {
      const definition = getMainDefinition(query)
      return definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
    },
    subscriptionLink,
    httpLink
  )
}
