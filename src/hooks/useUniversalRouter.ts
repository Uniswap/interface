import { BigNumber } from '@ethersproject/bignumber'
import { t } from '@lingui/macro'
import { SwapEventName } from '@uniswap/analytics-events'
import { Percent } from '@uniswap/sdk-core'
import { SwapRouter, UNIVERSAL_ROUTER_ADDRESS } from '@uniswap/universal-router-sdk'
import { FeeOptions, toHex } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import { sendAnalyticsEvent, useTrace } from 'analytics'
import useBlockNumber from 'lib/hooks/useBlockNumber'
import { formatCommonPropertiesForTrade, formatSwapSignedAnalyticsEventProperties } from 'lib/utils/analytics'
import { useCallback } from 'react'
import { ClassicTrade, TradeFillType } from 'state/routing/types'
import { trace } from 'tracing/trace'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { UserRejectedRequestError, WrongChainError } from 'utils/errors'
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
  trade: ClassicTrade | undefined,
  fiatValues: { amountIn?: number; amountOut?: number },
  options: SwapOptions
) {
  const { account, chainId, provider } = useWeb3React()
  const analyticsContext = useTrace()
  const blockNumber = useBlockNumber()

  return useCallback(async () => {
    return trace('swap.send', async ({ setTraceData, setTraceStatus, setTraceError }) => {
      try {
        if (!account) throw new Error('missing account')
        if (!chainId) throw new Error('missing chainId')
        if (!provider) throw new Error('missing provider')
        if (!trade) throw new Error('missing trade')
        const connectedChainId = await provider.getSigner().getChainId()
        if (chainId !== connectedChainId) throw new WrongChainError()

        setTraceData('slippageTolerance', options.slippageTolerance.toFixed(2))

        // universal-router-sdk reconstructs V2Trade objects, so rather than updating the trade amounts to account for tax, we adjust the slippage tolerance as a workaround
        // TODO(WEB-2725): update universal-router-sdk to not reconstruct trades
        const taxAdjustedSlippageTolerance = options.slippageTolerance.add(trade.totalTaxRate)

        const { calldata: data, value } = SwapRouter.swapERC20CallParameters(trade, {
          slippageTolerance: taxAdjustedSlippageTolerance,
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
          sendAnalyticsEvent(SwapEventName.SWAP_ESTIMATE_GAS_CALL_FAILED, {
            ...formatCommonPropertiesForTrade(trade, options.slippageTolerance),
            ...analyticsContext,
            client_block_number: blockNumber,
            tx,
            error: gasError,
          })
          console.warn(gasError)
          throw new GasEstimationError()
        }
        const gasLimit = calculateGasMargin(gasEstimate)
        setTraceData('gasLimit', gasLimit.toNumber())
        const beforeSign = Date.now()
        const response = await provider
          .getSigner()
          .sendTransaction({ ...tx, gasLimit })
          .then((response) => {
            sendAnalyticsEvent(SwapEventName.SWAP_SIGNED, {
              ...formatSwapSignedAnalyticsEventProperties({
                trade,
                timeToSignSinceRequestMs: Date.now() - beforeSign,
                allowedSlippage: options.slippageTolerance,
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

              if (!response.data || response.data.length === 0 || response.data === '0x') {
                throw new ModifiedSwapError()
              }
            }
            return response
          })
        return {
          type: TradeFillType.Classic as const,
          response,
        }
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
    options.permit,
    options.slippageTolerance,
    provider,
    trade,
  ])
}
