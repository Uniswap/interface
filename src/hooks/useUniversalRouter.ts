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
import { trace } from 'tracing'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import isZero from 'utils/isZero'
import { didUserReject, swapErrorToUserReadableMessage } from 'utils/swapErrorToUserReadableMessage'

import { PermitSignature } from './usePermitAllowance'

/** Thrown when gas estimation fails. This class of error usually requires an emulator to determine the root cause. */
class GasEstimationError extends Error {
  constructor() {
    super(t`Your swap is expected to fail.`)
  }
}

/**
 * Thrown when the user modifies the transaction in-wallet before submitting it.
 * In-wallet calldata modification nullifies any safeguards (eg slippage) from the interface, so we recommend reverting them immediately.
 */
class ModifiedSwapError extends Error {
  constructor() {
    super(
      t`Your swap was modified through your wallet. If this was a mistake, please cancel immediately or risk losing your funds.`
    )
  }
}

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
    return trace(
      'swap.send',
      async ({ setTraceData, setTraceStatus, setTraceError }) => {
        try {
          if (!account) throw new Error('missing account')
          if (!chainId) throw new Error('missing chainId')
          if (!provider) throw new Error('missing provider')
          if (!trade) throw new Error('missing trade')

          setTraceData('slippageTolerance', options.slippageTolerance.toFixed(2))
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
            // TODO(https://github.com/Uniswap/universal-router-sdk/issues/113): universal-router-sdk returns a non-hexlified value.
            ...(value && !isZero(value) ? { value: toHex(value) } : {}),
          }

          let gasEstimate: BigNumber
          try {
            gasEstimate = await provider.estimateGas(tx)
          } catch (gasError) {
            setTraceStatus('failed_precondition')
            setTraceError(gasError)
            console.warn(gasError)
            throw new GasEstimationError()
          }
          const gasLimit = calculateGasMargin(gasEstimate)
          setTraceData('gasLimit', gasLimit.toNumber())
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
                throw new ModifiedSwapError()
              }
              return response
            })
          return response
        } catch (swapError: unknown) {
          if (swapError instanceof ModifiedSwapError) throw swapError

          // Cancellations are not failures, and must be accounted for as 'cancelled'.
          if (didUserReject(swapError)) setTraceStatus('cancelled')

          // GasEstimationErrors are already traced when they are thrown.
          if (!(swapError instanceof GasEstimationError)) setTraceError(swapError)

          throw new Error(swapErrorToUserReadableMessage(swapError))
        }
      },
      { tags: { is_widget: false } }
    )
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
