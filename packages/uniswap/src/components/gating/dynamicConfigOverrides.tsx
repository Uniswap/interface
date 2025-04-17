import { ComponentProps } from 'react'
import { DynamicConfigDropdown } from 'uniswap/src/components/gating/DynamicConfigDropdown'

type DynamicConfigOptions = ComponentProps<typeof DynamicConfigDropdown>['options']

export const EMBEDDED_WALLET_BASE_URL_OPTIONS: DynamicConfigOptions = [
  {
    value: 'https://app.uniswap.org',
    label: 'app.uniswap.org',
  },
  {
    value: 'https://ew.unihq.org',
    label: 'ew.unihq.org',
  },
  {
    value: 'https://staging.ew.unihq.org',
    label: 'staging.ew.unihq.org',
  },
  {
    value: 'https://dev.ew.unihq.org',
    label: 'dev.ew.unihq.org',
  },
  {
    value: 'https://dev1.ew.unihq.org',
    label: 'dev1.ew.unihq.org',
  },
  {
    value: 'https://dev2.ew.unihq.org',
    label: 'dev2.ew.unihq.org',
  },
  {
    value: 'https://dev3.ew.unihq.org',
    label: 'dev3.ew.unihq.org',
  },
  {
    value: 'https://dev4.ew.unihq.org',
    label: 'dev4.ew.unihq.org',
  },
]
