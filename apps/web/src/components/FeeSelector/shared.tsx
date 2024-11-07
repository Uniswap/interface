import { FeeAmount } from '@uniswap/v3-sdk'
import type { ReactNode } from 'react'
import { Trans } from 'uniswap/src/i18n'
import { COMBINED_CHAIN_IDS, UniverseChainId } from 'uniswap/src/types/chains'

export const FEE_AMOUNT_DETAIL: Record<
  FeeAmount,
  { label: string; description?: ReactNode; supportedChains: readonly UniverseChainId[] }
> = {
  [FeeAmount.LOWEST]: {
    label: '0.01',
    description: <Trans i18nKey="fee.bestForVeryStable" />,
    supportedChains: COMBINED_CHAIN_IDS,
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
    supportedChains: COMBINED_CHAIN_IDS,
  },
  [FeeAmount.MEDIUM]: {
    label: '0.3',
    description: <Trans i18nKey="fee.bestForMost" />,
    supportedChains: COMBINED_CHAIN_IDS,
  },
  [FeeAmount.HIGH]: {
    label: '1',
    description: <Trans i18nKey="fee.bestForExotic" />,
    supportedChains: COMBINED_CHAIN_IDS,
  },
}
