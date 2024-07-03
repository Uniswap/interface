import { ChainId, SUPPORTED_CHAINS } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { Trans } from 'i18n'
import type { ReactNode } from 'react'

export const FEE_AMOUNT_DETAIL: Record<
  FeeAmount,
  { label: string; description: ReactNode; supportedChains: readonly ChainId[] }
> = {
  [FeeAmount.LOWEST]: {
    label: '0.01',
    description: <Trans i18nKey="fee.bestForVeryStable" />,
    supportedChains: SUPPORTED_CHAINS,
  },
  [FeeAmount.LOW]: {
    label: '0.05',
    description: <Trans i18nKey="fee.bestForStablePairs" />,
    supportedChains: SUPPORTED_CHAINS,
  },
  [FeeAmount.MEDIUM]: {
    label: '0.3',
    description: <Trans i18nKey="fee.bestForMost" />,
    supportedChains: SUPPORTED_CHAINS,
  },
  [FeeAmount.HIGH]: {
    label: '1',
    description: <Trans i18nKey="fee.bestForExotic" />,
    supportedChains: SUPPORTED_CHAINS,
  },
}
