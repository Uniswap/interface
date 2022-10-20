# Force Upgrade

The ability of having users force upgrading our app allows us to stop critical UX and security bugs from reaching a wide audience.
By defining a mininum version all users need to be in, this component will block usage of the app and redirect users to the app store for
upgrading the app.

## Schema

This module relies on the following schema:

```javascript
force_upgrade: {
  minVersion: 'semVer.buildVersion',
  status: 'recommended' | 'required',
}
```

- `semVer.buildVersion` is how we define the full version of our app. You can currently get it by calling `getFullAppVersion()` in [src/utils/version.ts](https://github.com/Uniswap/mobile/blob/main/src/utils/version.ts)
- `status`:
  - A `recommended` status will display a dismissable dialog suggesting an upgrade
  - A `required` status will display a fixed dialog asking for an upgrade. The user's only option will be to navigate out to the app store to upgrade the app. In the case the user doesn't want to continue using the app they can retrieve their seed phrase to get their funds back.

### Future

- Once we have an Android app we could add a `platform` field or if we foresee iOS and Android being in different min versions we could create a new flag for Android.

## Flow

1. At app start we first check if the `status` is either `recommended` or `required`. If it's not we stop the process.
1. After a successful status check, we check if the `minVersion` specified is higher than the current version of the app:
    - If `minVersion` > `appVersion` we proceed to show a dialog to ask users to force upgrade with a link to the app store
    - If `minVersion` <= `appVersion` we stop the process, no need to force upgrade

## Setup

Since Amplitude is the library of choice to manage feature flags, we'll use it to setup the force upgrade schema and control it's state.

You can find the flag definition [here](https://experiment.amplitude.com/uniswap/409629/config/10144/configure).

Steps to set it up and have it live in production:

1. In the *Variants* section you can edit the `Payload` field and define a new `minVersion` and `status`. **Note**: Pay attention to good spelling of the `status` field. It will not break implementation but you will not see the force upgrade modal come up :)
    - Finding the version you want users to upgrade to is a matter of finding the commit that introduced the vulnerability and then finding the closes commit that updated the app version, similar to [this one}(https://github.com/Uniswap/mobile/pull/1981)
2. Once the payload is defined you can scroll down to *All Non-Targeted Users* and choose the *Percentage Rollout* you want for the flag. In this case it should always be 100% since we don't want some users to not have the fixed version
3. At this point you're ready to turn the flag on using the toggle at the Top Right of the screen. Make sure it's in the `Active` state, refresh the app and you should see the Force Upgrade modal come up :)

**Note**: This feature is disabled in `__DEV__` mode. For testing purposes you can comment out the code [here](https://github.com/Uniswap/mobile/blob/237d50bc7b05bb50c45f421274980ceb86a54898/src/features/forceUpgrade/forceUpgradeApi.ts#L26) and bypass the `__DEV__` check:

```javascript
// if (__DEV__) {
//  return { data: UpgradeStatus.NotRequired }
//}
```

For a visual on this setup you can watch this recorded session by @judo and @dalmendray here: https://drive.google.com/file/d/18zWzmy6QxLh5TW9P5kOPTB59DgOhqHJ6/view?usp=sharing

## UI

[ForceUpgradeModal](https://github.com/Uniswap/mobile/blob/main/src/components/forceUpgrade/ForceUpgradeModal.tsx)
