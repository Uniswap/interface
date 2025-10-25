/**
 * SwapRouter02 Call Parameters Generator
 *
 * Generates calldata for SwapRouter02 contract (v3-periphery)
 * This is a simpler alternative to UniversalRouter for V3-only swaps.
 */

import { BigNumber } from '@ethersproject/bignumber'
import { Percent, TradeType } from '@uniswap/sdk-core'
import { Route, SwapRouter as SwapRouterSDK } from '@uniswap/v3-sdk'
import { ClassicTrade } from 'state/routing/types'

interface SwapOptions {
  slippageTolerance: Percent
  deadline?: BigNumber
  recipient: string
}

interface MethodParameters {
  calldata: string
  value: string
}

/**
 * Generates SwapRouter02 calldata for a V3 trade
 * Supports exactInput and exactOutput for single and multi-hop swaps
 */
export function swapRouter02CallParameters(trade: ClassicTrade, options: SwapOptions): MethodParameters {
  const { slippageTolerance, deadline, recipient } = options

  // SwapRouter02 supports both V2 and V3, but we only use V3 routes here
  // For Taiko, we only have V3 pools, so this is sufficient

  if (trade.routes.length === 0) {
    throw new Error('No routes available for swap')
  }

  // Use the SDK's SwapRouter to generate calldata
  // This works with SwapRouter02 contract
  const params = SwapRouterSDK.swapCallParameters([trade], {
    slippageTolerance,
    recipient,
    deadlineOrPreviousBlockhash: deadline?.toString(),
  })

  return {
    calldata: params.calldata,
    value: params.value,
  }
}
