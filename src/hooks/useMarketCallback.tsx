import { BigNumber } from '@ethersproject/bignumber'
// eslint-disable-next-line no-restricted-imports
import { t, Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { toHex, Trade as V3Trade } from '@uniswap/v3-sdk'
import { poll } from 'ethers/lib/utils'
import { ReactNode, useMemo } from 'react'
import { SwapTransaction, V3TradeState } from 'state/validator/types'

import { TransactionType } from '../state/transactions/actions'
import { useTransactionAdder } from '../state/transactions/hooks'
import approveAmountCalldata from '../utils/approveAmountCalldata'
import { calculateGasMargin } from '../utils/calculateGasMargin'
import { currencyId } from '../utils/currencyId'
import isZero from '../utils/isZero'
import { useArgentWalletContract } from './useArgentWalletContract'
import useENS from './useENS'
import { SignatureData } from './useERC20Permit'
import { useGaslessCallback } from './useGaslessCallback'
import useTransactionDeadline from './useTransactionDeadline'
import { useActiveWeb3React } from './web3'

enum MarketCallbackState {
  INVALID,
  LOADING,
  VALID,
}

interface MarketCall {
  address: string
  calldata: string
  value: string
  gas: string
}

interface MarketCallEstimate {
  call: MarketCall
}

interface SuccessfulCall extends MarketCallEstimate {
  call: MarketCall
  gasEstimate: BigNumber
}

interface FailedCall extends MarketCallEstimate {
  call: MarketCall
  error: Error
}

/**
 * Returns the swap calls that can be used to make the trade
 * @param trade trade to execute
 * @param allowedSlippage user allowed slippage
 * @param recipientAddressOrName the ENS name or address of the recipient of the swap output
 * @param signatureData the signature data of the permit of the input token amount, if available
 */
function useMarketCallArguments(
  trade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType> | undefined, // trade to execute, required
  allowedSlippage: Percent, // in bips
  recipientAddressOrName: string | null, // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
  referer: string | null,
  signatureData: SignatureData | null | undefined,
  parsedAmount: CurrencyAmount<Currency> | undefined,
  swapTransaction: SwapTransaction | null | undefined,
  showConfirm: boolean,
  gasless: boolean
): {
  state: V3TradeState
  trade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType> | undefined | null // trade to execute, required
  tx: SwapTransaction | undefined
  marketcall: MarketCall[]
} {
  const { account, chainId, library } = useActiveWeb3React()

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress
  const affiliate = referer === null || referer == account ? null : referer
  const deadline = useTransactionDeadline()
  const argentWalletContract = useArgentWalletContract()

  return useMemo(() => {
    if (!trade || !recipient || !library || !account || !chainId || !deadline || !parsedAmount || !swapTransaction)
      return {
        state: V3TradeState.LOADING,
        trade: null,
        tx: undefined,
        marketcall: [],
      }
    // trade is V3Trade
    const callData = swapTransaction.data
    if (argentWalletContract && trade.inputAmount.currency.isToken) {
      return {
        state: V3TradeState.VALID,
        trade,
        tx: swapTransaction,
        marketcall: [
          {
            address: argentWalletContract.address,
            calldata: argentWalletContract.interface.encodeFunctionData('wc_multiCall', [
              [
                approveAmountCalldata(trade.maximumAmountIn(allowedSlippage), swapTransaction?.to),
                {
                  to: swapTransaction?.to,
                  value: swapTransaction.value,
                  data: callData,
                },
              ],
            ]),
            value: '0x0',
            gas: swapTransaction.gas,
          },
        ],
      }
    }
    return {
      state: V3TradeState.VALID,
      trade,
      tx: swapTransaction,
      marketcall: [
        {
          address: swapTransaction?.to,
          value: toHex(swapTransaction.value),
          calldata: callData,
          gas: swapTransaction.gas,
        },
      ],
    }
  }, [
    trade,
    recipient,
    library,
    account,
    chainId,
    deadline,
    parsedAmount,
    swapTransaction,
    argentWalletContract,
    allowedSlippage,
  ])
}

/**
 * This is hacking out the revert reason from the ethers provider thrown error however it can.
 * This object seems to be undocumented by ethers.
 * @param error an error from the ethers provider
 */
function marketErrorToUserReadableMessage(error: any): ReactNode {
  let reason: string | undefined
  while (Boolean(error)) {
    reason = error.reason ?? error.message ?? reason
    error = error.error ?? error.data?.originalError
  }

  if (reason?.indexOf('execution reverted: ') === 0) reason = reason.substr('execution reverted: '.length)

  console.log(reason)

  switch (reason) {
    case 'UniswapV2Router: EXPIRED':
      return (
        <Trans>
          The transaction could not be sent because the deadline has passed. Please check that your transaction deadline
          is not too low.
        </Trans>
      )
    case 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT':
    case 'UniswapV2Router: EXCESSIVE_INPUT_AMOUNT':
      return (
        <Trans>
          This transaction will not succeed either due to price movement or fee on transfer. Try increasing your
          slippage tolerance.
        </Trans>
      )
    case 'TransferHelper: TRANSFER_FROM_FAILED':
      return <Trans>The input token cannot be transferred. There may be an issue with the input token.</Trans>
    case 'UniswapV2: TRANSFER_FAILED':
      return <Trans>The output token cannot be transferred. There may be an issue with the output token.</Trans>
    case 'UniswapV2: K':
      return (
        <Trans>
          The Uniswap invariant x*y=k was not satisfied by the swap. This usually means one of the tokens you are
          swapping incorporates custom behavior on transfer.
        </Trans>
      )
    case 'Too little received':
    case 'Too much requested':
    case 'STF':
      return (
        <Trans>
          This transaction will not succeed due to price movement. Try increasing your slippage tolerance. Note: fee on
          transfer and rebase tokens are incompatible with Uniswap V3.
        </Trans>
      )
    case 'TF':
      return (
        <Trans>
          The output token cannot be transferred. There may be an issue with the output token. Note: fee on transfer and
          rebase tokens are incompatible with Uniswap V3.
        </Trans>
      )
    default:
      if (reason?.indexOf('undefined is not an object') !== -1) {
        console.error(error, reason)
        return (
          <Trans>
            An error occurred when trying to execute this swap. You may need to increase your slippage tolerance. If
            that does not work, there may be an incompatibility with the token you are trading. Note: fee on transfer
            and rebase tokens are incompatible with Kromatika.
          </Trans>
        )
      }
      return (
        <Trans>
          Unknown error{reason ? `: "${reason}"` : ''}. Try increasing your slippage tolerance. Note: fee on transfer
          and rebase tokens are incompatible with Kromatika.
        </Trans>
      )
  }
}

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useMarketCallback(
  trade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType> | undefined, // trade to execute, required
  allowedSlippage: Percent, // in bips
  recipientAddressOrName: string | null, // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
  referer: string | null,
  signatureData: SignatureData | undefined | null,
  parsedAmount: CurrencyAmount<Currency> | undefined,
  swapTransaction: SwapTransaction | undefined | null,
  showConfirm: boolean,
  gasless: boolean
): { state: MarketCallbackState; callback: null | (() => Promise<string>); error: ReactNode | null } {
  const { account, chainId, library } = useActiveWeb3React()

  const { gaslessCallback } = useGaslessCallback()

  const swapCalls = useMarketCallArguments(
    trade,
    allowedSlippage,
    recipientAddressOrName,
    referer,
    signatureData,
    parsedAmount,
    swapTransaction,
    showConfirm,
    gasless
  )

  const addTransaction = useTransactionAdder()

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress

  return useMemo(() => {
    if (!trade || !library || !account || !chainId || !swapTransaction) {
      return { state: MarketCallbackState.INVALID, callback: null, error: <Trans>Missing dependencies</Trans> }
    }
    if (!recipient) {
      if (recipientAddressOrName !== null) {
        return { state: MarketCallbackState.INVALID, callback: null, error: <Trans>Invalid recipient</Trans> }
      } else {
        return { state: MarketCallbackState.LOADING, callback: null, error: null }
      }
    }
    if (swapCalls.state == V3TradeState.LOADING) {
      return { state: MarketCallbackState.LOADING, callback: null, error: null }
    }

    return {
      state: MarketCallbackState.VALID,
      callback: async function onSwap(): Promise<string> {
        const estimatedCalls: MarketCallEstimate[] = await Promise.all(
          swapCalls.marketcall.map((call) => {
            const { address, calldata, value, gas } = call

            const tx =
              !value || isZero(value)
                ? { from: account, to: address, data: calldata }
                : {
                    from: account,
                    to: address,
                    data: calldata,
                    value,
                    gas,
                  }

            return library
              .estimateGas(tx)
              .then((gasEstimate) => {
                console.log('Gas estimate: ' + gasEstimate)
                return {
                  call,
                  gasEstimate,
                }
              })
              .catch((gasError) => {
                console.log('Gas estimate failed, trying eth_call to extract error', call, gasError)

                return {
                  call,
                  gas,
                }
              })
          })
        )

        // a successful estimation is a bignumber gas estimate and the next call is also a bignumber gas estimate
        let bestCallOption: SuccessfulCall | MarketCallEstimate | undefined = estimatedCalls.find(
          (el, ix, list): el is SuccessfulCall =>
            'gasEstimate' in el && (ix === list.length - 1 || 'gasEstimate' in list[ix + 1])
        )

        // check if any calls errored with a recognizable error
        if (!bestCallOption) {
          const errorCalls = estimatedCalls.filter((call): call is FailedCall => 'error' in call)
          if (errorCalls.length > 0) throw errorCalls[errorCalls.length - 1].error
          const firstNoErrorCall = estimatedCalls.find<MarketCallEstimate>(
            (call): call is MarketCallEstimate => !('error' in call)
          )
          if (!firstNoErrorCall) throw new Error(t`Unexpected error. Could not estimate gas for the swap.`)
          bestCallOption = firstNoErrorCall
        }

        const {
          call: { address, calldata, value },
        } = bestCallOption

        if (gasless) {
          const gasLimit =
            'gasEstimate' in bestCallOption ? { gasLimit: calculateGasMargin(chainId, bestCallOption.gasEstimate) } : {}
          const txParams = {
            data: calldata,
            to: address,
            from: account,
            gasLimit: gasLimit ? gasLimit?.gasLimit?.toHexString() : 700000,
            signatureType: library.provider.isMetaMask ? 'EIP712_SIGN' : 'PERSONAL_SIGN',
            ...(value && !isZero(value) ? { value } : {}),
          }
          // sending gasless txn
          return gaslessCallback()
            .then((gaslessProvider) => {
              if (!gaslessProvider) return
              return gaslessProvider.send('eth_sendTransaction', [txParams]).then(async (response: any) => {
                const txResponse = await poll(
                  async () => {
                    const tx = await gaslessProvider.getTransaction(response)
                    if (tx === null) {
                      return undefined
                    }
                    const blockNumber = await gaslessProvider._getInternalBlockNumber(
                      100 + 2 * gaslessProvider.pollingInterval
                    )
                    return gaslessProvider._wrapTransaction(tx, response, blockNumber)
                  },
                  { oncePoll: gaslessProvider }
                )
                if (txResponse) {
                  addTransaction(
                    txResponse,
                    trade.tradeType === TradeType.EXACT_INPUT
                      ? {
                          type: TransactionType.SWAP,
                          tradeType: TradeType.EXACT_INPUT,
                          inputCurrencyId: currencyId(trade.inputAmount.currency),
                          inputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
                          expectedOutputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
                          outputCurrencyId: currencyId(trade.outputAmount.currency),
                          minimumOutputCurrencyAmountRaw: '',
                        }
                      : {
                          type: TransactionType.SWAP,
                          tradeType: TradeType.EXACT_OUTPUT,
                          inputCurrencyId: currencyId(trade.inputAmount.currency),
                          maximumInputCurrencyAmountRaw: '',
                          outputCurrencyId: currencyId(trade.outputAmount.currency),
                          outputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
                          expectedInputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
                        }
                  )
                }

                return response
              })
            })
            .catch((error) => {
              // TODO
              console.log(error)
              throw new Error(t`Transaction rejected: ${marketErrorToUserReadableMessage(error)}`)
            })
        } else {
          return library
            .getSigner()
            .sendTransaction({
              from: account,
              to: address,
              data: calldata,
              // let the wallet try if we can't estimate the gas
              ...('gasEstimate' in bestCallOption
                ? { gasLimit: calculateGasMargin(chainId, bestCallOption.gasEstimate) }
                : {}),
              ...(value && !isZero(value) ? { value } : {}),
            })
            .then((response) => {
              addTransaction(
                response,
                trade.tradeType === TradeType.EXACT_INPUT
                  ? {
                      type: TransactionType.SWAP,
                      tradeType: TradeType.EXACT_INPUT,
                      inputCurrencyId: currencyId(trade.inputAmount.currency),
                      inputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
                      expectedOutputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
                      outputCurrencyId: currencyId(trade.outputAmount.currency),
                      minimumOutputCurrencyAmountRaw: trade.minimumAmountOut(allowedSlippage).quotient.toString(),
                    }
                  : {
                      type: TransactionType.SWAP,
                      tradeType: TradeType.EXACT_OUTPUT,
                      inputCurrencyId: currencyId(trade.inputAmount.currency),
                      maximumInputCurrencyAmountRaw: trade.maximumAmountIn(allowedSlippage).quotient.toString(),
                      outputCurrencyId: currencyId(trade.outputAmount.currency),
                      outputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
                      expectedInputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
                    }
              )

              return response.hash
            })
            .catch((error) => {
              // if the user rejected the tx, pass this along
              if (error?.code === 4001) {
                throw new Error(t`Transaction rejected.`)
              } else {
                // otherwise, the error was unexpected and we need to convey that
                console.error(`Swap failed`, error, address, calldata, value)

                throw new Error(t`Swap failed: ${marketErrorToUserReadableMessage(error)}`)
              }
            })
        }
      },
      error: null,
    }
  }, [
    trade,
    library,
    account,
    chainId,
    swapTransaction,
    recipient,
    swapCalls.state,
    swapCalls.marketcall,
    recipientAddressOrName,
    gasless,
    gaslessCallback,
    addTransaction,
    allowedSlippage,
  ])
}
