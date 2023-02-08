import {
  ChainId,
  Currency,
  CurrencyAmount,
  Fraction,
  Percent,
  Price,
  Token,
  TokenAmount,
  TradeType,
  WETH,
} from '@kyberswap/ks-sdk-core'
import { DexInstructions, OpenOrders } from '@project-serum/serum'
import { captureException } from '@sentry/react'
import {
  Keypair,
  Message,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  VersionedTransaction,
} from '@solana/web3.js'
import { toByteArray } from 'base64-js'
import JSBI from 'jsbi'
import invariant from 'tiny-invariant'

import { AbortedError, ETHER_ADDRESS, KYBERSWAP_SOURCE, ZERO_ADDRESS_SOLANA, sentryRequestId } from 'constants/index'
import { NETWORKS_INFO, isEVM } from 'constants/networks'
import { FeeConfig } from 'hooks/useSwapV2Callback'
import connection from 'state/connection/connection'
import { AggregationComparer, SolanaEncode } from 'state/swap/types'

import fetchWaiting from './fetchWaiting'
import {
  checkAndCreateAtaInstruction,
  checkAndCreateWrapSOLInstructions,
  createUnwrapSOLInstruction,
} from './solanaInstructions'
import { convertToVersionedTx } from './versionedTx'

export type Swap = {
  pool: string
  tokenIn: string
  tokenOut: string
  swapAmount: string
  amountOut: string
  limitReturnAmount: string
  maxPrice: string
  exchange: string
  poolLength: number
  poolType: string
  extra:
    | {
        poolLength: number
        tokenInIndex: number
        tokenOutIndex: number
      }
    | undefined
  collectAmount: string | undefined
  recipient: string | undefined
  reserveUsd: number // Solana only
}
type Tokens = {
  [address: string]: (Token & { price: number }) | undefined
}
let maxSwapBytelength = 0
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
  public readonly swaps: Swap[][]
  /**
   */
  public readonly tokens: Tokens
  /**
   * The price expressed in terms of output amount/input amount.
   */
  public readonly executionPrice: Price<Currency, Currency>

  public readonly amountInUsd: number
  public readonly amountOutUsd: number
  public readonly receivedUsd: number
  public readonly gasUsd: number | undefined
  // -1 mean can not get price of token => can not calculate price impact
  public readonly priceImpact: number
  public readonly encodedSwapData: string
  public readonly routerAddress: string

  public readonly solana: {
    readonly to: string
    readonly programState: Keypair
    readonly encodedMessage: string
    readonly serumOpenOrdersAccountByMarket: Record<string, string>
  } | null

  private constructor(
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
    to: string,
    programState: Keypair,
    encodedMessage: string,
    serumOpenOrdersAccountByMarket: Record<string, string>,
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
    try {
      this.swaps = swaps
    } catch (e) {
      this.swaps = [[]]
    }
    try {
      this.tokens = tokens
    } catch (e) {
      this.tokens = {}
    }
    this.gasUsd = gasUsd
    this.priceImpact = priceImpact
    this.encodedSwapData = encodedSwapData
    this.routerAddress = routerAddress
    if (encodedMessage) {
      this.solana = {
        to,
        programState,
        encodedMessage,
        serumOpenOrdersAccountByMarket,
      }
    } else this.solana = null
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
    dexes = '',
    slippageTolerance: number,
    deadline: number | undefined,
    to: string,
    feeConfig: FeeConfig | undefined,
    signal: AbortSignal,
    minimumLoadingTime: number,
  ): Promise<Aggregator | null> {
    const programState = new Keypair()
    const amountIn = currencyAmountIn
    const tokenOut = currencyOut.wrapped

    const tokenInAddress = currencyAmountIn.currency.isNative
      ? isEVM(currencyAmountIn.currency.chainId)
        ? ETHER_ADDRESS
        : WETH[currencyAmountIn.currency.chainId].address
      : amountIn.currency.wrapped.address
    const tokenOutAddress = currencyOut.isNative
      ? isEVM(currencyOut.chainId)
        ? ETHER_ADDRESS
        : WETH[currencyOut.chainId].address
      : tokenOut.address

    if (tokenInAddress && tokenOutAddress) {
      const search = new URLSearchParams({
        // Trade config
        tokenIn: tokenInAddress,
        tokenOut: tokenOutAddress,
        amountIn: currencyAmountIn.quotient?.toString(),
        saveGas: saveGas ? '1' : '0',
        gasInclude: '1',
        ...(dexes ? { dexes } : {}),
        slippageTolerance: slippageTolerance?.toString() ?? '',
        deadline: deadline?.toString() ?? '',
        to,

        // Fee config
        chargeFeeBy: feeConfig?.chargeFeeBy ?? '',
        feeReceiver: feeConfig?.feeReceiver ?? '',
        isInBps: feeConfig?.isInBps !== undefined ? (feeConfig.isInBps ? '1' : '0') : '',
        feeAmount: feeConfig?.feeAmount ?? '',

        programState: programState.publicKey.toBase58() ?? '',

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
        if (Math.round(response.status / 100) !== 2) throw new Error('Aggregator status fail: ' + response.status)
        const result = await response.json()
        if (
          !result ||
          !result.inputAmount ||
          !result.outputAmount ||
          typeof result.swaps?.[0]?.[0].pool !== 'string' ||
          !result.tokens ||
          result.inputAmount === '0' ||
          result.outputAmount === '0'
        ) {
          return null
        }

        const toCurrencyAmount = function (value: string, currency: Currency): CurrencyAmount<Currency> {
          try {
            return TokenAmount.fromRawAmount(currency, JSBI.BigInt(value))
          } catch (e) {
            return TokenAmount.fromRawAmount(currency, 0)
          }
        }

        const outputAmount = toCurrencyAmount(result?.outputAmount, currencyOut)

        const priceImpact = !result.amountOutUsd
          ? -1
          : ((-result.amountOutUsd + result.amountInUsd) * 100) / result.amountInUsd

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
          result.encodedSwapData,
          result.routerAddress,
          to,
          programState,
          result.encodedMessage,
          result.serumOpenOrdersAccountByMarket,
        )
      } catch (e) {
        // ignore aborted request error
        if (!e?.message?.includes('Fetch is aborted') && !e?.message?.includes('The user aborted a request')) {
          console.error('Aggregator error:', e?.stack || e)
          const sentryError = new Error('Aggregator API call failed', { cause: e })
          sentryError.name = 'AggregatorAPIError'
          captureException(sentryError, { level: 'error' })
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
    const amountIn = currencyAmountIn
    const tokenOut = currencyOut.wrapped

    const tokenInAddress = currencyAmountIn.currency.isNative
      ? isEVM(currencyAmountIn.currency.chainId)
        ? ETHER_ADDRESS
        : WETH[currencyAmountIn.currency.chainId].address
      : amountIn.currency.wrapped.address
    const tokenOutAddress = currencyOut.isNative
      ? isEVM(currencyOut.chainId)
        ? ETHER_ADDRESS
        : WETH[currencyOut.chainId].address
      : tokenOut.address

    const comparedDex = NETWORKS_INFO[currencyAmountIn.currency.chainId].dexToCompare

    if (tokenInAddress && tokenOutAddress && comparedDex) {
      const search = new URLSearchParams({
        // Trade config
        tokenIn: tokenInAddress,
        tokenOut: tokenOutAddress,
        amountIn: currencyAmountIn.quotient?.toString(),
        saveGas: '0',
        gasInclude: '1',
        dexes: comparedDex,
        slippageTolerance: slippageTolerance?.toString() ?? '',
        deadline: deadline?.toString() ?? '',
        to,
        programState: ZERO_ADDRESS_SOLANA,

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
        const swapData = await response.json()

        if (!swapData?.inputAmount || !swapData?.outputAmount) {
          return null
        }

        const toCurrencyAmount = function (value: string, currency: Currency): CurrencyAmount<Currency> {
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
        // ignore aborted request error
        if (!e?.message?.includes('Fetch is aborted') && !e?.message?.includes('The user aborted a request')) {
          console.error('Aggregator comparedDex error:', e?.stack || e)
          const sentryError = new Error('Aggregator API (comparedDex) call failed', { cause: e })
          sentryError.name = 'AggregatorAPIError'
          captureException(sentryError, { level: 'error' })
        }
      }
    }

    return null
  }

  public static async encodeSolana(agg: Aggregator, signal: AbortSignal): Promise<undefined | SolanaEncode> {
    if (!agg.solana) return
    if (!agg.solana.encodedMessage) return
    if (agg.solana.to === ZERO_ADDRESS_SOLANA) return

    const encode = async (): Promise<
      | {
          setupTx: Transaction | null
          swapTx: VersionedTransaction
        }
      | undefined
    > => {
      if (!agg.solana) return undefined
      if (!agg.solana.encodedMessage) return undefined
      if (agg.solana.to === ZERO_ADDRESS_SOLANA) return undefined

      try {
        const toPK = new PublicKey(agg.solana.to)
        const getLatestBlockhash = connection.getLatestBlockhash()
        const message = Message.from(toByteArray(agg.solana.encodedMessage))

        //#region set up tx
        const setupTx: Transaction = new Transaction({
          feePayer: toPK,
        })

        const newOpenOrders: [PublicKey, Keypair][] = [] // OpenOrders accounts to be created
        if (
          agg.solana.serumOpenOrdersAccountByMarket &&
          Object.keys(agg.solana.serumOpenOrdersAccountByMarket).length
        ) {
          // do Solana magic things
          const actualOpenOrdersByMarket: { [key: string]: PublicKey } = {}
          await Promise.all(
            Object.entries(agg.solana.serumOpenOrdersAccountByMarket).map(async ([market]) => {
              const marketPK = new PublicKey(market)
              const openOrdersList = await OpenOrders.findForMarketAndOwner(
                connection,
                marketPK,
                toPK,
                NETWORKS_INFO[ChainId.SOLANA].openBookAddress,
              )
              if (signal.aborted) throw new AbortedError()
              let openOrders: PublicKey
              if (openOrdersList.length > 0) {
                // if there is an OpenOrders, use it
                openOrders = openOrdersList[0].address
              } else {
                // otherwise, create a new OpenOrders account
                const keypair = new Keypair()
                openOrders = keypair.publicKey
                newOpenOrders.push([marketPK, keypair])
              }
              actualOpenOrdersByMarket[market] = openOrders
            }),
          )
          if (signal.aborted) throw new AbortedError()

          const openOrdersSpace = OpenOrders.getLayout(NETWORKS_INFO[ChainId.SOLANA].openBookAddress).span
          const openOrdersRent = await connection.getMinimumBalanceForRentExemption(openOrdersSpace)
          if (signal.aborted) throw new AbortedError()
          const createOpenOrdersIxs = []
          for (const [market, openOrders] of newOpenOrders) {
            createOpenOrdersIxs.push(
              SystemProgram.createAccount({
                fromPubkey: toPK,
                newAccountPubkey: openOrders.publicKey,
                lamports: openOrdersRent,
                space: openOrdersSpace,
                programId: NETWORKS_INFO[ChainId.SOLANA].openBookAddress,
              }),
              DexInstructions.initOpenOrders({
                market,
                openOrders: openOrders.publicKey,
                owner: toPK,
                programId: NETWORKS_INFO[ChainId.SOLANA].openBookAddress,
                marketAuthority: null,
              }),
            )
          }

          if (createOpenOrdersIxs.length) {
            setupTx.add(...createOpenOrdersIxs)
          }

          // replace dummy OpenOrders account with actual ones
          for (let i = 0; i < message.accountKeys.length; i += 1) {
            const pubkey = message.accountKeys[i]
            for (const [market, dummyOpenOrders] of Object.entries(agg.solana.serumOpenOrdersAccountByMarket)) {
              if (pubkey.toBase58() === dummyOpenOrders) {
                message.accountKeys[i] = actualOpenOrdersByMarket[market]
                break
              }
            }
          }
        }
        const { blockhash, lastValidBlockHeight } = await getLatestBlockhash

        let initializedWrapSOL = false
        let wrapIxs: TransactionInstruction[] | null = null
        if (agg.inputAmount.currency.isNative) {
          wrapIxs = await checkAndCreateWrapSOLInstructions(toPK, agg.inputAmount)
          if (signal.aborted) throw new AbortedError()
          if (wrapIxs) {
            initializedWrapSOL = true
          }
        }
        const cleanUpIxs = []
        if (agg.outputAmount.currency.isNative) {
          const closeWSOLIxs = await createUnwrapSOLInstruction(toPK)
          cleanUpIxs.push(closeWSOLIxs)
        }

        await Promise.all(
          Object.entries(agg.tokens || {}).map(async ([tokenAddress, token]: [any, any]) => {
            if (!token) return
            if (tokenAddress === WETH[ChainId.SOLANA].address && initializedWrapSOL) return // for case WSOL as part of route
            const createAtaIxs = await checkAndCreateAtaInstruction(
              toPK,
              new Token(ChainId.SOLANA, tokenAddress, token?.decimals || 0),
            )
            if (signal.aborted) throw new AbortedError()
            if (createAtaIxs) {
              setupTx.add(createAtaIxs)
            }
          }),
        )
        if (signal.aborted) throw new AbortedError()
        setupTx.recentBlockhash = blockhash
        setupTx.lastValidBlockHeight = lastValidBlockHeight
        newOpenOrders.length && setupTx.partialSign(...newOpenOrders.map(i => i[1]))
        //#endregion set up tx

        //#region swap tx
        const swapTx = await convertToVersionedTx('confirmed', blockhash, message, toPK, wrapIxs, cleanUpIxs)
        if (signal.aborted) throw new AbortedError()

        await swapTx.sign([agg.solana.programState])
        console.debug('swap byteLength:', swapTx.serialize().buffer.byteLength)
        console.debug(
          'swap byteLength max:',
          (maxSwapBytelength = Math.max(swapTx.serialize().buffer.byteLength, maxSwapBytelength)),
        )
        if (signal.aborted) throw new AbortedError()
        //#endregion swap tx

        return {
          setupTx: setupTx?.instructions.length ? setupTx : null,
          swapTx,
        }
      } catch (error) {
        if (error instanceof AbortedError) {
          // console.info('Aborted encode Solana')
        } else console.error('Error encode Solana:', { error })
        return
      }
    }

    return await encode()
  }
}
