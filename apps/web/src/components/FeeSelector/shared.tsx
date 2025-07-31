import { FeeAmount } from '@uniswap/v3-sdk'
import { getFeeTierTitle } from 'components/Liquidity/utils/feeTiers'
import type { ReactNode } from 'react'
import { ALL_EVM_CHAIN_IDS } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export const FEE_AMOUNT_DETAIL: Record<
  FeeAmount,
  { label: string; description?: ReactNode; supportedChains: readonly UniverseChainId[] }
> = {
  [FeeAmount.LOWEST]: {
    label: '0.01',
    description: getFeeTierTitle(FeeAmount.LOWEST),
    supportedChains: ALL_EVM_CHAIN_IDS,
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
    description: getFeeTierTitle(FeeAmount.LOW),
    supportedChains: ALL_EVM_CHAIN_IDS,
  },
  [FeeAmount.MEDIUM]: {
    label: '0.3',
    description: getFeeTierTitle(FeeAmount.MEDIUM),
    supportedChains: ALL_EVM_CHAIN_IDS,
  },
  [FeeAmount.HIGH]: {
    label: '1',
    description: getFeeTierTitle(FeeAmount.HIGH),
    supportedChains: ALL_EVM_CHAIN_IDS,
  },
}
