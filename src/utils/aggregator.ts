import JSBI from 'jsbi'
import {
  ChainId,
  Currency,
  CurrencyAmount,
  Fraction,
  Percent,
  Price,
  TokenAmount,
  TradeType,
} from '@kyberswap/ks-sdk-core'
import { DEX_TO_COMPARE, DexConfig, dexIds, dexListConfig, dexTypes } from 'constants/dexes'
import invariant from 'tiny-invariant'
import { AggregationComparer } from 'state/swap/types'
import { GasPrice } from 'state/application/reducer'
import { reportException } from 'utils/sentry'
import { ETHER_ADDRESS, KYBERSWAP_SOURCE, sentryRequestId } from 'constants/index'
import { FeeConfig } from 'hooks/useSwapV2Callback'
import fetchWaiting from 'utils/fetchWaiting'

type ExchangeConfig = { id: number; type: number } & DexConfig

export const getExchangeConfig = (exchange: string, chainId: ChainId): ExchangeConfig => {
  if (!exchange) {
    return {} as ExchangeConfig
  }
  const getKeyValue = <T extends object, U extends keyof T>(obj: T) => (key: U) => obj[key]
  const ids = (chainId && dexIds[chainId]) || {}
  const types = (chainId && dexTypes[chainId]) || {}
  const allIds = Object.assign({}, dexIds.all || {}, ids)
  const allTypes = Object.assign({}, dexTypes.all || {}, types)
  return {
    ...(getKeyValue(dexListConfig)(exchange) || {}),
    id: getKeyValue(allIds)(exchange) ?? 1,
    type: getKeyValue(allTypes)(exchange) ?? 0,
  }
}

/**
 */
export class Aggregator {
  /**
   * The type of the trade, either exact in or exact out.
   */
  public readonly tradeType: TradeType
  /**
   * The input amount for the trade assuming no slippage.
   */
  public readonly inputAmount: CurrencyAmount<Currency>
  /**
   * The output amount for the trade assuming no slippage.
   */
  public readonly outputAmount: CurrencyAmount<Currency>
  /**
   */
  public readonly swaps: any[][]
  /**
   */
  public readonly tokens: any
  /**
   * The price expressed in terms of output amount/input amount.
   */
  public readonly executionPrice: Price<Currency, Currency>

  public readonly amountInUsd: number
  public readonly amountOutUsd: number
  public readonly receivedUsd: number
  public readonly gasUsd: number
  // -1 mean can not get price of token => can not calculate price impact
  public readonly priceImpact: number
  public readonly encodedSwapData: string
  public readonly routerAddress: string

  public constructor(
    inputAmount: CurrencyAmount<Currency>,
    outputAmount: CurrencyAmount<Currency>,
    amountInUsd: number,
    amountOutUsd: number,
    receivedUsd: number,
    swaps: any[][],
    tokens: any,
    tradeType: TradeType,
    gasUsd: number,
    priceImpact: number,
    encodedSwapData: string,
    routerAddress: string,
  ) {
    this.tradeType = tradeType
    this.inputAmount = inputAmount
    this.outputAmount = outputAmount
    this.amountInUsd = amountInUsd
    this.amountOutUsd = amountOutUsd
    this.receivedUsd = receivedUsd
    this.executionPrice = new Price(
      this.inputAmount.currency,
      this.outputAmount.currency,
      this.inputAmount.quotient,
      this.outputAmount.quotient,
    )
    this.swaps = swaps
    this.tokens = tokens
    this.gasUsd = gasUsd
    this.priceImpact = priceImpact
    this.encodedSwapData = encodedSwapData
    this.routerAddress = routerAddress
  }

  /**
   * Get the minimum amount that must be received from this trade for the given slippage tolerance
   * @param slippageTolerance tolerance of unfavorable slippage from the execution price of this trade
   */
  public minimumAmountOut(slippageTolerance: Percent): CurrencyAmount<Currency> {
    invariant(!slippageTolerance.lessThan(JSBI.BigInt(0)), 'SLIPPAGE_TOLERANCE')
    if (this.tradeType === TradeType.EXACT_OUTPUT) {
      return this.outputAmount
    } else {
      const slippageAdjustedAmountOut = new Fraction(JSBI.BigInt(1))
        .add(slippageTolerance)
        .invert()
        .multiply(this.outputAmount.quotient).quotient
      return TokenAmount.fromRawAmount(this.outputAmount.currency, slippageAdjustedAmountOut)
    }
  }

  /**
   * Get the maximum amount in that can be spent via this trade for the given slippage tolerance
   * @param slippageTolerance tolerance of unfavorable slippage from the execution price of this trade
   */
  public maximumAmountIn(slippageTolerance: Percent): CurrencyAmount<Currency> {
    invariant(!slippageTolerance.lessThan(JSBI.BigInt(0)), 'SLIPPAGE_TOLERANCE')
    if (this.tradeType === TradeType.EXACT_INPUT) {
      return this.inputAmount
    } else {
      const slippageAdjustedAmountIn = new Fraction(JSBI.BigInt(1))
        .add(slippageTolerance)
        .multiply(this.inputAmount.quotient).quotient
      return TokenAmount.fromRawAmount(this.inputAmount.currency, slippageAdjustedAmountIn)
    }
  }

  /**
   * @param baseURL
   * @param currencyAmountIn exact amount of input currency to spend
   * @param currencyOut the desired currency out
   * @param saveGas
   * @param dexes
   * @param gasPrice
   * @param slippageTolerance
   * @param deadline
   * @param to
   * @param feeConfig
   * @param signal
   * @param minimumLoadingTime
   */
  public static async bestTradeExactIn(
    baseURL: string,
    currencyAmountIn: CurrencyAmount<Currency>,
    currencyOut: Currency,
    saveGas = false,
    gasPrice: GasPrice | undefined,
    dexes = '',
    slippageTolerance: number,
    deadline: number | undefined,
    to: string,
    feeConfig: FeeConfig | undefined,
    signal: AbortSignal,
    minimumLoadingTime: number,
  ): Promise<Aggregator | null> {
    const chainId: ChainId | undefined = currencyAmountIn.currency.chainId || currencyOut.chainId

    invariant(chainId !== undefined, 'CHAIN_ID')

    const amountIn = currencyAmountIn
    const tokenOut = currencyOut.wrapped

    const tokenInAddress = currencyAmountIn.currency.isNative ? ETHER_ADDRESS : amountIn.currency.wrapped.address
    const tokenOutAddress = currencyOut.isNative ? ETHER_ADDRESS : tokenOut.address
    if (tokenInAddress && tokenOutAddress) {
      const search = new URLSearchParams({
        // Trade config
        tokenIn: tokenInAddress.toLowerCase(),
        tokenOut: tokenOutAddress.toLowerCase(),
        amountIn: currencyAmountIn.quotient?.toString(),
        saveGas: saveGas ? '1' : '0',
        gasInclude: saveGas ? '1' : '0',
        ...(gasPrice && !!+gasPrice.standard
          ? {
              gasPrice: gasPrice.standard,
            }
          : {}),
        ...(dexes ? { dexes } : {}),
        slippageTolerance: slippageTolerance?.toString() ?? '',
        deadline: deadline?.toString() ?? '',
        to,

        // Fee config
        chargeFeeBy: feeConfig?.chargeFeeBy ?? '',
        feeReceiver: feeConfig?.feeReceiver ?? '',
        isInBps: feeConfig?.isInBps !== undefined ? (feeConfig.isInBps ? '1' : '0') : '',
        feeAmount: feeConfig?.feeAmount ?? '',

        // Client data
        clientData: KYBERSWAP_SOURCE,
      })
      try {
        const response = await fetchWaiting(
          `${baseURL}?${search}`,
          {
            signal,
            headers: {
              'X-Request-Id': sentryRequestId,
              'Accept-Version': 'Latest',
            },
          },
          minimumLoadingTime,
        )
        const result = await response.json()
        if (
          !result?.inputAmount ||
          !result?.outputAmount ||
          result.inputAmount === '0' ||
          result.outputAmount === '0'
        ) {
          return null
        }

        const toCurrencyAmount = function(value: string, currency: Currency): CurrencyAmount<Currency> {
          return TokenAmount.fromRawAmount(currency, JSBI.BigInt(value))
        }

        const outputAmount = toCurrencyAmount(result.outputAmount, currencyOut)

        const priceImpact = !result.amountOutUsd
          ? -1
          : ((-result.amountOutUsd + result.amountInUsd) * 100) / result.amountInUsd

        const { encodedSwapData, routerAddress } = result

        return new Aggregator(
          currencyAmountIn,
          outputAmount,
          result.amountInUsd,
          result.amountOutUsd,
          result.receivedUsd,
          result.swaps || [],
          result.tokens || {},
          TradeType.EXACT_INPUT,
          result.gasUsd,
          priceImpact,
          encodedSwapData,
          routerAddress,
        )
      } catch (e) {
        console.error(e)
        // ignore aborted request error
        if (!e?.message?.includes('Fetch is aborted') && !e?.message?.includes('The user aborted a request')) {
          reportException(e)
        }
      }
    }

    return null
  }

  /**
   * @param baseURL
   * @param currencyAmountIn exact amount of input currency to spend
   * @param currencyOut the desired currency out
   * @param slippageTolerance
   * @param deadline
   * @param to
   * @param feeConfig
   * @param signal
   * @param minimumLoadingTime
   */
  public static async compareDex(
    baseURL: string,
    currencyAmountIn: CurrencyAmount<Currency>,
    currencyOut: Currency,
    slippageTolerance: number,
    deadline: number | undefined,
    to: string,
    feeConfig: FeeConfig | undefined,
    signal: AbortSignal,
    minimumLoadingTime: number,
  ): Promise<AggregationComparer | null> {
    const chainId: ChainId | undefined = currencyAmountIn.currency.chainId || currencyOut.chainId
    invariant(chainId !== undefined, 'CHAIN_ID')

    const amountIn = currencyAmountIn
    const tokenOut = currencyOut.wrapped

    const tokenInAddress = currencyAmountIn.currency.isNative ? ETHER_ADDRESS : amountIn.currency.wrapped.address
    const tokenOutAddress = currencyOut.isNative ? ETHER_ADDRESS : tokenOut.address
    const comparedDex = DEX_TO_COMPARE[chainId]

    if (tokenInAddress && tokenOutAddress && comparedDex?.value) {
      const search = new URLSearchParams({
        // Trade config
        tokenIn: tokenInAddress.toLowerCase(),
        tokenOut: tokenOutAddress.toLowerCase(),
        amountIn: currencyAmountIn.quotient?.toString(),
        saveGas: '0',
        gasInclude: '1',
        dexes: comparedDex.value,
        slippageTolerance: slippageTolerance?.toString() ?? '',
        deadline: deadline?.toString() ?? '',
        to,

        // Fee config
        chargeFeeBy: feeConfig?.chargeFeeBy ?? '',
        feeReceiver: feeConfig?.feeReceiver ?? '',
        isInBps: feeConfig?.isInBps !== undefined ? (feeConfig.isInBps ? '1' : '0') : '',
        feeAmount: feeConfig?.feeAmount ?? '',

        // Client data
        clientData: KYBERSWAP_SOURCE,
      })
      try {
        // const promises: any[] = [
        //   fetch(`${baseURL}?${search}`),
        //   fetch(`${basePriceURL}/api/price/token-price?addresses=${tokenOutAddress}`)
        // ]
        // const [resSwap, resPrice] = await Promise.all(promises)
        // const [swapData, priceData] = await Promise.all([resSwap.json(), resPrice.json()])
        // if (!swapData?.inputAmount || !swapData?.outputAmount || !priceData?.data) {
        //   return null
        // }

        const response = await fetchWaiting(
          `${baseURL}?${search}`,
          {
            signal,
            headers: {
              'X-Request-Id': sentryRequestId,
              'Accept-Version': 'Latest',
            },
          },
          minimumLoadingTime,
        )
        const swapData = await response.json()

        if (!swapData?.inputAmount || !swapData?.outputAmount) {
          return null
        }

        const toCurrencyAmount = function(value: string, currency: Currency): CurrencyAmount<Currency> {
          return TokenAmount.fromRawAmount(currency, JSBI.BigInt(value))
        }

        const inputAmount = toCurrencyAmount(swapData.inputAmount, currencyAmountIn.currency)
        const outputAmount = toCurrencyAmount(swapData.outputAmount, currencyOut)
        const amountInUsd = swapData.amountInUsd
        const amountOutUsd = swapData.amountOutUsd
        const receivedUsd = swapData.receivedUsd

        // const outputPriceUSD = priceData.data[tokenOutAddress] || Object.values(priceData.data[0]) || '0'
        return {
          inputAmount,
          outputAmount,
          amountInUsd,
          amountOutUsd,
          receivedUsd,
          // outputPriceUSD: parseFloat(outputPriceUSD),
          comparedDex,
        }
      } catch (e) {
        console.error(e)
        reportException(e)
      }
    }

    return null
  }
}
