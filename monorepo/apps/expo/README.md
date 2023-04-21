# Example Expo App

## Old Variants Info

- see [eas.json](apps/expo/eas.json)
- builds are real apps with different identifiers: `dev.com.REPLACE-ME`, `staging.com.REPLACE-ME`, `preview.com.REPLACE-ME`, see [app.config.ts](apps/expo/app.config.ts), [docs](https://docs.expo.dev/build/introduction/), [expo/package.json build commands](apps/expo/package.json)
- for first time builds, use:
  - `yarn build:all:dev`
  - `yarn build:all:staging`
  - `yarn build:all:preview`
- all builds should have `1.0.0` version. They should only be rebuilt when the runtime policy of `sdkVersion` kicks in, meaning when we're forced to update if the Expo SDK version changes, see [app.json](apps/expo/app.json), [docs](https://docs.expo.dev/eas-update/runtime-versions/#sdkversion-runtime-version-policy). What changes automatically after each release is `buildNumber` (for iOS) and `versionCode` (for Android)
- your team has to enable [Developer mode](https://docs.expo.dev/guides/ios-developer-mode/) to be able to run these apps
- updates to these apps are delivered via EAS Update [(docs)](https://docs.expo.dev/eas-update/introduction/), instead of always building new app versions on each release (the Expo free tier offers only 20 builds / month and 1000 updates, so we prefer leveraging EAS Updates)
- The Development app is useful only in tandem with `yarn start:devclient` to preview live changes from a developer's machine. Could be used for pair programming.
- The Staging app is updated on each opened PR. Useful for code reviews (limitation: 1 PR to be opened at a time)
- The Preview app is updated on each new git release (merges to main) and acts as an exact preview of the Production app (which hasn't been built yet) used for testing before an official release. Team demos use this app.

## Old FAQ

- if `yarn ios` or `npx pod-install` fails with:

    ```
    Couldn't install Pods. Updating the Pods project and trying again...
    Command `pod install` failed.
    └─ Cause: Invalid `Podfile` file:
    [!] Invalid `RNGestureHandler.podspec` file: undefined method `exists?' for File:Class.
    ```

    Check this <https://github.com/facebook/react-native/issues/35807#issuecomment-1378831502>