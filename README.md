## 🍔 TLDR

To run the extension:

- run `yarn`, run `yarn start:ext`
- [Add the extension to your browser](#run-extension-in-chrome)

## ⚡️ Tech

- Yarn
- TypeScript
- react-native
- Expo
- NextJS
- Solito
- Tamagui
- Storybook
- Jest, testing-library
- Turbo

## 🔥 About & Motivation

This is a monorepo for an Expo + NextJS app ⚡️ (forked from <https://github.com/pax-k/pax-react-native-starter/blob/main/README.md>)

While our main objective is to develop a mobile app, now thanks to [Solito](https://solito.dev/) and [Tamagui](https://tamagui.dev/) we can target the web also. Just Tamagui alone brings great value due to its performance and [theme-ui](https://theme-ui.com/) styles, while Solito provides cross-platform navigation.

react-native development is a bit tedious compared to web development, requiring testing on different platforms (iOS, Android), different OS versions, and different screen sizes. Even the processes of app building, submission and updating can get complicated without Expo. This is why this repo aims to easen the effort when it comes to native development, while implementing quality checks and CI/CD flows.

In this regard, the main reason for choosing to have web compatibility is the Developer Experience. From my personal experience building react-native apps, working with just the Simulator to build UIs can get frustrating, like when debugging with an attached Chrome Dev Tools instance (can't use Inspect Element on DIVs to tinker with styles, for example) or using the in-app injected Debugger (sort of a dumbed down Dev Tools, not really productive). But with this stack, we can build our mobile app using the browser, as you would do with a normal web app. Sure, one might implement mobile-specific features which won't work on web, so in this case they have to be properly handled, but in our case we're more interested to use a browser for UI development especially. There are some [unsupported react-native APIs](https://necolas.github.io/react-native-web/docs/react-native-compatibility/) in react-native-web, which is used by NextJS and Storybook, but as long as we don't hit these limitations, we can continue using web.

Another good reason is Tamagui itself. It has [the best performance](https://tamagui.dev/docs/intro/benchmarks) compared to any other react-native UI libs.

Another reason for organizing everything in a monorepo is because we're targeting 2 different platforms (web & mobile), each having its own config. Overall, we're keeping each package clean of unwanted dependencies and with their own specific structure and configuration that are easy to follow.

This monorepo is the result of:

- initial scaffold using `npm create tamagui` (see the [docs](https://tamagui.dev/))
- getting some inspiration from `tamagui-kitchen-sync` for adding Storybook to it ([link](https://github.com/dohomi/tamagui-kitchen-sink))
- adding `turbo` as a build and task runner cache system ([link](https://turbo.build/repo))
- using `Yarn Workspaces` with plugins ([docs](https://classic.yarnpkg.com/lang/en/docs/workspaces/))
- tweaking `tsconfig.json` and `package.json` for each workspace package to glue them together nicely with TypeScript Project References and Path Aliases ([docs](https://www.typescriptlang.org/docs/handbook/project-references.html)). One useful trick was to define path aliases with the same name as the ones defied by the workspace packages; this way, the code editor will jump on click to source, instead of node_modules
- setting up `build`, `format`, `lint`, `typecheck` for each package
- setting up `husky` with `pre-commit`, `commitlint` and `lint-staged` hooks
- setting up `semantic-release` for `apps/expo`
- getting some inspiration for Github Actions cache from `nextjs-monorepo-example` ([link](https://github.com/belgattitude/nextjs-monorepo-example/blob/main/.github/actions/yarn-nm-install/action.yml))
- setting up a productive development workflow involving Github Actions + Chromatic/Storybook + Expo EAS ([chromatic docs](https://chromatic.com/), [EAS docs](https://docs.expo.dev/eas/))
- overall nitting and bolting everything together, occasionally with some help from the fantastic Discord communities of Tamagui, Turbo and Expo

An easier alternative for setting up a monorepo would've been NX ([link](https://nx.dev/)), which I tried initially and didn't work out because:

- you can leverage the full power of NX only in its `integrated` mode and not in `package` mode
- integrated means you have only one root `package.json` + TS path aliases, and each app configuration is black-boxed behind NX custom config generators
- you lose the flexibility of running custom `package.json` commands for your internal packages
- if choosing package mode, you would be better off to ditch NX completely and manually configure Yarn + TypeScript + Turbo as I did
- NX enforces that each custom environment variable has to be prefixed with `NX_` while packages like `tamagui` expect exactly `TAMAGUI_TARGET` or `APP_VARIANT`
- overall, individual `package.json`s  with `dotenv` do the trick

## 🗂 Directory structure

- `apps`
  - `expo`
  - `next`
  - `storybook`
  - `tests`
- `packages` shared packages across apps
  - `app` you'll be importing most files from `app/`
    - `features` (don't use a `screens` folder, instead organize by feature). We should organize our code with respect to Domain Driven Design [(blog article)](https://www.angulararchitects.io/en/aktuelles/tactical-domain-driven-design-with-monorepos/)
    - `provider` (all the providers that wrap the app, and some no-ops for Web.)
    - `navigation` Next.js has a `pages/` folder. React Native doesn't. This folder contains navigation-related code for RN. You may use it for any navigation code, such as custom links.
  - `eslint-config-custom` as a global ESLint config, used in packages as `{ extends: ["custom", ...] }`
  - `tsconfig` for specific TypeScript configuration for each package
  - `ui` for our dumb UI components
  - `backend` - not yet in the project, but will host our Supabase PostgreSQL [Prisma](https://supabase.com/docs/guides/integrations/prisma) schemas, Deno edge [functions](https://supabase.com/docs/guides/functions) + optionally [tRPC](https://dev.to/noahflk/supabase-with-typescript-using-trpc-and-prisma-to-achieve-end-to-end-typesafety-1021). One useful backend feature will be to trigger user notifications. Can get some inspiration from the [T3 stack](https://create.t3.gg/)

The dependency graph looks like this:

![](/docs/dep-graph.png)

## 🛠️ Prerequisites for setting everything up

- create an Expo account and a new Expo team
- create a Turbo team
- create a Chromatic account
- search this project for "REPLACE-ME" and replace stuff accordingly
- go over [Prerequisites for development]() as described below and make sure everything works: running Storybook, running the app in Next, simulators, on your device with Expo
- go over [Setup Github Actions]() as described below
- create your first builds with Expo as described in [App variants]() below
- at this point you can safely start developing as described in [Workflow]() below: Github Actions, Chromatic updates and EAS Updates should work as expected

## 📱 App variants

- see [eas.json](apps/expo/eas.json)
- builds are real apps with different identifiers: `dev.com.REPLACE-ME`, `staging.com.REPLACE-ME`, `preview.com.REPLACE-ME`, see [app.config.ts](apps/expo/app.config.ts), [docs](https://docs.expo.dev/build/introduction/), [expo/package.json build commands](apps/expo/package.json)
- for first time builds, use:
  - `yarn build:all:dev`
  - `yarn build:all:staging`
  - `yarn build:all:preview`
- 2 platforms x 3 variants = 6 builds. They can be found [here](https://expo.dev/accounts/REPLACE-ME/projects/REPLACE-ME/builds)
- all builds should have `1.0.0` version. They should only be rebuilt when the runtime policy of `sdkVersion` kicks in, meaning when we're forced to update if the Expo SDK version changes, see [app.json](apps/expo/app.json), [docs](https://docs.expo.dev/eas-update/runtime-versions/#sdkversion-runtime-version-policy). What changes automatically after each release is `buildNumber` (for iOS) and `versionCode` (for Android)
- your team has to enable [Developer mode](https://docs.expo.dev/guides/ios-developer-mode/) to be able to run these apps
- updates to these apps are delivered via EAS Update [(docs)](https://docs.expo.dev/eas-update/introduction/), instead of always building new app versions on each release (the Expo free tier offers only 20 builds / month and 1000 updates, so we prefer leveraging EAS Updates)
- The Development app is useful only in tandem with `yarn start:devclient` to preview live changes from a developer's machine. Could be used for pair programming.
- The Staging app is updated on each opened PR. Useful for code reviews (limitation: 1 PR to be opened at a time)
- The Preview app is updated on each new git release (merges to main) and acts as an exact preview of the Production app (which hasn't been built yet) used for testing before an official release. Team demos use this app.

## 🎬 Github Actions setup

- set the following secrets
  - `CHROMATIC_PROJECT_TOKEN` - you can get one after you create a Chromatic project
  - `EXPO_TOKEN` - get it from your Expo account
  - `EXTENDED_GITHUB_TOKEN` - this is a Github Personal Access Token, get one from your account; needs write access. Used by semantic-release to push new tags
  - `SLACK_WEBHOOK` - a Slack webhook configured to route messages to a channel, from Github Actions
  - `TURBO_TEAM` - follow Turbo docs how to create a team
  - `TURBO_TOKEN` - see Turbo docs
- create the following environment variables:
  - for `staging` environment
    - `APP_VARIANT`=staging
    - `TAMAGUI_TARGET`=native
  - for `preview` environment
    - `APP_VARIANT`=preview
    - `TAMAGUI_TARGET`=native

## 👨🏻‍💻 Prerequisites for development

- install [Android Studio Emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- install [iOS Simulator](https://docs.expo.dev/workflow/ios-simulator/)
- install [Flipper](https://fbflipper.com/) (useful for debugging RN apps)
- join the Expo project (invites were sent)
- join the Chromatic project, [here](https://www.chromatic.com/builds?appId=63d3a6140eb623de94b96c97&inviteToken=25e1f92229924c418be9be4f3c64056d)
- install the development, staging & preview builds on your personal device, taken from [here](https://expo.dev/accounts/REPLACE-ME/projects/REPLACE-ME/builds)
![](docs/apps-screenshot.jpg)
- run `npm install -g eas-cli` . For more info check [EAS Build](https://docs.expo.dev/build/setup/)
- read the docs for [Expo](https://docs.expo.dev/), [Tamagui](https://tamagui.dev/), [Turbo](https://turbo.build/repo)

## 🏁 Start the app

- run `yarn` to install dependencies
- run `yarn start:expo` to start Expo
- run `yarn start:next` to start Next
- run `yarn start:sb` to start Storybook

## 🏋️ Workflow

![](docs/ci-cd-flow.png)

1. The developer creates a new branch off `main`
2. Starts Storybook `yarn start:sb` and Expo `yarn start:expo`

- mainly uses Chrome + Storybook for UI development in `packages/ui`
- can also use Chrome + NextJS for app logic development in `packages/app` - run `yarn start:next`
- checks his changes inside the iOS Simulator and Android Studio (press "i" / "a" in the console)
- checks the app on his real mobile device using the consle QR Code
- can share his changes live before opening a PR with other devs in 2 ways:
  - using Expo Go, by running `yarn start:tunnel` and sharing the QR code with others
  - using the Development Build Client (has to be installed by others), running `yarn start:devclient` and sharing the QR Code
  - the difference between these two is that the Development Build Client is more closer to the production app
- checks the minified app running `start:ios:prod` and `start:android:prod`. Same as `yarn start:expo`, but it's a minified and closer to production build. Sometimes you can catch some 3rd party lib bugs this way.

3. Commits his changes

- commit messages must respect the [conventional commit format](https://github.com/conventional-changelog/commitlint#what-is-commitlint), eg: `fix(login screen): adjusted font size`
- on commit, husky runs `npx lint-staged --allow-empty && yarn g:run-all-checks`, where the checks are: `turbo run typecheck lint test build --parallel --since=HEAD^1`

4. Pushes his changes and opens a new PR

- Gihub Actions kick in:
  - `ci-build-test.yml`: runs Typecheck, Lint, Format check, Build, Unit tests for all configured packages
  - `ci-monorepo-integrity.yml`: Check for duplicate dependencies and yarn constraints
  - `cd-chromatic.yml`: Deploys the Storybook to Chromatic to be reviewed by the team ❗️
  - `cd-eas-update-staging.yml`: Updates the Staging app to be reviewed by the team ❗️. Also a QR code is automaticallty generated in the PR comments and links to the Expo Go client.
- requires at least 1 reviewer to accept the PR

5. On merging the PR to `main`, the same Github Actions run again, with the following additional actions:

- `ci-semantic-release.yml`: Runs semantic-release which bumps the version of `apps/expo/package.json`, bumps `buildNumber` and `versionCode` for `apps/expo/app.json`, updates `apps/expo/CHANGELOG.md` by aggregating the conventional commit messages, creates a new git tag version and a new git release based on it. See [Releases](https://github.com/REPLACE-ME-io/REPLACE-ME/releases). Please join the `#REPLACE-ME-github` Slack channel for updates 📫
- `cd-eas-update-preview.yml`: Triggered by a new git release, updates the Preview app

## Run Extension in Chrome

1. Go to **chrome://extensions**
2. At the top right, turn on **Developer mode**
3. Click **Load unpacked**
4. Find and select the extension folder (Universe/apps/extension/dev)

## 🏎️ Performance

- we have yet to document the bundle size, but my memory recalls 1.9M for this barebone project
- Tamagui by itself delivers great performance with respect to style updates and animations, leaving others in dust
- Github Actions CI checks take around 10 minutes without Turbo cache, and around 2-3 minutes with Turbo cache
- Manual Expo Builds take around 10 minutes using the Free Trial (we anyway trigger new builds very rarely because we leverage CI EAS hot Updates instead). Putting this in context, building in CI by yourself with fastlane takes around 1H from my experience (yeah very debatable, but still).

## 📐 Mobile app architecture and other considerations

- which libs to use for state management and data fetching? [RTK](https://redux-toolkit.js.org/) handles both well in an integrated fashion. Jotai is another strong candidate, as it has [React-Query integration](https://jotai.org/docs/integrations/query) and [tRPC integration](https://jotai.org/docs/integrations/trpc) (we want to use tRPC on the backend)

### Pure JS dependencies

If you're installing a JavaScript-only dependency that will be used across platforms, install it in `packages/app`:

```sh
cd packages/app
yarn add date-fns
```

### Native dependencies

If you're installing a library with any native code, you must install it in `apps/expo`:

```sh
cd apps/expo
yarn add react-native-reanimated
```

## Notes

- this repo serves as a good starting point for development with Expo EAS, and will be improved in terms of workflow and tooling as we progress and discover new stuff that we might need, for example:
  - for Storybook, we might swap Webpack in favor of Vite or Turbopack because of the slow build time
  - better testing architecture? Right now `apps/tests` is configured to run user interaction tests with `testing-library` ([docs](https://reactnative.dev/docs/testing-overview#testing-user-interactions)). We might want to add Snapshot testing and E2E Detox tests. Or picking between moving `jest` to each individual package VS root jest config with `projects: [...]`. Not a priority right now.
  - Tamagui is being actively developed and sometimes breaking changes occur. We have to keep an eye on it.
  - Running Turbo with `--since=HEAD^1` should be refactored to select the PR's first commit hash instead
  - no concrete UI components have been developed up to this point, and we should develop them along with a custom [theme](https://tamagui.dev/docs/core/theme). We don't want to repeat text sizes, colors and spacings everywhere.
- missing from our workflow is the production [distribution of the app to stores](https://docs.expo.dev/submit/introduction/), and most probably it won't be integrated with Continous Deployment, because we want to control this sensible process manually. But we want to trigger Continous Deployment EAS Updates to the production app on pushing to a `production` branch, but hasn't been configured yet. There are some [Deployment patterns](https://docs.expo.dev/eas-update/deployment-patterns/) and we will pick one at the right time. Right now we're using `eas update --branch staging/preview` in our Github Actions which are linked to the `staging/preview` channels. These Expo branches shouldn't be confused with git branches: a build corresponds to a release channel, and these "branches" are pointed to channels. When using the `eas update` command, regardless of the git branch you're on, you can specify `--branch` so that your code can be routed to the specific channel. `--auto` sets the branch to the current git branch, but we're not using that.
- some tweaking is needed around file globs used in Turbo and Github Actions, to prevent running unnecessary commands (eg: it doesn't make sense to trigger a typecheck when only the README.md file was updated)
- we should be really careful when upgrading react, react-native, react-native-web, tamagui. Experience and public Github issues show us that things can break really easily for lots of people at once and often. Manual and automated tests are key.
- before going public, we should scan and update our dependencies with [Snyk](https://snyk.io/), update this readme with respect to Release Management and check again all permissions regarding this process

## FAQ

- if `yarn ios` or `npx pod-install` fails with:

    ```
    Couldn't install Pods. Updating the Pods project and trying again...
    Command `pod install` failed.
    └─ Cause: Invalid `Podfile` file:
    [!] Invalid `RNGestureHandler.podspec` file: undefined method `exists?' for File:Class.
    ```

    Check this <https://github.com/facebook/react-native/issues/35807#issuecomment-1378831502>

- devs are encouraged to update this section any time they run into unexpected problems

## TODO

[ ] Lint all file extensions including json (`lint: eslint .`)
[ ] Upgrade ethers 6.0
[ ] Define standard for checksumming addresses
