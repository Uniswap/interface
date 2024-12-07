import { RuleTester } from 'eslint'
import sortMapKeys from './custom-map-sort'

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
})

ruleTester.run('sort-map-keys', sortMapKeys, {
  valid: [
    {
      code: `
        const map = new Map([
          [FeatureFlags.DisableFiatOnRampKorea, 'disable-fiat-onramp-korea'],
          [FeatureFlags.ExtensionAutoConnect, 'extension-auto-connect'],
          [FeatureFlags.ExtensionClaimUnitag, 'extension-claim-unitag'],
        ]);
      `,
    },
    {
      code: `
        const map = new Map([]);
      `,
    },
    {
      code: `
        const map = new Map([
          [FeatureFlags.DisableFiatOnRampKorea, 'disable-fiat-onramp-korea'],
        ]);
      `,
    },
  ],
  invalid: [
    {
      code: `
        const map = new Map([
          [FeatureFlags.ExtensionAutoConnect, 'extension-auto-connect'],
          [FeatureFlags.DisableFiatOnRampKorea, 'disable-fiat-onramp-korea'],
          [FeatureFlags.ExtensionClaimUnitag, 'extension-claim-unitag'],
        ]);
      `,
      errors: [
        {
          message:
            'Map keys should be sorted alphabetically. Correct order: DisableFiatOnRampKorea, ExtensionAutoConnect, ExtensionClaimUnitag',
        },
      ],
    },
  ],
})
