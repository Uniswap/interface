# Uniswap Mobile

The home of the official Uniswap mobile app for iOS and Android!

## Development

### Setup

#### Package Manager

Install the [yarn package manager](https://yarnpkg.com/getting-started/install) for Javascript,

#### React Native

Follow the general [React Native setup instructions](https://reactnative.dev/docs/environment-setup) with the following additional (optional) recommendations:

1. After installing Node: also install NVM to help you manage versions. Use the latest v14.x
2. Before installing cocoapods: install RBEnv and use it to install Ruby v3 globally. When installing cocoapods, follow the non-sudo instructions.

#### Contract ABI types

Before the code will compile you need to generate types for the smart contracts the wallet interacts with. Run `yarn contracts:compile`. Re-run this if the ABIs or uniswap sdk libs are ever changed.

#### Cocoapods and Disabling Flipper Inclusion

We do not check in Flipper into source. To prevent `pod install` from adding Flipper, set an environment variable in your `.bash_profile` or `.zshrc`:

```
# To disable flipper inclusion
export GITHUB_WORKFLOW=1
```

Run `yarn` to install packages, then run `pod install` in the `/ios` directory. 

### Running

Start the mobile app by running `yarn ios` or `yarn android`. The JS bundler (metro) should automatically open in a new terminal window. If it does not, start it manually with `yarn start`.

### I18n

Stubs for new i18n strings used throughout the app can be generated automatically. Use the string as you would normally (e.g. `t('id')`) and then run `yarn i18n:extract`.
If Typescript in VSCode is slow to see the change, you can restart the typescript server.

### E2E Tests

The e2e tests use [detox](https://github.com/wix/Detox). To run them, you need to build:

```
detox build --configuration ios
```

And then run:

```
detox test --configuration ios
```
