Note. We migrated to Apollo client in November. This needs to be updated with information for Apollo.

# Relay

[Relay](https://relay.dev/docs/) is a GraphQL client built for scale with unique benefits:
* collocating data dependencies in components with GraphQL fragments
* query compiler that aggregates and optimizes data requirements
* data consistency across components

## Principles

Recommended readings:
* [Why React at Uniswap Labs?](https://www.notion.so/uniswaplabs/GraphQL-Client-949780e7d105405c87cdd0147bd2f84b)
* [Thinking in GraphQL](https://relay.dev/docs/principles-and-architecture/thinking-in-graphql/)
* [Thinking in Relay](https://relay.dev/docs/principles-and-architecture/thinking-in-relay/)

| Commands |   |
|---|---|
| `yarn relay:schema` | Fetch latest GraphQL schema  |
| `yarn relay:compile`  | Run relay compiler (validates queries, generates typings) |
| `yarn relay:compile -w`  | " in watch mode  |

## Schema Overview

GraphQL schema can be fetched directly from our Uniswap API via `yarn relay:schema` (written to `src/data/schema.graphql`).

`Query` type defines query entrypoints:

```ts
type Query {
  tokens(contracts: [ContractInput!]!): [Token]
  tokenProjects(contracts: [ContractInput!]!): [TokenProject]
  ...
}
```

## Architecture Overview

| | | |
|--|--|--|
| Relay runtime | [relay.ts](./relay.tsx) | Defines `fetchQuery`, `Network` and `store` |
| Navigation with preloaded data | [useEagerNavigation](../app/navigation/useEagerNavigation.ts) | Utility hook

### Persisted cache

Persisting cache data across sessions improves app start up time (or at least perceived time). There's no use case for true offline support at the moment.

[relay.ts](./relay.tsx) defines a `RelayPersistedGate` and handles a simple load/dump cache strategy.

**Typical flow (top to bottom)**

1. screens define top level queries
2. using navigation utils, preload queries on navigation intent, and route query ref through route params
3. screens can reference this data using `usePreloadedQuery` and the ref
4. screens pass query/fragment refs down to sub-components
5. those sub-components can define fragments for the data they need, and grab it using `useFragment` and the key they accept

### Navigation with preloaded data

This follows [A Guided Tour](https://relay.dev/docs/guided-tour/) with a specific example from our codebase.

#### Step 1. Define data requirements for each component with a **GraphQL fragment**

```tsx
const tokenDetailsStatsFragment = graphql`
  fragment TokenDetailsStats_tokenProject on TokenProject {
    description
    name
    marketCap {
      value
    }
    volume24h: volume(duration: DAY) {
      value
    }
    ...
  }
`
```

#### Step 2. Render fragment with `useFragment` hook

```tsx
type Props = {
  tokenProject: TokenDetailsStats_TokenProject$key 
}

function TokenDetailsStats({ tokenProject }: Props) {
  const data = useFragment(
    // fragment from step 1
    tokenDetailsStatsFragment,
    // fragment reference from props
    tokenProject
  )
  
  return <Text>{data}</Text>
}
```

Notes:
* Fragment only defines data requirements on `TokenProject`, but not *which* token project to read
* Fragment reference `tokenProject: TokenDetailsStats_TokenProject$key` is passed down from a preloaded query and defines which `TokenProject` to read
* `TokenDetailsStats` is automatically subscribed to data updates

#### Step 3. Compose fragment into a query using `usePreloadedQuery`

Fragments **cannot be fetched by themselves**, they must be included in a query.

```tsx
type Props = {
  queryRef: OfflineQuery
}

function TokenDetailsScreen() {
  const data = usePreloadedQuery(
    graphql`
      query TokenDetailsScreenQuery($contract: ContractInput!) {
        tokenProjects(contracts: [$contract]) {
          # Fragment from step 1
          ...TokenDetailsStats_tokenProject
        }
      }
    `,
    queryRef
  )

  return <TokenDetailsStats tokenProject={data.tokenProject} />
}
```

#### Step 4. Preload and navigate

The token details screen is now ready to receive a preloaded query, and components have defined the data they need through fragments.

```tsx
function TokenRow({ currency }) {

  // Get preload utils for tokenDetailsQuery
  const { registerNavigationIntent, preloadedNavigate } = useEagerNavigation(tokenDetailsScreenQuery)

  // Eagerly fetch token details data
  const onPressIn = () => {
    registerNavigationIntent({
      chain: currency.chain,
      address: currency.address
    })
  }

  // Navigate to TokenDetails with preloaded query ref
  const onPress = () => {
    preloadedNavigate(Screens.TokenDetails, { currency })
  }

  return <Button onPressIn={onPressIn} onPress={onPress} />
}
```

### Data fetching without preloading

`useLazyLoadQuery`: https://relay.dev/docs/api-reference/use-lazy-load-query/

Fetches query *during render*, possibly triggering nested or waterfalling roundtrips, degrading performance.

**Examples use cases**
* search query in explore
* quote from Routing API (if/when migrated to gql)
