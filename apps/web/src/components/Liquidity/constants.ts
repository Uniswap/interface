import { FeeAmount, TICK_SPACINGS } from '@uniswap/v3-sdk'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

interface FeeDataWithChain {
  feeData: {
    feeAmount: FeeAmount
    tickSpacing: number
  }
  supportedChainIds?: UniverseChainId[]
}

export const defaultFeeTiers: Record<FeeAmount, FeeDataWithChain> = {
  [FeeAmount.LOWEST]: { feeData: { feeAmount: FeeAmount.LOWEST, tickSpacing: TICK_SPACINGS[FeeAmount.LOWEST] } },
  [FeeAmount.LOW_200]: {
    feeData: { feeAmount: FeeAmount.LOW_200, tickSpacing: TICK_SPACINGS[FeeAmount.LOW_200] },
    supportedChainIds: [UniverseChainId.Base],
  },
  [FeeAmount.LOW_300]: {
    feeData: { feeAmount: FeeAmount.LOW_300, tickSpacing: TICK_SPACINGS[FeeAmount.LOW_300] },
    supportedChainIds: [UniverseChainId.Base],
  },
  [FeeAmount.LOW_400]: {
    feeData: { feeAmount: FeeAmount.LOW_400, tickSpacing: TICK_SPACINGS[FeeAmount.LOW_400] },
    supportedChainIds: [UniverseChainId.Base],
  },
  [FeeAmount.LOW]: { feeData: { feeAmount: FeeAmount.LOW, tickSpacing: TICK_SPACINGS[FeeAmount.LOW] } },
  [FeeAmount.MEDIUM]: { feeData: { feeAmount: FeeAmount.MEDIUM, tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM] } },
  [FeeAmount.HIGH]: { feeData: { feeAmount: FeeAmount.HIGH, tickSpacing: TICK_SPACINGS[FeeAmount.HIGH] } },
} as const
