import { Trans } from '@lingui/macro'
import { FeeAmount } from '@uniswap/v3-sdk'
import { ReactNode } from 'react'

export const FeeAmountLabel: Record<FeeAmount, { label: string; description: ReactNode }> = {
  [FeeAmount.VERY_LOW]: {
    label: '0.01',
    description: <Trans>Best for very stable pairs.</Trans>,
  },
  [FeeAmount.LOW]: {
    label: '0.05',
    description: <Trans>Best for stable pairs.</Trans>,
  },
  [FeeAmount.MEDIUM]: {
    label: '0.3',
    description: <Trans>Best for most pairs.</Trans>,
  },
  [FeeAmount.HIGH]: {
    label: '1',
    description: <Trans>Best for exotic pairs.</Trans>,
  },
}
