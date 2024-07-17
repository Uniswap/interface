# Wallet State

## Migrations

We use `redux-persist` to persist the Redux state between user sessions. When the Redux state schema is altered, a migration may be needed to transfer the existing persisted state to the new Redux schema. Failing to define a migration results in the app defaulting to the persisted schema, which will very likely cause `undefined` errors because the code has references to Redux state properties that were dropped in favor the persisted schema.

The mobile app and the extension share most of the redux state, but there are also some slices that are only present in one of the two apps.

When writing migrations, you'll need to confirm whether both apps need a migration or just one of them.

### When to define a migration

Anytime a required property is added or any property is renamed or deleted to/from Redux state. Migrations are not necessary when optional properties are added to an existing slice. Make sure to always add new required properties to the `schema.ts` file as well.

### How to migrate

1. Increment the `MOBILE_STATE_VERSION` and/or `EXTENSION_STATE_VERSION` of `persistConfig` defined in `mobile/src/app/migrations.ts` and `extension/src/store/migrations.ts`.
2. Create a migration function within `migrations.ts`. The migration key should be the same as the `version` defined in the previous step.
3. Write a test for your each of your migrations within `migrations.test.ts` (you will need to write separate tests for each app).
4. Create a new schema within `schema.ts` for each app and ensure it is being exported by the `getSchema` function at the bottom of the file.
