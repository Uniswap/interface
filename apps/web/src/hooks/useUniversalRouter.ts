import { useTotalBalancesUsdForAnalytics } from 'appGraphql/data/apollo/useTotalBalancesUsdForAnalytics'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import { BigNumber } from '@ethersproject/bignumber'
import { Percent } from '@uniswap/sdk-core'
import {
  FlatFeeOptions,
  SwapRouter as UniversalSwapRouter,
  UNIVERSAL_ROUTER_ADDRESS,
  UniversalRouterVersion,
} from '@hkdex-tmp/universal_router_sdk'
import { SwapRouter as V3SwapRouter } from '@uniswap/router-sdk'
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
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { CHAIN_TO_UNIVERSAL_ROUTER_ADDRESS } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/constants'
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

      const isHashKeyChain = chainId === UniverseChainId.HashKey || chainId === UniverseChainId.HashKeyTestnet

      // Check if SwapRouter and UNIVERSAL_ROUTER_ADDRESS are available
      if (!UniversalSwapRouter || typeof UniversalSwapRouter.swapCallParameters !== 'function') {
        throw new Error('SwapRouter.swapCallParameters is not available in @hkdex-tmp/universal_router_sdk')
      }

      if (!UNIVERSAL_ROUTER_ADDRESS || typeof UNIVERSAL_ROUTER_ADDRESS !== 'function') {
        throw new Error('UNIVERSAL_ROUTER_ADDRESS is not available in @hkdex-tmp/universal_router_sdk')
      }

      let routerAddress: string | undefined
      const configuredRouterAddress = CHAIN_TO_UNIVERSAL_ROUTER_ADDRESS[chainId as UniverseChainId]?.[0]
      if (configuredRouterAddress) {
        routerAddress = configuredRouterAddress
      }

      if (!isHashKeyChain) {
        try {
          routerAddress ??= UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V1_2, chainId)
        } catch (error) {
          // Router address lookup failed
          throw new Error(
            `Failed to get router address for chain ${chainId}: ${error instanceof Error ? error.message : String(error)}`,
          )
        }
      }

      if (!routerAddress) {
        throw new Error(`Failed to resolve router address for chain ${chainId}`)
      }

      const { calldata: data, value } = isHashKeyChain
        ? V3SwapRouter.swapCallParameters(trade, {
            slippageTolerance: options.slippageTolerance,
            recipient: account.address,
            deadline: deadline?.toString() ?? '0',
            fee: options.feeOptions,
          })
        : UniversalSwapRouter.swapCallParameters(trade, {
            slippageTolerance: options.slippageTolerance,
            deadlineOrPreviousBlockhash: deadline?.toString(),
            inputTokenPermit: options.permit,
            fee: options.feeOptions,
            flatFee: options.flatFeeOptions,
          })
      const tx = {
        from: account.address,
        to: routerAddress,
        data,
        // TODO(https://github.com/Uniswap/universal-router-sdk/issues/113): universal-router-sdk returns a non-hexlified value.
        ...(value && !isZero(value) ? { value: toHex(value) } : {}),
      }

      let gasLimit: BigNumber
    try {
      const gasEstimate = await provider.estimateGas(tx)
      // HKSWAP: Use larger gas margin for HashKey chains to prevent gas insufficient errors
      if (isHashKeyChain) {
        // For HashKey chains, use 2.5x multiplier instead of default 1.2x
        gasLimit = gasEstimate.mul(250).div(100)
      } else {
        gasLimit = calculateGasMargin(gasEstimate)
      }
      } catch (gasError) {
        // HashKey RPC may revert during estimation (e.g., STF) even when tx would succeed.
        // Fallback to buffered quote gasUseEstimate to allow wallet confirmation.
        if (isHashKeyChain) {
          const gasUseEstimate =
            (trade as any)?.quote?.quote?.gasUseEstimate !== undefined
              ? Number((trade as any).quote.quote.gasUseEstimate)
              : undefined
          // HKSWAP: Increased fallback gas multiplier from 1.6 to 2.5 and default from 700000 to 1000000
          const fallbackGas = gasUseEstimate ? Math.ceil(gasUseEstimate * 2.5) : 1000000
          gasLimit = BigNumber.from(fallbackGas)
          logger.warn('useUniversalRouter', 'useUniversalRouterSwapCallback', 'Estimate gas failed, using fallback for HashKey', {
            fallbackGas,
            gasUseEstimate,
            error: gasError,
          })
        } else {
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
