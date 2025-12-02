# Tests

This directory contains fixtures, mocks and utilities useful while writing tests.

## 1. Structure of directories and files

### 1.1. fixtures

- All test fixtures should be stored in this directory,
- Subdirectories group fixtures based on their type declaration location:
  - `lib` - stores library-related fixtures (e.g. for transaction types from the `ethers` library, for token types from the @uniswap/sdk-core library, etc.),
  - `wallet` - if the type of an object was specified somewhere in the wallet package files, its fixture should be added in this directory.
  - remaining files - `constants` (contains constants used in tests), `events` (contains event payload fixtures)

### 1.2. mocks

- Contains all mocks (i.e. mocked providers, resolvers, default values for non-mocked graphql resolvers, etc.). In short, all mocks that aren't just simple objects with primitive values (or values with nested objects) should be located in this ditectory.

## 2. Usage

### 2.1. Creating fixtures

#### 2.1.1. Basics

`createFixture` is the core function used to create fixtures which is declared in the `packages/wallet/src/test/utils/factory.ts` file.

Take a look at the usage example:

```tsx
export const networkUnknown = createFixture<NetInfoUnknownState>()(() => ({
  isConnected: null,
  type: NetInfoStateType.unknown,
  isInternetReachable: null,
  details: null,
}));
```

To create a fixture, we have to use the `createFixture` function and provide one type argument which will be the type of the object the fixture corresponds to (`NetInfoUnknownState` in the example above). In the simplest scenario, the `createFixture` fixture is called with no arguments (`createFixture<NetInfoUnknownState>()`). This call returns another function that takes a callback which should return the resulting fixture object.

To make the result more similar to real-world scenario, we can use the `faker` library to generate values for respective fields in the fixture.

The result (`networkUnknown` variable in the example) is a function that can be called to get the fixture object. This is a function to ensure that the fixture is not a static object which fields are easily predictable (this may lead to `false` positives in tests where we expect certain values because our hardcoded fixture contains exactly the same fields).

The type of the object returned by our fixture function (`networkUnknown`) that we created with `createFixture` will be automatically adjusted to match the type of the object specified in the callback function that contains values for mocked fields. This is better than using the base type (`NetInfoUnknownState` in this case) which may have all fields marked as optional (common in graphql) what can lead to type errors in tests where we expect some fields to be present.

#### 2.1.2. Custom options

The first function returned by `createFixture` takes an optional `options` parameter. This parameter should be an object containing any custom fields which may alter the resulting fixture. e.g. we can create the graphql `Token` type from the sdk token passed as a parameter.

##### Example implementation

```tsx
type TokenOptions = {
  sdkToken: SDKToken | null;
};

export const token = createFixture<Token, TokenOptions>({ sdkToken: null })(({ sdkToken }) => ({
  __typename: "Token",
  id: faker.datatype.uuid(),
  name: sdkToken?.name ?? faker.lorem.word(),
  symbol: sdkToken?.symbol ?? faker.lorem.word(),
  decimals: sdkToken?.decimals ?? faker.datatype.number({ min: 1, max: 18 }),
  chain: (sdkToken ? toGraphQLChain(sdkToken.chainId) : null) ?? randomChoice(GQL_CHAINS),
  address: sdkToken?.address.toLocaleLowerCase() ?? faker.finance.ethereumAddress(),
  market: null,
  project: tokenProjectBase(),
}));
```

To be able to use custom options, we have to pass a second type to the `createFixture` function that specifies the type of the custom options object. In the example above, when the `sdkToken` is provided, its field values will be used to create a fixture. Otherwise, field values will be generated with `faker` library.

##### Another example

```tsx
type NftCollectionOptions = {
  contractsCount: number;
};

export const nftCollection = createFixture<NftCollection, NftCollectionOptions>({
  contractsCount: 2,
})(({ contractsCount }) => ({
  __typename: "NftCollection",
  id: faker.datatype.uuid(),
  name: faker.lorem.word(),
  collectionId: faker.datatype.uuid(),
  isVerified: faker.datatype.boolean(),
  nftContracts: createArray(contractsCount, nftContract),
  image: image(),
}));
```

Thanks to custom options, we can easily manipulate the number of items in the array. `createArray` is a utility function taking the number of array items and a callback function called for all items in the resulting array.

#### 2.2. Using fixtures

The usage is very simple. To create an object, we have to just call the fixture function we created with the `createFixture` factory function. If no additional parameters are provided, it will create a fixture based on default options (if specified) and default values returned in the `getValues` callback function while creating a fixture.

We can easily override any of fixture fields based on per-test requirements. If the object should contain more fields than specified in the fixture, which are optional in the base type, we can just pass an object as the fixture function argument with the value for the specific field/fields. In the same way, we can override fields that are already specified in the fixture factory callback.

##### 2.2.1. Example usage

###### In resolver mocks

```tsx
const resolvers: Resolvers = {
  Query: {
    topTokens: () => [wethToken(), usdcToken()],
    tokens: () => [ethToken({ address: null })],
  },
};
```

###### Combining fixtures

Fixtures can be used to override fields in other fixtures as shown in the example below.

```tsx
const collection = nftCollection({
  nftContracts: [nftContract({ chain: Chain.Ethereum })],
});
```

### 2.2. Mocking GraphQL query resolvers

#### 2.2.1. Basics

To mock query resolvers in tests we can use the helper function `queryResolvers`. This function takes an object with custom resolvers for specific GraphQL queries.

The usage of the `queryResolvers` function is not mandatory, because we can mock resolvers without this function, but it has a few benefits:

1. In cases where queries select only a subset of document fields (e.g. `address` and `id` from the `Token` type without other properties, such as `chain`, etc.), it will automatically filter out unnecessary fields from the query response and we will get the object of shape exactly the same as specified in the query document. Without the usage of the `queryResolvers` function, responses will contain all fields of the fixture we returned from our custom resolvers, which lead to unpredictible results in some tests.
2. It makes it possible to access values returned from resolvers. This is especially useful, when queries select specific fields and we want to expect test result based on what was returned from the resolver (not based on the fixture with all fields, some of which weren't present in the query response),
3. The writing of custom resolvers in tests is cleaner with `queryResolvers` and requires less code (no need to create `Query` object with resolvers, we can pass just resolvers without the `Query` object)

#### 2.2.2. Example usage

##### Filtering out fields in query response

###### Without `queryResolvers`

We had to remove fields manually by replacing them with `null` values.

```tsx
const searchTokens = createArray(5, () =>
  token({
    // There is no isSpam field in the query document, so we remove it from the token object as it causes incorrect test results
    project: tokenProject({ isSpam: null }),
  })
);

const resolvers: Resolvers = {
  Query: {
    searchTokens: () => searchTokens,
  },
};
```

###### With `queryResolvers`

There is no need to directly manipulate the fixture. We don't have to remove any fields because they will be automatically removed in `resolvers`.

```tsx
const { resolvers } = queryResolvers({
  searchTokens: () => createArray(5, token),
});
```

##### Using query result to create expected object

In this case, we use `resolved` property to access the resolved value of the specific resolver. We cannot use fixture directly while expecting test result because it contains more fields than returned from the query resolver and will give different results (we would expect fields to be present because they are declared in the fixture, which is incorrect, as they don't exist in the resolver response).

```tsx
const { resolvers, resolved } = queryResolvers({
  searchTokens: () => createArray(5, token),
});

const { result } = renderHook(() => useSearchTokens("", null, false), {
  resolvers,
});

await waitFor(async () => {
  expect(result.current.data).toEqual(
    // wait until the resolved value is available and use it to create the expected
    // test result (using the fixture created with createArray(5, token) won't work
    // because of too many fields)
    (await resolved.searchTokens).map(gqlTokenToCurrencyInfo)
  );
});
```
