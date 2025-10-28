import { SwapConfigKey } from '@universe/gating'

/**
 * Shared gas configuration constants.
 * Values are in 10^-4 units relative to the chain's native currency decimals.
 * TODO(SWAP-559) plans to remove this -4 offset.
 */

/**
 * Generic L2 gas configuration used by most chains.
 * Individual chains can define their own config if they need different values.
 */
export const GENERIC_L2_GAS_CONFIG = {
  send: {
    configKey: SwapConfigKey.GenericL2SendMinGasAmount,
    default: 1, // .0001 ETH
  },
  swap: {
    configKey: SwapConfigKey.GenericL2SwapMinGasAmount,
    default: 8, // .0008 ETH
  },
} as const

/**
 * Solana-specific gas configuration.
 * Solana has 9 decimals and much lower fees than EVM chains.
 */
export const SOLANA_GAS_CONFIG = {
  send: {
    configKey: SwapConfigKey.SolanaSendMinGasAmount,
    default: 1, // .0001 SOL
  },
  swap: {
    configKey: SwapConfigKey.SolanaSwapMinGasAmount,
    default: 3, // .0003 SOL
  },
} as const
