import { Currency, CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { ChainName } from 'constants/chains'
import { useMemo } from 'react'
import { useInchQuoteAPITrade } from 'state/routing/useRoutingAPITrade'
import { useRoutingAPIEnabled } from 'state/user/hooks'
import { SwapTransaction, V3TradeState } from 'state/validator/types'
import { useGaslessAPITrade, useValidatorAPITrade } from 'state/validator/useValidatorAPITrade'

import { useClientSideV3Trade } from './useClientSideV3Trade'
import { useKromatikaMetaswap } from './useContract'
import useDebounce from './useDebounce'
import { SignatureData } from './useERC20Permit'
import useIsWindowVisible from './useIsWindowVisible'
import useParsedQueryString from './useParsedQueryString'
import { useUSDCValue } from './useUSDCPrice'
import { useActiveWeb3React } from './web3'

export function useBestMarketTrade(
  showConfirm: boolean,
  gasless: boolean,
  signatureData: SignatureData | null,
  tradeType: TradeType,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency
): {
  state: V3TradeState
  trade: V3Trade<Currency, Currency, typeof tradeType> | undefined
  tx: SwapTransaction | undefined
  savings: CurrencyAmount<Token> | null
  paymentToken: Token | undefined | null
  paymentFees: CurrencyAmount<Currency> | undefined
  quoteError: string | undefined
} {
  const isWindowVisible = useIsWindowVisible()
  const { chainId } = useActiveWeb3React()
  const debouncedAmount = useDebounce(amountSpecified, 100)
  const kromatikaMetaswap = useKromatikaMetaswap()

  // parse signature data
  let signaturePermitData
  if (signatureData && kromatikaMetaswap && debouncedAmount) {
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
      signaturePermitData = kromatikaMetaswap.interface.encodeFunctionData('selfPermitAllowed', [
        debouncedAmount.currency.isToken ? debouncedAmount.currency.address : undefined,
        inputTokenPermit.nonce,
        inputTokenPermit.expiry,
        inputTokenPermit.v,
        inputTokenPermit.r,
        inputTokenPermit.s,
      ])
    } else {
      signaturePermitData = kromatikaMetaswap.interface.encodeFunctionData('selfPermit', [
        debouncedAmount.currency.isToken ? debouncedAmount.currency.address : undefined,
        inputTokenPermit.amount,
        inputTokenPermit.deadline,
        inputTokenPermit.v,
        inputTokenPermit.r,
        inputTokenPermit.s,
      ])
    }
  }

  const { affiliate } = useParsedQueryString()
  const routingAPIEnabled = useRoutingAPIEnabled()
  const quoteTrade = useValidatorAPITrade(
    tradeType,
    null,
    affiliate?.toString(),
    !showConfirm,
    gasless,
    routingAPIEnabled && isWindowVisible ? debouncedAmount : undefined,
    otherCurrency,
    signaturePermitData
  )

  const gaslessTrade = useGaslessAPITrade(
    tradeType,
    null,
    affiliate?.toString(),
    !showConfirm,
    !gasless,
    routingAPIEnabled && isWindowVisible ? debouncedAmount : undefined,
    otherCurrency,
    signaturePermitData
  )

  const nameOfNetwork = useMemo(() => {
    if (!chainId) return undefined
    return ChainName[chainId]
  }, [chainId])

  const protocols = useMemo(() => {
    if (!nameOfNetwork) return undefined

    if (nameOfNetwork === 'ethereum') {
      return 'UNISWAP_V2,UNISWAP_V3'
    }
    return nameOfNetwork.toUpperCase().concat('_UNISWAP_V2,').concat(nameOfNetwork.toUpperCase()).concat('_UNISWAP_V3')
  }, [nameOfNetwork])

  // use 1inch with only v2,v3
  const uniswapAPITrade = useInchQuoteAPITrade(
    tradeType,
    routingAPIEnabled && isWindowVisible ? debouncedAmount : undefined,
    otherCurrency,
    protocols
  )

  const betterTrade = gasless ? gaslessTrade : quoteTrade
  const isLoading = betterTrade.state === V3TradeState.LOADING

  const debouncing =
    betterTrade?.trade &&
    amountSpecified &&
    (tradeType === TradeType.EXACT_INPUT
      ? !betterTrade?.trade.inputAmount.equalTo(amountSpecified) ||
        !amountSpecified.currency.equals(betterTrade?.trade.inputAmount.currency) ||
        !otherCurrency?.equals(betterTrade?.trade.outputAmount.currency)
      : !betterTrade?.trade.outputAmount.equalTo(amountSpecified) ||
        !amountSpecified.currency.equals(betterTrade?.trade.outputAmount.currency) ||
        !otherCurrency?.equals(betterTrade?.trade.inputAmount.currency))

  const savings = useUSDCValue(uniswapAPITrade.trade?.outputAmount)

  return useMemo(
    () => ({
      state: betterTrade ? betterTrade.state : V3TradeState.LOADING,
      trade: betterTrade?.trade,
      tx: betterTrade?.tx,
      savings,
      // @ts-ignore
      paymentFees: gasless ? betterTrade.paymentFees : undefined,
      // @ts-ignore
      paymentToken: gasless ? betterTrade.paymentToken : undefined,
      quoteError: betterTrade.quoteError ? betterTrade.quoteError : undefined,
      ...(debouncing ? { state: V3TradeState.SYNCING } : {}),
      ...(isLoading ? { state: V3TradeState.LOADING } : {}),
    }),
    [betterTrade, debouncing, gasless, isLoading, savings]
  )
}

/**
 * Returns the best v3 trade for a desired swap.
 * Uses optimized routes from the Routing API and falls back to the v3 router.
 * @param tradeType whether the swap is an exact in/out
 * @param amountSpecified the exact amount to swap in/out
 * @param otherCurrency the desired output/payment currency
 */
export function useBestV3Trade(
  tradeType: TradeType,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency
): {
  state: V3TradeState
  trade: V3Trade<Currency, Currency, typeof tradeType> | null
} {
  const [debouncedAmount, debouncedOtherCurrency] = useDebounce([amountSpecified, otherCurrency], 200)

  const isLoading = amountSpecified !== undefined && debouncedAmount === undefined

  // use client side router
  const bestV3Trade = useClientSideV3Trade(tradeType, debouncedAmount, debouncedOtherCurrency)

  return {
    ...bestV3Trade,
    ...(isLoading ? { state: V3TradeState.LOADING } : {}),
  }
}
