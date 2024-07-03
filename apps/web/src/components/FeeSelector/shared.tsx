import { FeeAmount } from '@uniswap/v3-sdk'
import { Trans } from 'i18n'
import type { ReactNode } from 'react'
import { InterfaceChainId, WEB_SUPPORTED_CHAIN_IDS } from 'uniswap/src/types/chains'

export const FEE_AMOUNT_DETAIL: Record<
  FeeAmount,
  { label: string; description: ReactNode; supportedChains: readonly InterfaceChainId[] }
> = {
  [FeeAmount.LOWEST]: {
    label: '0.01',
    description: <Trans i18nKey="fee.bestForVeryStable" />,
    supportedChains: WEB_SUPPORTED_CHAIN_IDS,
  },
  [FeeAmount.LOW]: {
    label: '0.05',
    description: <Trans i18nKey="fee.bestForStablePairs" />,
    supportedChains: WEB_SUPPORTED_CHAIN_IDS,
  },
  [FeeAmount.MEDIUM]: {
    label: '0.3',
    description: <Trans i18nKey="fee.bestForMost" />,
    supportedChains: WEB_SUPPORTED_CHAIN_IDS,
  },
  [FeeAmount.HIGH]: {
    label: '1',
    description: <Trans i18nKey="fee.bestForExotic" />,
    supportedChains: WEB_SUPPORTED_CHAIN_IDS,
  },
}
