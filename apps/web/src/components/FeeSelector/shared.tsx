import { FeeAmount } from '@uniswap/v3-sdk'
import type { ReactNode } from 'react'
import { Trans } from 'react-i18next'
import { ALL_CHAIN_IDS, UniverseChainId } from 'uniswap/src/features/chains/types'

export const FEE_AMOUNT_DETAIL: Record<
  FeeAmount,
  { label: string; description?: ReactNode; supportedChains: readonly UniverseChainId[] }
> = {
  [FeeAmount.LOWEST]: {
    label: '0.01',
    description: <Trans i18nKey="fee.bestForVeryStable" />,
    supportedChains: ALL_CHAIN_IDS,
  },
  [FeeAmount.LOW_200]: {
    label: '0.02',
    supportedChains: [UniverseChainId.Base],
  },
  [FeeAmount.LOW_300]: {
    label: '0.03',
    supportedChains: [UniverseChainId.Base],
  },
  [FeeAmount.LOW_400]: {
    label: '0.04',
    supportedChains: [UniverseChainId.Base],
  },
  [FeeAmount.LOW]: {
    label: '0.05',
    description: <Trans i18nKey="fee.bestForStablePairs" />,
    supportedChains: ALL_CHAIN_IDS,
  },
  [FeeAmount.MEDIUM]: {
    label: '0.3',
    description: <Trans i18nKey="fee.bestForMost" />,
    supportedChains: ALL_CHAIN_IDS,
  },
  [FeeAmount.HIGH]: {
    label: '1',
    description: <Trans i18nKey="fee.bestForExotic" />,
    supportedChains: ALL_CHAIN_IDS,
  },
}
