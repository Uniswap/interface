import { ApolloClient, ApolloLink, DefaultContext, from, gql } from '@apollo/client'
import { AUTH_TYPE, AuthOptions } from 'aws-appsync-auth-link'
import { AppSyncRealTimeSubscriptionHandshakeLink } from 'aws-appsync-subscription-link/lib/realtime-subscription-handshake-link'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { Observable } from 'zen-observable-ts'

export type SubscriptionLink = ApolloLink & { __brand: 'SubscriptionLink' }

const Heartbeat = gql`
  mutation ($subscriptionId: ID!) {
    heartbeat(subscriptionId: $subscriptionId, type: ASSET_ACTIVITY) {
      success
    }
  }
`

const Unsubscribe = gql`
  mutation ($subscriptionId: ID!) {
    unsubscribe(subscriptionId: $subscriptionId, type: ASSET_ACTIVITY) {
      success
    }
  }
`

/**
 * Maintains a keepalive by sending `heartbeat`s at regular intervals.
 * Also gracefully disconnects by sending an `unsubscribe` when closing the subscription.
 */
function createKeepaliveLink<T>(client: ApolloClient<T>): ApolloLink {
  return new ApolloLink((operation, forward) => {
    const observable = forward(operation)
    return new Observable((observer) => {
      const subscription = observable.subscribe(observer)

      const interval = setInterval(async () => {
        const {
          data: {
            heartbeat: { success },
          },
        } = await client.mutate({ mutation: Heartbeat, variables: operation.variables })
        if (!success) {
          observer.error('Failed to keepalive subscription')
        }
      }, ONE_MINUTE_MS * 3)
      return (): void => {
        clearInterval(interval)
        subscription.unsubscribe()
        //eslint-disable-next-line @typescript-eslint/no-floating-promises
        client.mutate({ mutation: Unsubscribe, variables: operation.variables })
      }
    })
  })
}

/**
 * Sets the `Connection` header on subscription registrations by setting the `Upgrade` header in the context, which
 * causes AWS WAF to infer a `Connection: upgrade` header. This is required for WAF to ALLOW the realtime request.
 */
function createConnectionHeaderLink(): ApolloLink {
  return new ApolloLink((operation, forward) => {
    operation.setContext((context: DefaultContext) => ({
      ...context,
      headers: { ...context.headers, upgrade: 'websocket' },
    }))
    return forward(operation)
  })
}

interface SubscriptionLinkConfig {
  uri: string
  region?: string
  token: string
}

/** Creates an ApolloLink for realtime subscription queries. */
export function createSubscriptionLink<T>(
  {
    uri,
    region = '', // left blank for a custom domain name (eg realtime.gateway.uniswap.org)
    token,
  }: SubscriptionLinkConfig,
  client: ApolloClient<T>
): SubscriptionLink {
  const auth: AuthOptions = { type: AUTH_TYPE.AWS_LAMBDA, token }
  // Order is intentional here - the header must be set before sending the subscription.
  return from([
    createKeepaliveLink(client),
    createConnectionHeaderLink(),
    new AppSyncRealTimeSubscriptionHandshakeLink({ url: uri, region, auth }),
  ]) as ApolloLink as SubscriptionLink
}
