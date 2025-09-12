import { useTotalBalancesUsdForAnalytics } from 'appGraphql/data/apollo/useTotalBalancesUsdForAnalytics'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import { BigNumber } from '@ethersproject/bignumber'
import { Percent } from '@uniswap/sdk-core'
import {
  FlatFeeOptions,
  SwapRouter,
  UNIVERSAL_ROUTER_ADDRESS,
  UniversalRouterVersion,
} from '@uniswap/universal-router-sdk'
import { FeeOptions, toHex } from '@uniswap/v3-sdk'
import { useAccount } from 'hooks/useAccount'
import { useEthersWeb3Provider } from 'hooks/useEthersProvider'
import { PermitSignature } from 'hooks/usePermitAllowance'
import { useGetTransactionDeadline } from 'hooks/useTransactionDeadline'
import useBlockNumber from 'lib/hooks/useBlockNumber'
import { formatCommonPropertiesForTrade, formatSwapSignedAnalyticsEventProperties } from 'lib/utils/analytics'
import { useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { ClassicTrade, TradeFillType } from 'state/routing/types'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { SwapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import i18n from 'uniswap/src/i18n'
import { logger } from 'utilities/src/logger/logger'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { UserRejectedRequestError, WrongChainError } from 'utils/errors'
import isZero from 'utils/isZero'
import { didUserReject, swapErrorToUserReadableMessage } from 'utils/swapErrorToUserReadableMessage'

/** Thrown when gas estimation fails. This class of error usually requires an emulator to determine the root cause. */
class GasEstimationError extends Error {
  constructor() {
    super(i18n.t('swap.error.expectedToFail'))
  }
}

/**
 * Thrown when the user modifies the transaction in-wallet before submitting it.
 * In-wallet calldata modification nullifies any safeguards (eg slippage) from the interface, so we recommend reverting them immediately.
 */
class ModifiedSwapError extends Error {
  constructor() {
    super(i18n.t('swap.error.modifiedByWallet'))
  }
}

interface SwapOptions {
  slippageTolerance: Percent
  permit?: PermitSignature
  feeOptions?: FeeOptions
  flatFeeOptions?: FlatFeeOptions
}

export function useUniversalRouterSwapCallback({
  trade,
  fiatValues,
  options,
}: {
  trade?: ClassicTrade
  fiatValues: { amountIn?: number; amountOut?: number; feeUsd?: number }
  options: SwapOptions
}) {
  const { t } = useTranslation()
  const account = useAccount()
  const accountRef = useRef(account)
  accountRef.current = account

  const { chainId } = useMultichainContext()
  const provider = useEthersWeb3Provider({ chainId })
  const providerRef = useRef(provider)
  providerRef.current = provider

  const analyticsContext = useTrace()
  const blockNumber = useBlockNumber()
  const getDeadline = useGetTransactionDeadline()
  const isAutoSlippage = useUserSlippageTolerance()[0] === 'auto'
  const portfolioBalanceUsd = useTotalBalancesUsdForAnalytics()

  return useCallback(async (): Promise<{
    type: TradeFillType.Classic
    response: TransactionResponse
    deadline?: BigNumber
  }> => {
    try {
      const account = accountRef.current
      const provider = providerRef.current
      if (account.status !== 'connected') {
        throw new Error('wallet not connected')
      }
      if (!provider) {
        throw new Error('missing provider')
      }
      if (!trade) {
        throw new Error('missing trade')
      }
      const connectedChainId = await provider.getSigner().getChainId()
      if (account.chainId !== connectedChainId || account.chainId !== chainId) {
        throw new WrongChainError()
      }

      const deadline = await getDeadline()

      const { calldata: data, value } = SwapRouter.swapCallParameters(trade, {
        slippageTolerance: options.slippageTolerance,
        deadlineOrPreviousBlockhash: deadline?.toString(),
        inputTokenPermit: options.permit,
        fee: options.feeOptions,
        flatFee: options.flatFeeOptions,
      })
      const tx = {
        from: account.address,
        to: UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V1_2, chainId),
        data,
        // TODO(https://github.com/Uniswap/universal-router-sdk/issues/113): universal-router-sdk returns a non-hexlified value.
        ...(value && !isZero(value) ? { value: toHex(value) } : {}),
      }

      let gasLimit: BigNumber
      try {
        const gasEstimate = await provider.estimateGas(tx)
        gasLimit = calculateGasMargin(gasEstimate)
      } catch (gasError) {
        sendAnalyticsEvent(SwapEventName.SwapEstimateGasCallFailed, {
          ...formatCommonPropertiesForTrade({ trade, allowedSlippage: options.slippageTolerance }),
          ...analyticsContext,
          client_block_number: blockNumber,
          txRequest: tx,
          isAutoSlippage,
        })
        const wrappedError = new Error('gas error', { cause: gasError })
        logger.warn('useUniversalRouter', 'useUniversalRouterSwapCallback', 'Failed to estimate gas', wrappedError)
        throw new GasEstimationError()
      }

      const response = await (async () => {
        try {
          const provider = providerRef.current
          if (!provider) {
            throw new Error('missing provider')
          }
          return await provider.getSigner().sendTransaction({ ...tx, gasLimit })
        } catch (error) {
          if (didUserReject(error)) {
            throw new UserRejectedRequestError(swapErrorToUserReadableMessage(t, error))
          } else {
            throw error
          }
        }
      })()
      sendAnalyticsEvent(SwapEventName.SwapSigned, {
        ...formatSwapSignedAnalyticsEventProperties({
          trade,
          allowedSlippage: options.slippageTolerance,
          fiatValues,
          txHash: response.hash,
          portfolioBalanceUsd,
          trace: analyticsContext,
        }),
      })
      if (tx.data !== response.data) {
        sendAnalyticsEvent(SwapEventName.SwapModifiedInWallet, {
          txHash: response.hash,
          expected: tx.data,
          actual: response.data,
          ...analyticsContext,
        })
        if (!response.data || response.data.length === 0 || response.data === '0x') {
          throw new ModifiedSwapError()
        }
      }
      return { type: TradeFillType.Classic as const, response, deadline }
    } catch (error: unknown) {
      if (error instanceof GasEstimationError) {
        throw error
      } else if (error instanceof UserRejectedRequestError) {
        throw error
      } else if (error instanceof ModifiedSwapError) {
        throw error
      } else {
        throw Error(swapErrorToUserReadableMessage(t, error))
      }
    }
  }, [
    trade,
    t,
    chainId,
    getDeadline,
    options.slippageTolerance,
    options.permit,
    options.feeOptions,
    options.flatFeeOptions,
    fiatValues,
    portfolioBalanceUsd,
    analyticsContext,
    blockNumber,
    isAutoSlippage,
  ])
}
