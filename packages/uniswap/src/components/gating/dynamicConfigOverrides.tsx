import { ForceUpgradeStatus, ForceUpgradeTranslations } from '@universe/gating'
import { ComponentProps } from 'react'
import { DynamicConfigDropdown } from 'uniswap/src/components/gating/DynamicConfigDropdown'

type DynamicConfigOptions = ComponentProps<typeof DynamicConfigDropdown>['options']

export const EMBEDDED_WALLET_BASE_URL_OPTIONS: DynamicConfigOptions = [
  {
    value: 'https://app.uniswap.org',
    label: 'app.uniswap.org (prod)',
  },
  {
    value: 'https://app.corn-staging.com',
    label: 'app.corn-staging.com (staging)',
  },
  {
    value: 'https://dev.ew.unihq.org',
    label: 'dev.ew.unihq.org (dev)',
  },
]

export const FORCE_UPGRADE_STATUS_OPTIONS: DynamicConfigOptions = [
  {
    label: 'No Upgrade',
    value: 'not-required' satisfies ForceUpgradeStatus,
  },
  {
    label: 'Soft Upgrade',
    value: 'recommended' satisfies ForceUpgradeStatus,
  },
  {
    label: 'Force Upgrade',
    value: 'required' satisfies ForceUpgradeStatus,
  },
]

export const FORCE_UPGRADE_TRANSLATIONS_OPTIONS: DynamicConfigOptions = [
  {
    label: 'Default',
    jsonValue: {},
  },
  {
    label: 'Unichain (en-US and es-ES)',
    jsonValue: {
      'en-US': {
        title: 'Unichain is here!',
        description: 'Update to the latest version to use Unichain.',
      },
      'es-ES': {
        title: 'Unichain está aquí!',
        description: 'Actualiza a la última versión para usar Unichain.',
      },
    } satisfies ForceUpgradeTranslations,
  },
]
