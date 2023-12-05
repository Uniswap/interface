# E2E Tests

The e2e tests use [detox](https://github.com/wix/Detox). Install the [cli](https://wix.github.io/Detox/docs/introduction/getting-started/) first.

To run tests, **terminate metro and quit the simulator app** and then,

```
# Build and start metro
yarn test:e2e:build

# Start hardhat server (forks mainnet)
yarn hardhat
```

finally run:

```
yarn test:e2e:run
```

Tests will run with a headless simluator. Open `Simulator.app` to visualize the test cases.

You can also run a specific test with

```
yarn test:e2e:run e2e/Swap.e2e.js
```

## Mocking

E2E tests should remain as close as possible to production, but sometimes mocking is necessary. 

Only mocking entire files is supported at the moment, so you may need to reorganize functions. To mock a file, create a new one with the same name and extension `e2e.js` (e.g. `utils.ts` -> `utils.e2e.js`). The metro bundler will override any file that has a `e2e.js` equivalent in Detox runs. e.g. https://github.com/Uniswap/universe/blob/main/apps/mobile/src/utils/time.e2e.js

Read more here https://wix.github.io/Detox/docs/guide/mocking/

## Debugging

[Detox Troubleshooting](https://github.com/wix/Detox/blob/master/docs/Troubleshooting.RunningTests.md)

- Example: [#430](https://github.com/Uniswap/universe/pull/430)

* Element not visible: [Debug View Hierarchy](https://github.com/wix/Detox/blob/master/docs/Troubleshooting.RunningTests.md#debug-view-hierarchy)
