# Force Upgrade

The ability of having users force upgrading our app allows us to stop critical UX and security bugs from reaching a wide audience.
By defining a mininum version all users need to be in, this component will block usage of the app and redirect users to the app store for
upgrading the app.

## Schema

This module relies on the following schema + StatSig's SDK automatically passes the version number of the app.

```javascript
force_upgrade: {
  status: 'recommended' | 'required' | 'not_required',
}
```

- `status`:
  - A `recommended` status will display a dismissable dialog suggesting an upgrade
  - A `required` status will display a fixed dialog asking for an upgrade. The user's only option will be to navigate out to the app store to upgrade the app. In the case the user doesn't want to continue using the app they can retrieve their seed phrase to get their funds back.

## Flow

1. At app start we first check if the `status` is either `recommended` or `required`. If it's not we stop the process.
2. We set the force upgrade modal's visibility and dismissability depending on the `status`.

## UI

[ForceUpgradeModal](https://github.com/Uniswap/universe/blob/main/apps/mobile/src/components/forceUpgrade/ForceUpgradeModal.tsx)
