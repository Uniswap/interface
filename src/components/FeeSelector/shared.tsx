import { Trans } from '@lingui/macro'
import { FeeAmount } from '@uniswap/v3-sdk'
import { SupportedChainId } from 'constants/chains'
import { ReactNode } from 'react'

export const FEE_AMOUNT_DETAIL: Record<
  FeeAmount,
  { label: string; description: ReactNode; supportedChains: SupportedChainId[] | 'all' }
> = {
  [FeeAmount.VERY_LOW]: {
    label: '0.01',
    description: <Trans>Best for very stable pairs.</Trans>,
    supportedChains: [SupportedChainId.MAINNET],
  },
  [FeeAmount.LOW]: {
    label: '0.05',
    description: <Trans>Best for stable pairs.</Trans>,
    supportedChains: 'all',
  },
  [FeeAmount.MEDIUM]: {
    label: '0.3',
    description: <Trans>Best for most pairs.</Trans>,
    supportedChains: 'all',
  },
  [FeeAmount.HIGH]: {
    label: '1',
    description: <Trans>Best for exotic pairs.</Trans>,
    supportedChains: 'all',
  },
}
