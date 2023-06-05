import { TransactionResponse } from '@ethersproject/abstract-provider'
import { BigNumber } from '@ethersproject/bignumber'
import { t } from '@lingui/macro'
import { sendAnalyticsEvent, useTrace } from '@uniswap/analytics'
import { SwapEventName } from '@uniswap/analytics-events'
import { MulticallExtended, PaymentsExtended, SwapRouter, Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
//import { SwapRouter, UNIVERSAL_ROUTER_ADDRESS } from '@uniswap/universal-router-sdk'
import { FeeOptions } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import JSBI from 'jsbi'
import { formatSwapSignedAnalyticsEventProperties } from 'lib/utils/analytics'
import { useCallback } from 'react'
import { trace } from 'tracing/trace'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { UserRejectedRequestError } from 'utils/errors'
//import isZero from 'utils/isZero'
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
  smartPoolAddress?: string
}

export function useUniversalRouterSwapCallback(
  trade: Trade<Currency, Currency, TradeType> | undefined,
  fiatValues: { amountIn?: number; amountOut?: number },
  options: SwapOptions
) {
  const { account, chainId, provider } = useWeb3React()
  const analyticsContext = useTrace()

  return useCallback(async (): Promise<TransactionResponse> => {
    return trace('swap.send', async ({ setTraceData, setTraceStatus, setTraceError }) => {
      try {
        if (!account) throw new Error('missing account')
        if (!chainId) throw new Error('missing chainId')
        if (!provider) throw new Error('missing provider')
        if (!trade) throw new Error('missing trade')

        setTraceData('slippageTolerance', options.slippageTolerance.toFixed(2))
        const { calldata: data, value } = SwapRouter.swapCallParameters(trade, {
          slippageTolerance: options.slippageTolerance,
          deadlineOrPreviousBlockhash: options.deadline?.toString(),
          fee: options.feeOptions,
          recipient: account,
        })
        const tx = {
          from: account,
          to: options.smartPoolAddress,
          data: MulticallExtended.encodeMulticall([PaymentsExtended.encodeWrapETH(JSBI.BigInt(value)), data]),
          value: '0x0',
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
            sendAnalyticsEvent(SwapEventName.SWAP_SIGNED, {
              ...formatSwapSignedAnalyticsEventProperties({
                trade,
                fiatValues,
                txHash: response.hash,
              }),
              ...analyticsContext,
            })
            if (tx.data !== response.data) {
              sendAnalyticsEvent(SwapEventName.SWAP_MODIFIED_IN_WALLET, {
                txHash: response.hash,
                ...analyticsContext,
              })
              throw new ModifiedSwapError()
            }
            return response
          })
        return response
      } catch (swapError: unknown) {
        if (swapError instanceof ModifiedSwapError) throw swapError

        // GasEstimationErrors are already traced when they are thrown.
        if (!(swapError instanceof GasEstimationError)) setTraceError(swapError)

        // Cancellations are not failures, and must be accounted for as 'cancelled'.
        if (didUserReject(swapError)) {
          setTraceStatus('cancelled')
          // This error type allows us to distinguish between user rejections and other errors later too.
          throw new UserRejectedRequestError(swapErrorToUserReadableMessage(swapError))
        }

        throw new Error(swapErrorToUserReadableMessage(swapError))
      }
    })
  }, [
    account,
    analyticsContext,
    chainId,
    fiatValues,
    options.deadline,
    options.feeOptions,
    options.slippageTolerance,
    options.smartPoolAddress,
    provider,
    trade,
  ])
}
