# Uniswap Mobile

The home of the official Uniswap mobile app for iOS and Android!

[![codecov](https://codecov.io/gh/Uniswap/mobile/branch/main/graph/badge.svg?token=YVT2Y86O82)](https://codecov.io/gh/Uniswap/mobile)

## Development

### Setup

I (@judo) recommend setting up your M1 Mac without Rosetta: [link](https://medium.com/@davidjasonharding/developing-a-react-native-app-on-an-m1-mac-without-rosetta-29fcc7314d70).

#### Download environment variables

API keys are stored in [GitHub secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets) and included in GitHub actions. To run the app locally you need to download the environment variables onto your machine. You first need to make sure you have access to the 1password engineer vault and you need to [download the 1Password CLI](https://developer.1password.com/docs/cli/get-started#install). Then you can copy the local environment variables onto your own computer by running `yarn env:local:download`.

For instructions on how to update environment variables see [Updating Secret Env Variables section](#updating-secret-env-variables).

#### Updating secret environment variables

Things like API keys must not be checked into GitHub. They should be stored as a GH secret. They can be added to our repo on GH by following [these instructions](https://docs.github.com/en/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository). In order for the production build of the app to use the correct environment variables you must ensure the following:

1. The variable is accessed with `process.env.SECRET_VARIABLE` ([example](https://github.com/Uniswap/mobile/blob/main/src/config.ts#L54))
2. The variable is added to the Fastlane workflow file ([example](https://github.com/Uniswap/mobile/blob/main/.github/workflows/fastlane.yml#L14))
3. Finally you should add them into your own .env.local file and then upload them to 1Password using the command `yarn env:local:upload`.

To understand why these steps are needed some additional reading is:

- [Using encrypted secrets in a workflow](https://docs.github.com/en/actions/security-guides/encrypted-secrets#using-encrypted-secrets-in-a-workflow)
- Then they are made available to the bundled code with [this Babel plugin](https://babeljs.io/docs/en/babel-plugin-transform-inline-environment-variables/)

Developers will need to redownload the new file using `yarn env:local:download`.

#### React Native

Follow the general [React Native setup instructions](https://reactnative.dev/docs/environment-setup) but make sure to follow these steps before completing the instructions:

1. After installing Node: also install NVM to help you manage versions. Use the latest v14.x
2. Install yarn: `npm install --global yarn`
3. Before installing cocoapods: install RBEnv and use it to install Ruby v3 globally. When installing cocoapods, follow the non-sudo instructions.

#### Contract ABI types

Before the code will compile you need to generate types for the smart contracts the wallet interacts with. Run `yarn contracts:compile`. Re-run this if the ABIs or uniswap sdk libs are ever changed.

#### Cocoapods and Disabling Flipper Inclusion

We do not check in Flipper into source. To prevent `pod install` from adding Flipper, set an environment variable in your `.bash_profile` or `.zshrc`:

```
# To enable flipper inclusion (optional)
export USE_FLIPPER=1
```

- Run `yarn` to install packages, then run `yarn pod` in the main directory.

#### Updating and adding packages to the mobile app

To prevent automatic updates on new and old packages we pin the packages' version to the semver we want. This is done for security purposes as a new/upgraded package version may include backdoors or other attacks that may lead to a lost of funds so we want to be intentional about upgrading packages.

Steps to add/upgrade a new package to our app:

**Ask our security team first!** It's important you check with the security team in our #team-security Slack channel before adding or updating packages in the app. Once they give you the green light feel free to follow the next steps:

Upgrade: `yarn upgrade package-name@version`

Add: `yarn add package-name@version`


### Important Libraries

Get familiar with the following (no particular order):

- [Redux](https://redux.js.org/) and [Redux Toolkit](https://redux-toolkit.js.org/): state management
- [redux-saga](https://redux-saga.js.org/) & [typed-redux-saga](https://github.com/agiledigital/typed-redux-saga): Redux side effect manager -- used for complex/stateful network calls
- [ethers](https://docs.ethers.io/v5/)
- [Shopify/restyle](https://github.com/Shopify/restyle): UI framework
- [React navigation](https://reactnavigation.org/): routing and navigation with animations and gestures
- [react-i18next](https://react.i18next.com/): i18n

#### Storybook

See [stories/README.md](https://github.com/Uniswap/mobile/tree/main/src/stories/README.md)

### Running

Start the mobile app by running `yarn ios` or `yarn android`. The JS bundler (metro) should automatically open in a new terminal window. If it does not, start it manually with `yarn start`.

You can also run the app from Xcode, which is necessary for any Swift related changes. Xcode will automatically start the metro bundler.

To run the app on device:

1. Ask to be added to the Apple Developer team and ensure that you have access to "Certificates, Identifiers & Profiles".
2. Then, add the Apple ID associated with your developer account in Xcode > Preferences > Accounts. You should see `Universal Navigation Inc.` as a Team.
3. In Xcode, navigate to `Signing & Capabilities` in project settings and select `Universal Navigation Inc.` as the team with `Automatically manage signing` checked. This should generate and download all necessary development signing certificates.

### Migrations

We use `redux-persist` to persist Redux state between user sessions. When the Redux state schema is altered, a migration may be needed to transfer the existing persisted state to the new Redux schema. Failing to define a migration results in the app defaulting to the persisted schema, which will very likely cause `undefined` errors because the code has references to Redux state properties that were dropped in favor the the persisted schema.

#### When to define a migration

Anytime a required property is added or any property is renamed or deleted to/from Redux state. Migrations are not necessary when optional properties are added to an existing slice. Make sure to always add new required properties to the `schema.ts` file as well.

#### How to migrate

1. Increment the `version` of `persistConfig` defined within `store.ts`
2. Create a migration function within `migrations.ts`. The migration key should be the same as the `version` defined in the previous step
3. Write a test for your migration within `migrations.test.ts`
4. Create a new schema within `schema.ts` and ensure it is being exported by the `getSchema` function at the bottom of the file

### Troubleshooting

- `unable to open file (in target "OneSignalNotificationServiceExtension" in project "Uniswap")`. Resolve this issue by navigating to the `ios/` directory and running `pod update`.

### I18n

Stubs for new i18n strings used throughout the app can be generated automatically. Use the string as you would normally (e.g. `t('id')`) and then run `yarn i18n:extract`.
If Typescript in VSCode is slow to see the change, you can restart the typescript server.

### E2E Tests

See [e2e/README.md](e2e/README.md)

## Deployment

A [Github workflow runs a Fastlane build and deploy](https://github.com/Uniswap/mobile/blob/main/.github/workflows/fastlane.yml) at 2AM UTC everyday from M-F.

Deploys can also be triggered by running the [`Fastlane deploy iOS` workflow manually](https://github.com/Uniswap/mobile/actions/workflows/fastlane.yml)

### GraphQL

See [data/README.md](./src/data/README.md)
