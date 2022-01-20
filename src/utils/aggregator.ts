import { BigNumber, ethers } from 'ethers'
import {
  ChainId,
  Currency,
  CurrencyAmount,
  ETHER,
  Fraction,
  JSBI,
  ONE,
  Percent,
  Price,
  Token,
  TokenAmount,
  TradeType,
  WETH,
  ZERO
} from '@dynamic-amm/sdk'
import { DEX_TO_COMPARE, DexConfig, dexIds, dexListConfig, dexTypes } from '../constants/dexes'
import invariant from 'tiny-invariant'
import { AggregationComparer } from 'state/swap/types'
import { GasPrice } from 'state/application/reducer'
import { sentryRequestId } from 'index'
import { reportException } from 'utils/sentry'

function dec2bin(dec: number, length: number): string {
  // let bin = (dec >>> 0).toString(2)
  let bin = dec.toString(2)
  // const maxBinLength = maxDec ? (maxDec >>> 0).toString(2).length : null
  const maxBinLength = length || null
  if (maxBinLength && maxBinLength > bin.length) {
    const zeros = new Array(maxBinLength - bin.length + 1).join('0')
    bin = zeros + bin
  }
  return bin
}

function bin2dec(binaryNumber: string): number {
  return parseInt((binaryNumber + '').replace(/[^01]/gi, ''), 2)
}

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
    type: getKeyValue(allTypes)(exchange) ?? 0
  }
}

function encodeParameters(types: any[], values: any[]): string {
  const abi = new ethers.utils.AbiCoder()
  return abi.encode(types, values)
}

function encodeUniSwap(data: any) {
  return encodeParameters(
    ['address', 'address', 'address', 'address', 'uint256', 'uint256'],
    [data.pool, data.tokenIn, data.tokenOut, data.recipient, data.collectAmount, data.limitReturnAmount || '0']
  )
}

function encodeStableSwap(data: any) {
  return encodeParameters(
    ['address', 'address', 'address', 'int128', 'int128', 'uint256', 'uint256', 'uint256', 'address'],
    [
      data.pool,
      data.tokenIn,
      data.tokenOut,
      data.extra?.tokenInIndex,
      data.extra?.tokenOutIndex,
      data.swapAmount,
      data.limitReturnAmount || '0',
      data.poolLength,
      data.pool
    ]
  )
}

function encodeCurveSwap(data: any) {
  const poolType = data.poolType?.toLowerCase()
  // curve-base: exchange
  // curve-meta: exchange_underlying
  const usePoolUnderlying = data.extra?.underlying
  const isTriCrypto = poolType === 'curve-tricrypto'

  return encodeParameters(
    ['address', 'address', 'address', 'int128', 'int128', 'uint256', 'uint256', 'bool', 'bool'],
    [
      data.pool,
      data.tokenIn,
      data.tokenOut,
      data.extra?.tokenInIndex,
      data.extra?.tokenOutIndex,
      data.swapAmount,
      '0',
      usePoolUnderlying,
      isTriCrypto
    ]
  )
}

function encodeBalancerSwap(data: any) {
  return encodeParameters(
    ['address', 'bytes32', 'address', 'address', 'uint256', 'uint256'],
    [data.extra?.vault, data.pool, data.tokenIn, data.tokenOut, data.swapAmount, data.limitReturnAmount || '0']
  )
}

export function isEncodeUniswapCallback(chainId: ChainId): (swap: any) => boolean {
  return swap => {
    const dex = getExchangeConfig(swap.exchange, chainId)
    if (dex.type === 1 || dex.type === 4) {
      return false
    } else if (dex.type === 2) {
      return false
    } else if (dex.type === 6) {
      return false
    } else {
      return true
    }
  }
}

export function encodeSwapExecutor(swaps: any[][], chainId: ChainId) {
  return swaps.map(swap => {
    return swap.map(sequence => {
      // (0 uni, 1 one swap, 2 curve)
      const dex = getExchangeConfig(sequence.exchange, chainId)
      // dexOption: 16 bit (first 8 bit for dextype + last 8 bit is dexIds in uni swap type)
      const dexOption = dec2bin(dex.type, 8) + dec2bin(dex.id, 8)
      let data: string
      if (dex.type === 1 || dex.type === 4) {
        data = encodeStableSwap(sequence)
      } else if (dex.type === 2) {
        data = encodeCurveSwap(sequence)
      } else if (dex.type === 6) {
        data = encodeBalancerSwap(sequence)
      } else {
        data = encodeUniSwap(sequence)
      }
      return { data, dexOption: bin2dec(dexOption) }
    })
  })
}

export function encodeFeeConfig({
  feeReceiver,
  isInBps,
  feeAmount
}: {
  feeReceiver: string
  isInBps: boolean
  feeAmount: string
}) {
  return encodeParameters(['address', 'bool', 'uint256'], [feeReceiver, isInBps, feeAmount])
}

export function encodeSimpleModeData(data: {
  firstPools: string[]
  firstSwapAmounts: string[]
  swapSequences: { data: string; dexOption: any }[][]
  deadline: string
  destTokenFeeData: string
}) {
  const bytesDes = encodeParameters(
    ['address[]', 'uint256[]', 'bytes[]', 'uint256', 'bytes'],
    [
      data.firstPools,
      data.firstSwapAmounts,
      data.swapSequences.map(item => {
        const data = item.map(inner => {
          return [inner.data, inner.dexOption]
        })
        return encodeParameters(['(bytes,uint16)[]'], [data])
      }),
      data.deadline,
      data.destTokenFeeData
    ]
  )
  // 0x...20 means first dynamic param's location.
  return '0x0000000000000000000000000000000000000000000000000000000000000020'.concat(bytesDes.toString().slice(2))
}

/**
 * Given a currency amount and a chain ID, returns the equivalent representation as the token amount.
 * In other words, if the currency is ETHER, returns the WETH token amount for the given chain. Otherwise, returns
 * the input currency amount.
 */
function wrappedAmount2(currencyAmount: CurrencyAmount, chainId: ChainId): TokenAmount {
  if (currencyAmount instanceof TokenAmount) return currencyAmount
  if (currencyAmount.currency === ETHER) return new TokenAmount(WETH[chainId], currencyAmount.raw)
  invariant(false, 'CURRENCY')
}

function wrappedCurrency2(currency: Currency, chainId: ChainId): Token {
  if (currency instanceof Token) return currency
  if (currency === ETHER) return WETH[chainId]
  invariant(false, 'CURRENCY')
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
  public readonly inputAmount: CurrencyAmount
  /**
   * The output amount for the trade assuming no slippage.
   */
  public readonly outputAmount: CurrencyAmount
  /**
   */
  public readonly swaps: any[][]
  /**
   */
  public readonly tokens: any
  /**
   * The price expressed in terms of output amount/input amount.
   */
  public readonly executionPrice: Price

  public readonly amountInUsd: string
  public readonly amountOutUsd: string
  public readonly receivedUsd: string
  public readonly gasUsd: number
  public readonly priceImpact: number

  public constructor(
    inputAmount: CurrencyAmount,
    outputAmount: CurrencyAmount,
    amountInUsd: string,
    amountOutUsd: string,
    receivedUsd: string,
    swaps: any[][],
    tokens: any,
    tradeType: TradeType,
    gasUsd: number,
    priceImpact: number
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
      this.inputAmount.raw,
      this.outputAmount.raw
    )
    this.swaps = swaps
    this.tokens = tokens
    this.gasUsd = gasUsd
    this.priceImpact = priceImpact
  }

  /**
   * Get the minimum amount that must be received from this trade for the given slippage tolerance
   * @param slippageTolerance tolerance of unfavorable slippage from the execution price of this trade
   */
  public minimumAmountOut(slippageTolerance: Percent): CurrencyAmount {
    invariant(!slippageTolerance.lessThan(ZERO), 'SLIPPAGE_TOLERANCE')
    if (this.tradeType === TradeType.EXACT_OUTPUT) {
      return this.outputAmount
    } else {
      const slippageAdjustedAmountOut = new Fraction(ONE)
        .add(slippageTolerance)
        .invert()
        .multiply(this.outputAmount.raw).quotient
      return this.outputAmount instanceof TokenAmount
        ? new TokenAmount(this.outputAmount.token, slippageAdjustedAmountOut)
        : CurrencyAmount.ether(slippageAdjustedAmountOut)
    }
  }

  /**
   * Get the maximum amount in that can be spent via this trade for the given slippage tolerance
   * @param slippageTolerance tolerance of unfavorable slippage from the execution price of this trade
   */
  public maximumAmountIn(slippageTolerance: Percent): CurrencyAmount {
    invariant(!slippageTolerance.lessThan(ZERO), 'SLIPPAGE_TOLERANCE')
    if (this.tradeType === TradeType.EXACT_INPUT) {
      return this.inputAmount
    } else {
      const slippageAdjustedAmountIn = new Fraction(ONE).add(slippageTolerance).multiply(this.inputAmount.raw).quotient
      return this.inputAmount instanceof TokenAmount
        ? new TokenAmount(this.inputAmount.token, slippageAdjustedAmountIn)
        : CurrencyAmount.ether(slippageAdjustedAmountIn)
    }
  }

  /**
   * @param baseURL
   * @param currencyAmountIn exact amount of input currency to spend
   * @param currencyOut the desired currency out
   * @param saveGas
   */
  public static async bestTradeExactIn(
    baseURL: string,
    currencyAmountIn: CurrencyAmount,
    currencyOut: Currency,
    saveGas = false,
    dexes = '',
    gasPrice?: GasPrice,
    signal?: AbortSignal
  ): Promise<Aggregator | null> {
    const chainId: ChainId | undefined =
      currencyAmountIn instanceof TokenAmount
        ? currencyAmountIn.token.chainId
        : currencyOut instanceof Token
        ? currencyOut.chainId
        : undefined

    invariant(chainId !== undefined, 'CHAIN_ID')

    const amountIn = wrappedAmount2(currencyAmountIn, chainId)
    const tokenOut = wrappedCurrency2(currencyOut, chainId)

    const tokenInAddress = amountIn.token?.address
    const tokenOutAddress = tokenOut.address
    if (tokenInAddress && tokenOutAddress) {
      const search = new URLSearchParams({
        tokenIn: tokenInAddress.toLowerCase(),
        tokenOut: tokenOutAddress.toLowerCase(),
        amountIn: currencyAmountIn.raw?.toString(),
        saveGas: saveGas ? '1' : '0',
        gasInclude: saveGas ? '1' : '0',
        ...(gasPrice
          ? {
              gasPrice: BigNumber.from(gasPrice.standard)
                .mul(10 ** 9)
                .toString()
            }
          : {}),
        ...(dexes ? { dexes } : {})
      })
      try {
        const response = await fetch(`${baseURL}?${search}`, {
          signal,
          headers: {
            'X-Request-Id': sentryRequestId
          }
        })
        const result = await response.json()
        if (
          !result?.inputAmount ||
          !result?.outputAmount ||
          result.inputAmount === '0' ||
          result.outputAmount === '0'
        ) {
          return null
        }

        const toCurrencyAmount = function(value: string, currency: Currency): CurrencyAmount {
          return currency instanceof Token
            ? new TokenAmount(currency, JSBI.BigInt(value))
            : CurrencyAmount.ether(JSBI.BigInt(value))
        }

        const inputAmount = toCurrencyAmount(result.inputAmount, currencyAmountIn.currency)
        const outputAmount = toCurrencyAmount(result.outputAmount, currencyOut)

        const priceImpact = ((-result.amountOutUsd + result.amountInUsd) * 100) / result.amountInUsd

        return new Aggregator(
          inputAmount,
          outputAmount,
          result.amountInUsd,
          result.amountOutUsd,
          result.receivedUsd,
          result.swaps || [],
          result.tokens || {},
          TradeType.EXACT_INPUT,
          result.gasUsd,
          priceImpact
        )
      } catch (e) {
        console.error(e)
        reportException(e)
      }
    }

    return null
  }

  /**
   * @param baseURL
   * @param currencyAmountIn exact amount of input currency to spend
   * @param currencyOut the desired currency out
   */
  public static async compareDex(
    baseURL: string,
    currencyAmountIn: CurrencyAmount,
    currencyOut: Currency,
    signal?: AbortSignal
  ): Promise<AggregationComparer | null> {
    const chainId: ChainId | undefined =
      currencyAmountIn instanceof TokenAmount
        ? currencyAmountIn.token.chainId
        : currencyOut instanceof Token
        ? currencyOut.chainId
        : undefined
    invariant(chainId !== undefined, 'CHAIN_ID')

    const amountIn = wrappedAmount2(currencyAmountIn, chainId)
    const tokenOut = wrappedCurrency2(currencyOut, chainId)

    const tokenInAddress = amountIn.token?.address?.toLowerCase()
    const tokenOutAddress = tokenOut.address?.toLowerCase()
    const comparedDex = DEX_TO_COMPARE[chainId]
    // const basePriceURL = priceUri[chainId]
    if (
      tokenInAddress &&
      tokenOutAddress &&
      comparedDex?.value
      //  && basePriceURL
    ) {
      const search = new URLSearchParams({
        tokenIn: tokenInAddress,
        tokenOut: tokenOutAddress,
        amountIn: currencyAmountIn.raw?.toString(),
        saveGas: '0',
        gasInclude: '1',
        dexes: comparedDex.value
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

        const response = await fetch(`${baseURL}?${search}`, {
          signal,
          headers: {
            'X-Request-Id': sentryRequestId
          }
        })
        const swapData = await response.json()

        if (!swapData?.inputAmount || !swapData?.outputAmount) {
          return null
        }

        const toCurrencyAmount = function(value: string, currency: Currency): CurrencyAmount {
          return currency instanceof Token
            ? new TokenAmount(currency, JSBI.BigInt(value))
            : CurrencyAmount.ether(JSBI.BigInt(value))
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
          comparedDex
        }
      } catch (e) {
        console.error(e)
        reportException(e)
      }
    }

    return null
  }
}
