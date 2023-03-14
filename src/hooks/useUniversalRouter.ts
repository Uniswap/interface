import { TransactionResponse } from '@ethersproject/abstract-provider'
import { BigNumber } from '@ethersproject/bignumber'
import { t } from '@lingui/macro'
import { sendAnalyticsEvent } from '@uniswap/analytics'
import { SwapEventName } from '@uniswap/analytics-events'
import { Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { SwapRouter, UNIVERSAL_ROUTER_ADDRESS } from '@uniswap/universal-router-sdk'
import { FeeOptions, toHex } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import { formatSwapSignedAnalyticsEventProperties } from 'lib/utils/analytics'
import { useCallback } from 'react'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import isZero from 'utils/isZero'
import { swapErrorToUserReadableMessage } from 'utils/swapErrorToUserReadableMessage'

import { PermitSignature } from './usePermitAllowance'

class InvalidSwapError extends Error {}

interface SwapOptions {
  slippageTolerance: Percent
  deadline?: BigNumber
  permit?: PermitSignature
  feeOptions?: FeeOptions
}

export function useUniversalRouterSwapCallback(
  trade: Trade<Currency, Currency, TradeType> | undefined,
  fiatValues: { amountIn: number | undefined; amountOut: number | undefined },
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
        console.warn(gasError)
        throw new Error('Your swap is expected to fail')
      }
      const gasLimit = calculateGasMargin(gasEstimate)
      const response = await provider
        .getSigner()
        .sendTransaction({ ...tx, gasLimit })
        .then((response) => {
          sendAnalyticsEvent(
            SwapEventName.SWAP_SIGNED,
            formatSwapSignedAnalyticsEventProperties({ trade, fiatValues, txHash: response.hash })
          )
          if (tx.data !== response.data) {
            sendAnalyticsEvent(SwapEventName.SWAP_MODIFIED_IN_WALLET, { txHash: response.hash })
            throw new InvalidSwapError(
              t`Your swap was modified through your wallet. If this was a mistake, please cancel immediately or risk losing your funds.`
            )
          }
          return response
        })
      return response
    } catch (swapError: unknown) {
      if (swapError instanceof InvalidSwapError) throw swapError
      throw new Error(swapErrorToUserReadableMessage(swapError))
    }
  }, [
    account,
    chainId,
    fiatValues,
    options.deadline,
    options.feeOptions,
    options.permit,
    options.slippageTolerance,
    provider,
    trade,
  ])
}
