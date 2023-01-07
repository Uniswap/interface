import { BigNumber } from '@ethersproject/bignumber'
// eslint-disable-next-line no-restricted-imports
import { t, Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Percent, Price, Token, TradeType } from '@uniswap/sdk-core'
import { encodeSqrtRatioX96, toHex, Trade as V3Trade } from '@uniswap/v3-sdk'
import { LIMIT_ORDER_MANAGER_ADDRESSES } from 'constants/addresses'
import { WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import { poll } from 'ethers/lib/utils'
import { ReactNode, useMemo } from 'react'
import { useUserSlippageToleranceWithDefault } from 'state/user/hooks'
import { calculateSlippageAmount } from 'utils/calculateSlippageAmount'

import { TransactionType } from '../state/transactions/actions'
import { useTransactionAdder } from '../state/transactions/hooks'
import approveAmountCalldata from '../utils/approveAmountCalldata'
import { calculateGasMargin } from '../utils/calculateGasMargin'
import { currencyId } from '../utils/currencyId'
import isZero from '../utils/isZero'
import { useArgentWalletContract } from './useArgentWalletContract'
import { useKromatikaRouter, useLimitOrderManager, useUniswapUtils } from './useContract'
import useENS from './useENS'
import { SignatureData } from './useERC20Permit'
import { useGaslessCallback } from './useGaslessCallback'
import { useActiveWeb3React } from './web3'

const DEFAULT_REMOVE_LIQUIDITY_SLIPPAGE_TOLERANCE = new Percent(50, 10_000)

enum SwapCallbackState {
  INVALID,
  LOADING,
  VALID,
}

interface SwapCall {
  address: string
  calldata: string
  value: string
}

interface SwapCallEstimate {
  call: SwapCall
}

interface SuccessfulCall extends SwapCallEstimate {
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
function useSwapCallArguments(
  trade: V3Trade<Currency, Currency, TradeType> | undefined, // trade to execute, required
  gasAmount: CurrencyAmount<Currency> | undefined,
  recipientAddressOrName: string | null, // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
  signatureData: SignatureData | null | undefined,
  parsedAmount: CurrencyAmount<Currency> | undefined,
  priceAmount: Price<Currency, Currency> | undefined,
  serviceFee: CurrencyAmount<Currency> | undefined
): SwapCall[] {
  const { account, chainId, library } = useActiveWeb3React()

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress
  const limitOrderManager = useLimitOrderManager()
  const uniswapUtils = useUniswapUtils()
  const argentWalletContract = useArgentWalletContract()

  const allowedSlippage = useUserSlippageToleranceWithDefault(DEFAULT_REMOVE_LIQUIDITY_SLIPPAGE_TOLERANCE) // custom from users

  const priceInfo = useMemo(() => {
    if (!chainId || !priceAmount || !parsedAmount) return undefined

    const value = parsedAmount.currency.isNative ? toHex(parsedAmount.quotient) : toHex('0')

    const weth = WRAPPED_NATIVE_CURRENCY[chainId]

    const token0: Token = parsedAmount.currency.isToken ? parsedAmount.currency.wrapped : weth
    const token1: Token = priceAmount.quoteCurrency.isToken ? priceAmount.quoteCurrency.wrapped : weth
    let amount0: CurrencyAmount<Currency> = parsedAmount
    let amount1: CurrencyAmount<Currency> = CurrencyAmount.fromRawAmount(priceAmount.quoteCurrency, 0)

    // sort tokens
    const sortedTokens: Token[] = token0.sortsBefore(token1) ? [token0, token1] : [token1, token0]

    let targetPrice = priceAmount

    if (sortedTokens[1] == token0) {
      // invert
      ;[amount0, amount1] = [amount1, amount0]
      targetPrice = priceAmount.invert()
    }

    const amount0Min = calculateSlippageAmount(amount0, allowedSlippage)[0]
    const amount1Min = calculateSlippageAmount(amount1, allowedSlippage)[0]
    const sqrtPriceX96 = encodeSqrtRatioX96(targetPrice.numerator, targetPrice.denominator)?.toString()

    return {
      sqrtPriceX96,
      sortedTokens,
      amount0: toHex(amount0?.quotient),
      amount1: toHex(amount1?.quotient),
      amount0Min: toHex(amount0Min),
      amount1Min: toHex(amount1Min),
    }
  }, [allowedSlippage, chainId, parsedAmount, priceAmount])

  // const [userTickSize, setUserTickSize] = useUserTickSize()

  // const poolAddress = useMemo(() => {
  //   const v3CoreFactoryAddress = chainId && V3_CORE_FACTORY_ADDRESSES[chainId]
  //   if (!v3CoreFactoryAddress || !priceInfo || !trade) return undefined
  //   return computePoolAddress({
  //     factoryAddress: v3CoreFactoryAddress,
  //     tokenA: priceInfo?.sortedTokens[0],
  //     tokenB: priceInfo?.sortedTokens[1],
  //     fee: trade?.route.pools[0].fee,
  //   })
  // }, [chainId, priceInfo, trade])

  // const { result: estimatedTicks } = useSingleCallResult(uniswapUtils, 'calculateLimitTicks', [
  //   poolAddress?.toString() ?? undefined,
  //   priceInfo?.sqrtPriceX96 ?? undefined,
  //   priceInfo?.amount0 ?? undefined,
  //   priceInfo?.amount1 ?? undefined,
  //   userTickSize,
  // ])

  return useMemo(() => {
    if (
      !trade ||
      !recipient ||
      !library ||
      !account ||
      !chainId ||
      !limitOrderManager ||
      !parsedAmount ||
      !priceAmount ||
      !priceInfo ||
      !gasAmount
    )
      return []
    // trade is V3Trade
    const limitManagerAddress = limitOrderManager.address
    if (!limitManagerAddress) return []

    const calldatas: string[] = []

    if (signatureData) {
      // create call data
      const inputTokenPermit =
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
            }

      if ('nonce' in inputTokenPermit) {
        calldatas.push(
          limitOrderManager.interface.encodeFunctionData('selfPermitAllowed', [
            parsedAmount.currency.isToken ? parsedAmount.currency.address : undefined,
            inputTokenPermit.nonce,
            inputTokenPermit.expiry,
            inputTokenPermit.v,
            inputTokenPermit.r,
            inputTokenPermit.s,
          ])
        )
      } else {
        calldatas.push(
          limitOrderManager.interface.encodeFunctionData('selfPermit', [
            parsedAmount.currency.isToken ? parsedAmount.currency.address : undefined,
            inputTokenPermit.amount,
            inputTokenPermit.deadline,
            inputTokenPermit.v,
            inputTokenPermit.r,
            inputTokenPermit.s,
          ])
        )
      }
    }

    const value = parsedAmount.currency.isNative ? toHex(parsedAmount.quotient) : toHex('0')

    calldatas.push(
      limitOrderManager.interface.encodeFunctionData('placeLimitOrder', [
        {
          _token0: priceInfo?.sortedTokens[0].address,
          _token1: priceInfo?.sortedTokens[1].address,
          _fee: trade.route.pools[0].fee.toString(),
          _sqrtPriceX96: priceInfo?.sqrtPriceX96,
          _amount0: priceInfo?.amount0,
          _amount1: priceInfo?.amount1,
          _amount0Min: priceInfo?.amount0Min,
          _amount1Min: priceInfo?.amount1Min,
        },
      ])
    )

    const calldata =
      calldatas.length === 1 ? calldatas[0] : limitOrderManager.interface.encodeFunctionData('multicall', [calldatas])

    if (argentWalletContract && parsedAmount.currency.isToken) {
      return [
        {
          address: argentWalletContract.address,
          calldata: argentWalletContract.interface.encodeFunctionData('wc_multiCall', [
            [
              approveAmountCalldata(parsedAmount, limitManagerAddress),
              {
                to: limitManagerAddress,
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
        address: limitManagerAddress,
        calldata,
        value,
      },
    ]
  }, [
    trade,
    recipient,
    library,
    account,
    chainId,
    limitOrderManager,
    parsedAmount,
    priceAmount,
    priceInfo,
    gasAmount,
    signatureData,
    argentWalletContract,
  ])
}

/**
 * This is hacking out the revert reason from the ethers provider thrown error however it can.
 * This object seems to be undocumented by ethers.
 * @param error an error from the ethers provider
 */
function swapErrorToUserReadableMessage(error: any): ReactNode {
  let reason: string | undefined
  while (Boolean(error)) {
    reason = error.reason ?? error.message ?? reason
    error = error.error ?? error.data?.originalError
  }

  if (reason?.indexOf('execution reverted: ') === 0) reason = reason.substr('execution reverted: '.length)

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
          transfer and rebase tokens are incompatible with Kromatika.
        </Trans>
      )
    case 'TF':
      return (
        <Trans>
          The output token cannot be transferred. There may be an issue with the output token. Note: fee on transfer and
          rebase tokens are incompatible with Kromatika.
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
export function useSwapCallback(
  trade: V3Trade<Currency, Currency, TradeType> | undefined, // trade to execute, required
  gasAmount: CurrencyAmount<Currency> | undefined,
  recipientAddressOrName: string | null, // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
  signatureData: SignatureData | undefined | null,
  parsedAmount: CurrencyAmount<Currency> | undefined,
  priceAmount: Price<Currency, Currency> | undefined,
  serviceFee: CurrencyAmount<Currency> | undefined
): { state: SwapCallbackState; callback: null | (() => Promise<string>); error: ReactNode | null } {
  const { account, chainId, library } = useActiveWeb3React()

  const { gaslessCallback } = useGaslessCallback()

  // FIXME disabled
  const isExpertMode = false

  const kromatikaRouter = useKromatikaRouter()

  const swapCalls = useSwapCallArguments(
    trade,
    gasAmount,
    recipientAddressOrName,
    signatureData,
    parsedAmount,
    priceAmount,
    serviceFee
  )

  const addTransaction = useTransactionAdder()

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress

  return useMemo(() => {
    if (!trade || !library || !account || !chainId || !priceAmount || !parsedAmount) {
      return { state: SwapCallbackState.INVALID, callback: null, error: <Trans>Missing dependencies</Trans> }
    }
    if (!recipient) {
      if (recipientAddressOrName !== null) {
        return { state: SwapCallbackState.INVALID, callback: null, error: <Trans>Invalid recipient</Trans> }
      } else {
        return { state: SwapCallbackState.LOADING, callback: null, error: null }
      }
    }

    return {
      state: SwapCallbackState.VALID,
      callback: async function onSwap(): Promise<string> {
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
                    return { call, error: <Trans>Unexpected issue with estimating the gas. Please try again.</Trans> }
                  })
                  .catch((callError) => {
                    console.debug('Call threw error', call, callError)
                    return { call, error: swapErrorToUserReadableMessage(callError) }
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
          if (!firstNoErrorCall) throw new Error(t`Unexpected error. Could not estimate gas for the swap.`)
          bestCallOption = firstNoErrorCall
        }

        const {
          call: { address, calldata, value },
        } = bestCallOption

        if (isExpertMode && kromatikaRouter) {
          const routerCalldata = kromatikaRouter.interface.encodeFunctionData('execute', [
            LIMIT_ORDER_MANAGER_ADDRESSES[chainId],
            calldata,
          ])

          const gasLimit =
            'gasEstimate' in bestCallOption ? { gasLimit: calculateGasMargin(chainId, bestCallOption.gasEstimate) } : {}
          const txParams = {
            data: routerCalldata,
            to: kromatikaRouter.address,
            from: account,
            gasLimit: gasLimit ? gasLimit?.gasLimit?.add(100000).toHexString() : 700000,
            signatureType: 'EIP712_SIGN',
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

              return response.hash
            })
            .catch((error) => {
              // if the user rejected the tx, pass this along
              if (error?.code === 4001) {
                throw new Error(t`Transaction rejected.`)
              } else {
                // otherwise, the error was unexpected and we need to convey that
                console.error(`Swap failed`, error, address, calldata, value)

                throw new Error(t`Swap failed: ${swapErrorToUserReadableMessage(error)}`)
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
    priceAmount,
    parsedAmount,
    recipient,
    recipientAddressOrName,
    swapCalls,
    isExpertMode,
    kromatikaRouter,
    gaslessCallback,
    addTransaction,
  ])
}
