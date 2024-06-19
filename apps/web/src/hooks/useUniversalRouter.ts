import { TransactionResponse } from '@ethersproject/abstract-provider'
import { BigNumber } from '@ethersproject/bignumber'
import { CustomUserProperties, SwapEventName } from '@uniswap/analytics-events'
import { Percent } from '@taraswap/sdk-core'
import { FlatFeeOptions, SwapRouter, UNIVERSAL_ROUTER_ADDRESS } from '@taraswap/universal-router-sdk'
import { FeeOptions, toHex } from '@taraswap/v3-sdk'
import { useTotalBalancesUsdForAnalytics } from 'graphql/data/apollo/TokenBalancesProvider'
import { useAccount } from 'hooks/useAccount'
import { useEthersWeb3Provider } from 'hooks/useEthersProvider'
import { useGetTransactionDeadline } from 'hooks/useTransactionDeadline'
import { t } from 'i18n'
import useBlockNumber from 'lib/hooks/useBlockNumber'
import { formatCommonPropertiesForTrade, formatSwapSignedAnalyticsEventProperties } from 'lib/utils/analytics'
import { useCallback } from 'react'
import { ClassicTrade, TradeFillType } from 'state/routing/types'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { trace } from 'tracing/trace'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { logger } from 'utilities/src/logger/logger'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { UserRejectedRequestError, WrongChainError } from 'utils/errors'
import isZero from 'utils/isZero'
import { didUserReject, swapErrorToUserReadableMessage } from 'utils/swapErrorToUserReadableMessage'
import { getWalletMeta } from 'utils/walletMeta'
import { PermitSignature } from './usePermitAllowance'

/** Thrown when gas estimation fails. This class of error usually requires an emulator to determine the root cause. */
class GasEstimationError extends Error {
  constructor() {
    super(t('swap.error.expectedToFail'))
  }
}

/**
 * Thrown when the user modifies the transaction in-wallet before submitting it.
 * In-wallet calldata modification nullifies any safeguards (eg slippage) from the interface, so we recommend reverting them immediately.
 */
class ModifiedSwapError extends Error {
  constructor() {
    super(t('swap.error.modifiedByWallet'))
  }
}

interface SwapOptions {
  slippageTolerance: Percent
  permit?: PermitSignature
  feeOptions?: FeeOptions
  flatFeeOptions?: FlatFeeOptions
}

export function useUniversalRouterSwapCallback(
  trade: ClassicTrade | undefined,
  fiatValues: { amountIn?: number; amountOut?: number; feeUsd?: number },
  options: SwapOptions
) {
  const account = useAccount()
  const provider = useEthersWeb3Provider()
  const connectorName = useAccount().connector?.name

  const analyticsContext = useTrace()
  const blockNumber = useBlockNumber()
  const getDeadline = useGetTransactionDeadline()
  const isAutoSlippage = useUserSlippageTolerance()[0] === 'auto'
  const portfolioBalanceUsd = useTotalBalancesUsdForAnalytics()

  return useCallback(
    (): Promise<{ type: TradeFillType.Classic; response: TransactionResponse; deadline?: BigNumber }> =>
      trace({ name: 'Swap (Classic)', op: 'swap.classic' }, async (trace) => {
        try {
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
          if (account.chainId !== connectedChainId) {
            throw new WrongChainError()
          }

          const deadline = await getDeadline()

          trace.setData('slippageTolerance', options.slippageTolerance.toFixed(2))
          const { calldata: data, value } = SwapRouter.swapERC20CallParameters(trade as any, {
            slippageTolerance: options.slippageTolerance,
            deadlineOrPreviousBlockhash: deadline?.toString(),
            inputTokenPermit: options.permit,
            fee: options.feeOptions,
            flatFee: options.flatFeeOptions,
          })
          const tx = {
            from: account.address,
            to: UNIVERSAL_ROUTER_ADDRESS(account.chainId),
            data,
            // TODO(https://github.com/Uniswap/universal-router-sdk/issues/113): universal-router-sdk returns a non-hexlified value.
            ...(value && !isZero(value) ? { value: toHex(value) } : {}),
          }

          let gasLimit: BigNumber
          try {
            const gasEstimate = await provider.estimateGas(tx)
            gasLimit = calculateGasMargin(gasEstimate)
            trace.setData('gasLimit', gasLimit.toNumber())
          } catch (gasError) {
            sendAnalyticsEvent(SwapEventName.SWAP_ESTIMATE_GAS_CALL_FAILED, {
              ...formatCommonPropertiesForTrade(trade, options.slippageTolerance),
              ...analyticsContext,
              client_block_number: blockNumber,
              txRequest: tx,
              isAutoSlippage,
            })
            const wrappedError = new Error('gas error', { cause: gasError })
            logger.warn('useUniversalRouter', 'useUniversalRouterSwapCallback', 'Failed to estimate gas', wrappedError)
            throw new GasEstimationError()
          }

          const response = await trace.child(
            { name: 'Send transaction', op: 'wallet.send_transaction' },
            async (walletTrace) => {
              try {
                return await provider.getSigner().sendTransaction({ ...tx, gasLimit })
              } catch (error) {
                if (didUserReject(error)) {
                  walletTrace.setStatus('cancelled')
                  throw new UserRejectedRequestError(swapErrorToUserReadableMessage(error))
                } else {
                  throw error
                }
              }
            }
          )
          sendAnalyticsEvent(SwapEventName.SWAP_SIGNED, {
            ...formatSwapSignedAnalyticsEventProperties({
              trade,
              timeToSignSinceRequestMs: trace.now(),
              allowedSlippage: options.slippageTolerance,
              fiatValues,
              txHash: response.hash,
              portfolioBalanceUsd,
            }),
            ...analyticsContext,
            // TODO (WEB-2993): remove these after debugging missing user properties.
            [CustomUserProperties.WALLET_ADDRESS]: account.address,
            [CustomUserProperties.WALLET_TYPE]: connectorName,
            [CustomUserProperties.PEER_WALLET_AGENT]: provider ? getWalletMeta(provider)?.agent : undefined,
          })
          if (tx.data !== response.data) {
            sendAnalyticsEvent(SwapEventName.SWAP_MODIFIED_IN_WALLET, {
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
            trace.setStatus('cancelled')
            throw error
          } else if (error instanceof ModifiedSwapError) {
            trace.setError(error, 'data_loss')
            throw error
          } else {
            trace.setError(error)
            throw Error(swapErrorToUserReadableMessage(error))
          }
        }
      }),
    [
      account.status,
      account.chainId,
      account.address,
      provider,
      trade,
      getDeadline,
      options.slippageTolerance,
      options.permit,
      options.feeOptions,
      options.flatFeeOptions,
      fiatValues,
      portfolioBalanceUsd,
      analyticsContext,
      connectorName,
      blockNumber,
      isAutoSlippage,
    ]
  )
}
