import { Percent } from '@uniswap/sdk-core'

import { useUserSlippageToleranceWithDefault } from '../state/user/hooks'

const SWAP_DEFAULT_SLIPPAGE = new Percent(50, 10_000) // .50%

export default function useSwapSlippageTolerance(): Percent {
  return useUserSlippageToleranceWithDefault(SWAP_DEFAULT_SLIPPAGE)
}
