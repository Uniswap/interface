import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { L2_CHAIN_IDS } from 'constants/chains'
import { useMemo } from 'react'

import { useUserSlippageToleranceWithDefault } from '../state/user/hooks'
import { useActiveWeb3React } from './web3'

const V2_SWAP_DEFAULT_SLIPPAGE = new Percent(50, 10_000) // .50%
const V3_SWAP_DEFAULT_SLIPPAGE = new Percent(50, 10_000) // .50%
const ONE_TENTHS_PERCENT = new Percent(10, 10_000) // .10%

export default function useSwapSlippageTolerance(
  trade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType> | undefined
): Percent {
  const { chainId } = useActiveWeb3React()
  const onL2 = chainId && L2_CHAIN_IDS.includes(chainId)
  const defaultSlippageTolerance = useMemo(() => {
    if (!trade || onL2) return ONE_TENTHS_PERCENT
    if (trade instanceof V2Trade) return V2_SWAP_DEFAULT_SLIPPAGE
    return V3_SWAP_DEFAULT_SLIPPAGE
  }, [onL2, trade])
  return useUserSlippageToleranceWithDefault(defaultSlippageTolerance)
}
