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

## Debugging

[Detox Troubleshooting](https://github.com/wix/Detox/blob/master/docs/Troubleshooting.RunningTests.md)

- Example: [#430](https://github.com/Uniswap/mobile/pull/430)

* Element not visible: [Debug View Hierarchy](https://github.com/wix/Detox/blob/master/docs/Troubleshooting.RunningTests.md#debug-view-hierarchy)
