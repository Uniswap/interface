import { TransactionResponse } from '@ethersproject/abstract-provider'
import { BigNumber } from '@ethersproject/bignumber'
import { Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { SwapRouter, UNIVERSAL_ROUTER_ADDRESS } from '@uniswap/universal-router-sdk'
import { FeeOptions, toHex } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import { useCallback } from 'react'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import isZero from 'utils/isZero'
import { swapErrorToUserReadableMessage } from 'utils/swapErrorToUserReadableMessage'

import { PermitSignature } from './usePermitAllowance'

interface SwapOptions {
  slippageTolerance: Percent
  deadline?: BigNumber
  permit?: PermitSignature
  feeOptions?: FeeOptions
}

export function useUniversalRouterSwapCallback(
  trade: Trade<Currency, Currency, TradeType> | undefined,
  options: SwapOptions
) {
  const { account, chainId, provider } = useWeb3React()

  return useCallback(async (): Promise<TransactionResponse> => {
    try {
      if (!account) throw new Error('missing account')
      if (!chainId) throw new Error('missing chainId')
      if (!provider) throw new Error('missing provider')
      if (!trade) throw new Error('missing trade')

      const { calldata: data, value } = SwapRouter.swapERC20CallParameters(trade, {
        slippageTolerance: options.slippageTolerance,
        deadlineOrPreviousBlockhash: options.deadline?.toString(),
        inputTokenPermit: options.permit,
        fee: options.feeOptions,
      })
      const tx = {
        from: account,
        to: UNIVERSAL_ROUTER_ADDRESS(chainId),
        data,
        // TODO: universal-router-sdk returns a non-hexlified value.
        ...(value && !isZero(value) ? { value: toHex(value) } : {}),
      }

      let gasEstimate: BigNumber
      try {
        gasEstimate = await provider.estimateGas(tx)
      } catch (gasError) {
        await provider.call(tx) // this should throw the actual error
        throw new Error('unexpected issue with gas estimation; please try again')
      }
      const gasLimit = calculateGasMargin(gasEstimate)
      const response = await provider.getSigner().sendTransaction({ ...tx, gasLimit })
      return response
    } catch (swapError: unknown) {
      const message = swapErrorToUserReadableMessage(swapError)
      throw new Error(message)
    }
  }, [
    account,
    chainId,
    options.deadline,
    options.feeOptions,
    options.permit,
    options.slippageTolerance,
    provider,
    trade,
  ])
}
