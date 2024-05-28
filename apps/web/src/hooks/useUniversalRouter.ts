import { TransactionResponse } from '@ethersproject/abstract-provider'
import { BigNumber } from '@ethersproject/bignumber'
import { CustomUserProperties, SwapEventName } from '@uniswap/analytics-events'
import { MulticallExtended, PaymentsExtended, SwapRouter } from '@uniswap/router-sdk'
import { Percent } from '@uniswap/sdk-core'
import { FlatFeeOptions /*, SwapRouter, UNIVERSAL_ROUTER_ADDRESS*/ } from '@uniswap/universal-router-sdk'
import { FeeOptions /*, toHex*/ } from '@uniswap/v3-sdk'
import { sendAnalyticsEvent, useTrace } from 'analytics'
import { useTotalBalancesUsdForAnalytics } from 'graphql/data/apollo/TokenBalancesProvider'
import { useEthersWeb3Provider } from 'hooks/useEthersProvider'
import { useGetTransactionDeadline } from 'hooks/useTransactionDeadline'
import { t } from 'i18n'
import JSBI from 'jsbi'
import useBlockNumber from 'lib/hooks/useBlockNumber'
import { formatCommonPropertiesForTrade, formatSwapSignedAnalyticsEventProperties } from 'lib/utils/analytics'
import { useCallback } from 'react'
import { ClassicTrade, TradeFillType } from 'state/routing/types'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { trace } from 'tracing/trace'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { UserRejectedRequestError, WrongChainError } from 'utils/errors'
//import isZero from 'utils/isZero'
import { didUserReject, swapErrorToUserReadableMessage } from 'utils/swapErrorToUserReadableMessage'
import { getWalletMeta } from 'utils/walletMeta'
import { useAccount } from 'wagmi'
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
  permit?: PermitSignature
  feeOptions?: FeeOptions
  flatFeeOptions?: FlatFeeOptions
  smartPoolAddress?: string
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
          if (account.status !== 'connected') throw new Error('wallet not connected')
          if (!provider) throw new Error('missing provider')
          if (!trade) throw new Error('missing trade')
          const connectedChainId = await provider.getSigner().getChainId()
          if (account.chainId !== connectedChainId) throw new WrongChainError()

          const deadline = await getDeadline()

          trace.setData('slippageTolerance', options.slippageTolerance.toFixed(2))
          const { calldata: data, value } = SwapRouter.swapCallParameters(trade, {
            slippageTolerance: options.slippageTolerance,
            deadlineOrPreviousBlockhash: deadline?.toString(),
            fee: options.feeOptions,
            recipient: account.address,
          })
          const tx = {
            from: account.address,
            to: options.smartPoolAddress,
            data: MulticallExtended.encodeMulticall([PaymentsExtended.encodeWrapETH(JSBI.BigInt(value)), data]),
            value: '0x0',
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
              tx,
              isAutoSlippage,
            })
            console.warn(gasError)
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
      options.feeOptions,
      options.smartPoolAddress,
      fiatValues,
      portfolioBalanceUsd,
      analyticsContext,
      connectorName,
      blockNumber,
      isAutoSlippage,
    ]
  )
}
