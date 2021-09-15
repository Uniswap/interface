import { BigNumber } from '@ethersproject/bignumber'
import { SignatureLike } from '@ethersproject/bytes'
import { Web3Provider } from '@ethersproject/providers'
import { PopulatedTransaction } from '@ethersproject/contracts'
import { t } from '@lingui/macro'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { Router, Trade as V2Trade } from '@uniswap/v2-sdk'
import { SwapRouter, Trade as V3Trade } from '@uniswap/v3-sdk'
import { keccak256, serializeTransaction, parseTransaction } from 'ethers/lib/utils'
import { useMemo } from 'react'
import { SWAP_ROUTER_ADDRESSES } from '../constants/addresses'
import { useTransactionAdder, usePrivateTransactionAdder } from '../state/transactions/hooks'
import { useFrontrunningProtection } from '../state/user/hooks'
import { isAddress, shortenAddress } from '../utils'
import approveAmountCalldata from '../utils/approveAmountCalldata'
import { calculateGasMargin } from '../utils/calculateGasMargin'
import { getTradeVersion } from '../utils/getTradeVersion'
import isZero from '../utils/isZero'
import { useArgentWalletContract } from './useArgentWalletContract'
import { useV2RouterContract } from './useContract'
import useENS from './useENS'
import { SignatureData } from './useERC20Permit'
import { Version } from './useToggledVersion'
import useTransactionDeadline from './useTransactionDeadline'
import { useActiveWeb3React } from './web3'
import { emitTransactionRequest, BundleReq } from 'websocket/mistxConnect'
import useFeesPerGas from './useFeesPerGas'

enum SwapCallbackState {
  INVALID,
  LOADING,
  VALID,
}

export interface SwapCall {
  address: string
  calldata: string
  value: string
}

export interface SwapCallEstimate {
  call: SwapCall
}

export interface SuccessfulCall extends SwapCallEstimate {
  call: SwapCall
  gasEstimate: BigNumber
}

interface FailedCall extends SwapCallEstimate {
  call: SwapCall
  error: Error
}

/**
 * Returns the swap calls that can be used to make the trade
 * @param trade trade to execute
 * @param allowedSlippage user allowed slippage
 * @param recipientAddressOrName the ENS name or address of the recipient of the swap output
 * @param signatureData the signature data of the permit of the input token amount, if available
 */
export function useSwapCallArguments(
  trade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType> | undefined, // trade to execute, required
  allowedSlippage: Percent, // in bips
  recipientAddressOrName: string | null, // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
  signatureData: SignatureData | null | undefined
): SwapCall[] {
  const { account, chainId, library } = useActiveWeb3React()

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress
  const deadline = useTransactionDeadline()
  const routerContract = useV2RouterContract()
  const argentWalletContract = useArgentWalletContract()

  return useMemo(() => {
    if (!trade || !recipient || !library || !account || !chainId || !deadline) return []

    if (trade instanceof V2Trade) {
      if (!routerContract) return []
      const swapMethods = []

      swapMethods.push(
        Router.swapCallParameters(trade, {
          feeOnTransfer: false,
          allowedSlippage,
          recipient,
          deadline: deadline.toNumber(),
        })
      )

      if (trade.tradeType === TradeType.EXACT_INPUT) {
        swapMethods.push(
          Router.swapCallParameters(trade, {
            feeOnTransfer: true,
            allowedSlippage,
            recipient,
            deadline: deadline.toNumber(),
          })
        )
      }
      return swapMethods.map(({ methodName, args, value }) => {
        if (argentWalletContract && trade.inputAmount.currency.isToken) {
          return {
            address: argentWalletContract.address,
            calldata: argentWalletContract.interface.encodeFunctionData('wc_multiCall', [
              [
                approveAmountCalldata(trade.maximumAmountIn(allowedSlippage), routerContract.address),
                {
                  to: routerContract.address,
                  value,
                  data: routerContract.interface.encodeFunctionData(methodName, args),
                },
              ],
            ]),
            value: '0x0',
          }
        } else {
          return {
            address: routerContract.address,
            calldata: routerContract.interface.encodeFunctionData(methodName, args),
            value,
          }
        }
      })
    } else {
      // trade is V3Trade
      const swapRouterAddress = chainId ? SWAP_ROUTER_ADDRESSES[chainId] : undefined
      if (!swapRouterAddress) return []

      const { value, calldata } = SwapRouter.swapCallParameters(trade, {
        recipient,
        slippageTolerance: allowedSlippage,
        deadline: deadline.toString(),
        ...(signatureData
          ? {
              inputTokenPermit:
                'allowed' in signatureData
                  ? {
                      expiry: signatureData.deadline,
                      nonce: signatureData.nonce,
                      s: signatureData.s,
                      r: signatureData.r,
                      v: signatureData.v as any,
                    }
                  : {
                      deadline: signatureData.deadline,
                      amount: signatureData.amount,
                      s: signatureData.s,
                      r: signatureData.r,
                      v: signatureData.v as any,
                    },
            }
          : {}),
      })
      if (argentWalletContract && trade.inputAmount.currency.isToken) {
        return [
          {
            address: argentWalletContract.address,
            calldata: argentWalletContract.interface.encodeFunctionData('wc_multiCall', [
              [
                approveAmountCalldata(trade.maximumAmountIn(allowedSlippage), swapRouterAddress),
                {
                  to: swapRouterAddress,
                  value,
                  data: calldata,
                },
              ],
            ]),
            value: '0x0',
          },
        ]
      }
      return [
        {
          address: swapRouterAddress,
          calldata,
          value,
        },
      ]
    }
  }, [
    account,
    allowedSlippage,
    argentWalletContract,
    chainId,
    deadline,
    library,
    recipient,
    routerContract,
    signatureData,
    trade,
  ])
}

/**
 * This is hacking out the revert reason from the ethers provider thrown error however it can.
 * This object seems to be undocumented by ethers.
 * @param error an error from the ethers provider
 */
function swapErrorToUserReadableMessage(error: any): string {
  let reason: string | undefined
  while (Boolean(error)) {
    reason = error.reason ?? error.message ?? reason
    error = error.error ?? error.data?.originalError
  }

  if (reason?.indexOf('execution reverted: ') === 0) reason = reason.substr('execution reverted: '.length)

  switch (reason) {
    case 'UniswapV2Router: EXPIRED':
      return t`The transaction could not be sent because the deadline has passed. Please check that your transaction deadline is not too low.`
    case 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT':
    case 'UniswapV2Router: EXCESSIVE_INPUT_AMOUNT':
      return t`This transaction will not succeed either due to price movement or fee on transfer. Try increasing your slippage tolerance.`
    case 'TransferHelper: TRANSFER_FROM_FAILED':
      return t`The input token cannot be transferred. There may be an issue with the input token.`
    case 'UniswapV2: TRANSFER_FAILED':
      return t`The output token cannot be transferred. There may be an issue with the output token.`
    case 'UniswapV2: K':
      return t`The Uniswap invariant x*y=k was not satisfied by the swap. This usually means one of the tokens you are swapping incorporates custom behavior on transfer.`
    case 'Too little received':
    case 'Too much requested':
    case 'STF':
      return t`This transaction will not succeed due to price movement. Try increasing your slippage tolerance. Note: fee on transfer and rebase tokens are incompatible with Uniswap V3.`
    case 'TF':
      return t`The output token cannot be transferred. There may be an issue with the output token. Note: fee on transfer and rebase tokens are incompatible with Uniswap V3.`
    default:
      if (reason?.indexOf('undefined is not an object') !== -1) {
        console.error(error, reason)
        return t`An error occurred when trying to execute this swap. You may need to increase your slippage tolerance. If that does not work, there may be an incompatibility with the token you are trading. Note: fee on transfer and rebase tokens are incompatible with Uniswap V3.`
      }
      return t`Unknown error${
        reason ? `: "${reason}"` : ''
      }. Try increasing your slippage tolerance. Note: fee on transfer and rebase tokens are incompatible with Uniswap V3.`
  }
}

export async function getBestCallOption(
  swapCalls: SwapCall[],
  account: string,
  library: Web3Provider
): Promise<SuccessfulCall | SwapCallEstimate> {
  const estimatedCalls: SwapCallEstimate[] = await Promise.all(
    swapCalls.map((call) => {
      const { address, calldata, value } = call

      const tx =
        !value || isZero(value)
          ? { from: account, to: address, data: calldata }
          : {
              from: account,
              to: address,
              data: calldata,
              value,
            }

      return library
        .estimateGas(tx)
        .then((gasEstimate) => {
          return {
            call,
            gasEstimate,
          }
        })
        .catch((gasError) => {
          console.debug('Gas estimate failed, trying eth_call to extract error', call)

          return library
            .call(tx)
            .then((result) => {
              console.debug('Unexpected successful call after failed estimate gas', call, gasError, result)
              return { call, error: new Error('Unexpected issue with estimating the gas. Please try again.') }
            })
            .catch((callError) => {
              console.debug('Call threw error', call, callError)
              return { call, error: new Error(swapErrorToUserReadableMessage(callError)) }
            })
        })
    })
  )
  // a successful estimation is a bignumber gas estimate and the next call is also a bignumber gas estimate
  let bestCallOption: SuccessfulCall | SwapCallEstimate | undefined = estimatedCalls.find(
    (el, ix, list): el is SuccessfulCall =>
      'gasEstimate' in el && (ix === list.length - 1 || 'gasEstimate' in list[ix + 1])
  )
  // check if any calls errored with a recognizable error
  if (!bestCallOption) {
    const errorCalls = estimatedCalls.filter((call): call is FailedCall => 'error' in call)
    if (errorCalls.length > 0) throw errorCalls[errorCalls.length - 1].error
    const firstNoErrorCall = estimatedCalls.find<SwapCallEstimate>(
      (call): call is SwapCallEstimate => !('error' in call)
    )
    if (!firstNoErrorCall) throw new Error('Unexpected error. Could not estimate gas for the swap.')
    bestCallOption = firstNoErrorCall
  }
  return bestCallOption
}

function transactionSummary(
  trade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType>,
  account: string,
  recipient: string,
  recipientAddressOrName: string | null
): string {
  const inputSymbol = trade.inputAmount.currency.symbol
  const outputSymbol = trade.outputAmount.currency.symbol
  const inputAmount = trade.inputAmount.toSignificant(4)
  const outputAmount = trade.outputAmount.toSignificant(4)

  const base = `Swap ${inputAmount} ${inputSymbol} for ${outputAmount} ${outputSymbol}`
  const withRecipient =
    recipient === account
      ? base
      : `${base} to ${
          recipientAddressOrName && isAddress(recipientAddressOrName)
            ? shortenAddress(recipientAddressOrName)
            : recipientAddressOrName
        }`

  const tradeVersion = getTradeVersion(trade)

  const withVersion = tradeVersion === Version.v3 ? withRecipient : `${withRecipient} on ${tradeVersion}`
  return withVersion
}

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useSwapCallback(
  trade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType> | undefined, // trade to execute, required
  allowedSlippage: Percent, // in bips
  recipientAddressOrName: string | null, // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
  signatureData: SignatureData | undefined | null
): { state: SwapCallbackState; callback: null | (() => Promise<string>); error: string | null } {
  const { account, chainId, library } = useActiveWeb3React()

  const swapCalls = useSwapCallArguments(trade, allowedSlippage, recipientAddressOrName, signatureData)

  const addTransaction = useTransactionAdder()
  const addPrivateTransaction = usePrivateTransactionAdder()

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress
  const frontrunningProtection = useFrontrunningProtection()
  const feesPerGas = useFeesPerGas()

  return useMemo(() => {
    if (!trade || !library || !account || !chainId) {
      return { state: SwapCallbackState.INVALID, callback: null, error: 'Missing dependencies' }
    }
    if (!recipient) {
      if (recipientAddressOrName !== null) {
        return { state: SwapCallbackState.INVALID, callback: null, error: 'Invalid recipient' }
      } else {
        return { state: SwapCallbackState.LOADING, callback: null, error: null }
      }
    }

    let isMetaMask: boolean | undefined = Boolean(library?.provider?.isMetaMask)

    return {
      state: SwapCallbackState.VALID,
      callback: async function onSwap(): Promise<string> {
        const bestCallOption = await getBestCallOption(swapCalls, account, library)

        const {
          call: { address, calldata, value },
        } = bestCallOption

        const transaction = {
          from: account,
          to: address,
          data: calldata,
          // let the wallet try if we can't estimate the gas
          ...('gasEstimate' in bestCallOption
            ? { gasLimit: calculateGasMargin(chainId, bestCallOption.gasEstimate) }
            : {}),
          ...(value && !isZero(value) ? { value } : {}),
        }
        if (frontrunningProtection && isMetaMask && chainId === 1) {
          let web3Provider: Web3Provider | undefined
          // ethers will change eth_sign to personal_sign if it detects metamask
          if (library instanceof Web3Provider) {
            web3Provider = library as Web3Provider
            isMetaMask = web3Provider.provider.isMetaMask
            web3Provider.provider.isMetaMask = false
          }
          const nonce = await library.getTransactionCount(recipient)
          const populatedTx: PopulatedTransaction = {
            to: transaction.to,
            nonce,
            chainId,
            type: 2,
            data: transaction.data,
            gasLimit: transaction.gasLimit,
            maxFeePerGas: feesPerGas.maxFeePerGas,
            maxPriorityFeePerGas: feesPerGas.maxPriorityFeePerGas,
            ...(value && !isZero(value) ? { value: BigNumber.from(value) } : {}),
          }
          delete populatedTx.from
          const serialized = serializeTransaction(populatedTx)
          const hash = keccak256(serialized)
          return library
            .jsonRpcFetchFunc('eth_sign', [account, hash])
            .then((signature: SignatureLike) => serializeTransaction(populatedTx, signature))
            .catch((error) => {
              // otherwise, the error was unexpected and we need to convey that
              console.error(`Failed to sign transaction`, error, address, calldata, value)
              if (web3Provider) {
                web3Provider.provider.isMetaMask = true
              }
              throw new Error(`Swap failed: ${swapErrorToUserReadableMessage(error)}`)
            })
            .then((rawSignedTransaction) => {
              if (web3Provider) {
                web3Provider.provider.isMetaMask = true
              }

              /**
               * Hack for detecting hardware wallets connected through metamask
               * Hardware wallets cannot sign with eth_sign. A direct hardware wallet connection should be used instead
               */
              const parsed = parseTransaction(rawSignedTransaction)
              if (parsed.from !== account) {
                throw new Error(
                  'Hardware wallets connected through MetaMask cannot sign frontrunning protected transactions. Use a standard MetaMask wallet instead.'
                )
              }

              const hash = keccak256(rawSignedTransaction)
              const bundle: BundleReq = {
                transactions: [rawSignedTransaction],
              }
              const summary = transactionSummary(trade, account, recipient, recipientAddressOrName)
              addPrivateTransaction(
                {
                  hash,
                },
                {
                  summary,
                }
              )
              emitTransactionRequest(bundle)
              return hash
            })
        } else {
          return library
            .getSigner()
            .sendTransaction(transaction)
            .then((response) => {
              const summary = transactionSummary(trade, account, recipient, recipientAddressOrName)
              addTransaction(response, {
                summary,
              })
              return response.hash
            })
            .catch((error) => {
              // if the user rejected the tx, pass this along
              if (error?.code === 4001) {
                throw new Error('Transaction rejected.')
              } else {
                // otherwise, the error was unexpected and we need to convey that
                console.error(`Swap failed`, error, address, calldata, value)

                throw new Error(`Swap failed: ${swapErrorToUserReadableMessage(error)}`)
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
    recipient,
    recipientAddressOrName,
    swapCalls,
    frontrunningProtection,
    addTransaction,
    addPrivateTransaction,
    feesPerGas,
  ])
}
