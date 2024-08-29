## Migrations

We use `redux-persist` to persist Redux state between user sessions.

If you're making a change that alters the structure or types of the Redux state, consider whether existing state stored in users' browsers will still be compatible with the new types. If compatibility could be broken, you may need to create a migration function that can convert the existing state into a format that's compatible with the new types.

Alternatively, consider using Jotai's `atomWithStorage` for state persistence that doesn't require manual migration functions for incompatible state updates.

### When to define a migration

Anytime a required property is added, or any property is renamed or deleted to/from Redux state. Migrations are not necessary when optional properties are added to an existing slice. Make sure to always add new required properties to the `reducer.ts` UserState as well (and `reducerTypeTest.ts` for testing).

### How to migrate

1. Increment the `version` of `persistConfig` defined within `apps/web/src/state/index.ts`
2. Write your migration function (and corresponding test) in `migrations/`. The migration key should be the same as the `version` defined in the previous step
3. Add the new migration function to the `migrations` MigrationManifest defined within `migrations.ts`.
4. Increment the persisted `version` of the `defaultState` mock test state in `migrations.test.ts`

   **Example migration:** https://github.com/Uniswap/interface/pull/7584
