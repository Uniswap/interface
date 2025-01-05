# E2E Tests

The e2e tests use [detox](https://github.com/wix/Detox).

## Running tests

### iOS

Detox environment requires installation of the same environment as the main iOS application and additionally the iPhone 15 simulator.
The choice of this simulator is hardcoded in order to reflect e2e environment setup and is dictated by the github actions virtual machine on which the e2e tests will take place.

#### Debug mode

To run tests in debug mode, run bundler:

```
yarn mobile e2e:packager
```

Build debug testing app:

```
yarn mobile e2e:ios:build:debug
```

Run ios e2e tests in debug mode:

```
yarn mobile e2e:ios:test:debug
```

Useful perameters:

`--testNamePattern test-name` to run a single test, replace `test-name` with test file name without extension e.g.: `Swap` or `Onboarding`.

`--reuse` to start the test from a current app state. Useful for testing nested screen behaviour without going through onboarding and navigation steps.

#### Release mode

To run tests in release mode:

```
yarn mobile e2e:ios:test:release
```

It builds and runs tests in one go.

## Mocking

E2E tests should remain as close as possible to production, but sometimes mocking is necessary.

Only mocking entire files is supported at the moment, so you may need to reorganize functions. To mock a file, create a new one with the same name and extension `mock.ts` (e.g. `AnimatedHeader.ts` -> `AnimatedHeader.mock.ts`) in the same directory. The metro bundler will override any file that has a `mock.ts` equivalent in Detox runs.

Android native views based on jetpack compose and libraries utilizing long-running asynchronouse background processes like sentry are not supported by detox currently. Imports mocking is unfortunately not supported by detox yet. If such problems occur, the entire component using problematic library needs to be mocked or a component exposing only targeted library needs to be created and then it can be mocked, precisely replacing only targeted library.

To mock a component for specific platform follow this pattern:
iOS: `AnimatedHeader.ts` -> `AnimatedHeader.ios.mock.ts`
Android: `AnimatedHeader.ts` -> `AnimatedHeader.android.mock.ts`

Read more here https://wix.github.io/Detox/docs/guide/mocking/
