import { Trans } from '@lingui/macro'
import { ChainId, SUPPORTED_CHAINS } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import type { ReactNode } from 'react'

import { TAIKO_HOODI_CHAIN_ID, TAIKO_MAINNET_CHAIN_ID } from 'config/chains'

export const FEE_AMOUNT_DETAIL: Record<
  FeeAmount,
  { label: string; description: ReactNode; supportedChains: readonly ChainId[] }
> = {
  [FeeAmount.LOWEST]: {
    label: '0.01',
    description: <Trans>Best for very stable pairs.</Trans>,
    supportedChains: [
      ChainId.ARBITRUM_ONE,
      ChainId.BNB,
      ChainId.CELO,
      ChainId.CELO_ALFAJORES,
      ChainId.MAINNET,
      ChainId.OPTIMISM,
      ChainId.POLYGON,
      ChainId.POLYGON_MUMBAI,
      ChainId.AVALANCHE,
      ChainId.BASE,
      TAIKO_MAINNET_CHAIN_ID,
      TAIKO_HOODI_CHAIN_ID,
    ],
  },
  [FeeAmount.LOW]: {
    label: '0.05',
    description: <Trans>Best for stable pairs.</Trans>,
    supportedChains: [...SUPPORTED_CHAINS, TAIKO_MAINNET_CHAIN_ID, TAIKO_HOODI_CHAIN_ID],
  },
  [FeeAmount.MEDIUM]: {
    label: '0.3',
    description: <Trans>Best for most pairs.</Trans>,
    supportedChains: [...SUPPORTED_CHAINS, TAIKO_MAINNET_CHAIN_ID, TAIKO_HOODI_CHAIN_ID],
  },
  [FeeAmount.HIGH]: {
    label: '1',
    description: <Trans>Best for exotic pairs.</Trans>,
    supportedChains: [...SUPPORTED_CHAINS, TAIKO_MAINNET_CHAIN_ID, TAIKO_HOODI_CHAIN_ID],
  },
}
