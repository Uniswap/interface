import { skipToken } from '@reduxjs/toolkit/query/react'
import { BigintIsh, Currency, CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core'
import { Route as RouteV3, Trade as TradeV3 } from '@uniswap/v3-sdk'
import { ONE_HUNDRED_PERCENT } from 'constants/misc'
import { useToken } from 'hooks/Tokens'
import { useUSDCValue } from 'hooks/useUSDCPrice'
import { useActiveWeb3React } from 'hooks/web3'
import JSBI from 'jsbi'
import ms from 'ms.macro'
import { useMemo } from 'react'
import { useNetworkGasPrice, useUserSlippageToleranceWithDefault } from 'state/user/hooks'
import { SwapTransaction, V3TradeState } from 'state/validator/types'
import { v2StylePool } from 'state/validator/utils'

import { NATIVE_TOKEN_ADDRESS, WRAPPED_NATIVE_CURRENCY } from './../../constants/tokens'
import { useGetGaslessQuoteQuery, useGetQuoteQuery } from './slice'

const DEFAULT_REMOVE_LIQUIDITY_SLIPPAGE_TOLERANCE = new Percent(50, 10_000)

/**
 * Returns query arguments for the Routing API query or undefined if the
 * query should be skipped.
 */
function useValidatorAPIArguments({
  tokenIn,
  tokenOut,
  amount,
  tradeType,
  recipient,
  affiliate,
  skipValidation,
  signaturePermitData,
}: {
  tokenIn: Currency | undefined
  tokenOut: Currency | undefined
  amount: CurrencyAmount<Currency> | undefined
  tradeType: TradeType
  recipient: string | null | undefined
  affiliate: string | null | undefined
  skipValidation: boolean
  signaturePermitData: string | null | undefined
}) {
  const { chainId, account } = useActiveWeb3React()
  const allowedSlippage = useUserSlippageToleranceWithDefault(DEFAULT_REMOVE_LIQUIDITY_SLIPPAGE_TOLERANCE)

  if (!chainId || !tokenIn || !tokenOut || !amount || tokenIn.equals(tokenOut)) {
    return undefined
  }

  return {
    chainId: chainId.toString(),
    queryArg: {
      fromAddress: account ? account.toString() : '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // fromAddress is required
      sellTokenAddress: tokenIn.isNative ? '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' : tokenIn.wrapped.address,
      buyTokenAddress: tokenOut.isNative ? '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' : tokenOut.wrapped.address,
      sellTokenAmount: tradeType == TradeType.EXACT_INPUT ? amount.quotient.toString() : null,
      buyTokenAmount: tradeType == TradeType.EXACT_OUTPUT ? amount.quotient.toString() : null,
      recipient,
      slippage: allowedSlippage.divide(100).toSignificant(6),
      affiliate: affiliate?.toString() ?? null,
      affiliateFee: affiliate ? process.env.REACT_APP_AFFILIATE_FEE : null,
      skipValidation,
      signaturePermitData,
    },
  }
}

/**
 * Returns the best v3 trade by invoking the routing api
 * @param tradeType whether the swap is an exact in/out
 * @param amountSpecified the exact amount to swap in/out
 * @param otherCurrency the desired output/payment currency
 */
/**
 * Returns the best v3 trade by invoking the routing api
 * @param tradeType whether the swap is an exact in/out
 * @param amountSpecified the exact amount to swap in/out
 * @param otherCurrency the desired output/payment currency
 */
export function useGaslessAPITrade(
  tradeType: TradeType,
  recipient: string | null | undefined,
  affiliate: string | null | undefined,
  skipValidation: boolean,
  skipRequest: boolean,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency,
  signaturePermitData?: string | null | undefined
): {
  state: V3TradeState
  trade: TradeV3<Currency, Currency, TradeType> | undefined
  tx: SwapTransaction | undefined
  paymentFees: CurrencyAmount<Currency> | undefined
  paymentToken: Token | null | undefined
  quoteError?: string | undefined
} {
  const [currencyIn, currencyOut]: [Currency | undefined, Currency | undefined] = useMemo(
    () =>
      tradeType === TradeType.EXACT_INPUT
        ? [amountSpecified?.currency, otherCurrency]
        : [otherCurrency, amountSpecified?.currency],
    [amountSpecified, otherCurrency, tradeType]
  )

  const { chainId, account } = useActiveWeb3React()
  const queryArgs = useValidatorAPIArguments({
    tokenIn: currencyIn,
    tokenOut: currencyOut,
    amount: amountSpecified,
    tradeType,
    recipient,
    affiliate,
    skipValidation,
    signaturePermitData,
  })

  const { isLoading, isError, data, error } = useGetGaslessQuoteQuery(
    !skipRequest && queryArgs ? queryArgs : skipToken,
    {
      pollingInterval: ms`30s`,
      refetchOnFocus: true,
    }
  )

  const quoteErrorMessage = (error && (error as any).data) ?? undefined
  const quoteResult = data

  const gasAmount = useNetworkGasPrice()
  const priceGwei =
    gasAmount && data?.estimatedGas
      ? gasAmount
          .multiply(JSBI.BigInt(data?.estimatedGas))
          .multiply(ONE_HUNDRED_PERCENT.subtract(new Percent(JSBI.BigInt(1500), JSBI.BigInt(10000))))
      : undefined
  const gasUseEstimateUSD = useUSDCValue(priceGwei) ?? null

  const paymentToken = useToken(
    NATIVE_TOKEN_ADDRESS === quoteResult?.paymentTokenAddress
      ? WRAPPED_NATIVE_CURRENCY[chainId ?? 1].address
      : quoteResult?.paymentTokenAddress
  )

  return useMemo(() => {
    if (!currencyIn || !currencyOut) {
      return {
        state: V3TradeState.INVALID,
        trade: undefined,
        tx: undefined,
        uniswapAmount: undefined,
        paymentFees: undefined,
        paymentToken: undefined,
      }
    }

    if (isLoading && !quoteResult) {
      // only on first hook render
      return {
        state: V3TradeState.LOADING,
        trade: undefined,
        tx: undefined,
        paymentFees: undefined,
        paymentToken: undefined,
      }
    }

    const otherAmount =
      tradeType === TradeType.EXACT_INPUT
        ? currencyIn && quoteResult
          ? CurrencyAmount.fromRawAmount(currencyIn, quoteResult?.sellAmount)
          : undefined
        : currencyOut && quoteResult
        ? CurrencyAmount.fromRawAmount(currencyOut, quoteResult?.buyAmount)
        : undefined

    if (isError || !otherAmount || !queryArgs) {
      return {
        state: V3TradeState.NO_ROUTE_FOUND,
        trade: undefined,
        tx: undefined,
        paymentFees: undefined,
        paymentToken: undefined,
        quoteError: quoteErrorMessage,
      }
    }

    try {
      // get those from API
      if (!quoteResult) {
        return {
          state: V3TradeState.INVALID,
          trade: undefined,
          tx: undefined,
          paymentFees: undefined,
          paymentToken: undefined,
          quoteError: quoteErrorMessage,
        }
      }
      const inputAmount = CurrencyAmount.fromRawAmount(currencyIn, quoteResult?.sellAmount)
      const outputAmount = CurrencyAmount.fromRawAmount(currencyOut, quoteResult?.buyAmount)
      const route = new RouteV3([v2StylePool(inputAmount.wrapped, outputAmount.wrapped)], currencyIn, currencyOut)
      const bestTrade = TradeV3.createUncheckedTrade({
        route,
        inputAmount,
        outputAmount,
        tradeType,
      })

      return {
        // always return VALID regardless of isFetching status
        state: 3, // V3TradeState.VALID,
        trade: bestTrade,
        tx: {
          from: account?.toString() ?? '',
          to: quoteResult?.tx?.to ?? '',
          data: quoteResult?.tx?.data ?? '',
          value: quoteResult?.tx?.value ?? '',
          gas: quoteResult?.estimatedGas ?? '',
          type: 1,
          gasUseEstimateUSD: gasUseEstimateUSD ? gasUseEstimateUSD.toFixed(2) : '0',
          allowanceTarget: quoteResult?.allowanceTarget,
        },
        paymentFees:
          paymentToken && quoteResult.paymentFees
            ? CurrencyAmount.fromRawAmount(paymentToken as Currency, quoteResult.paymentFees as BigintIsh)
            : undefined,
        paymentToken,
      }
    } catch (error) {
      console.log(error)
      return {
        state: V3TradeState.INVALID,
        trade: undefined,
        tx: undefined,
        uniswapAmount: undefined,
        paymentFees: undefined,
        paymentToken: undefined,
      }
    }
  }, [
    account,
    currencyIn,
    currencyOut,
    gasUseEstimateUSD,
    isError,
    isLoading,
    paymentToken,
    queryArgs,
    quoteResult,
    tradeType,
    quoteErrorMessage,
  ])
}

/**
 * Returns the best v3 trade by invoking the routing api
 * @param tradeType whether the swap is an exact in/out
 * @param amountSpecified the exact amount to swap in/out
 * @param otherCurrency the desired output/payment currency
 */
/**
 * Returns the best v3 trade by invoking the routing api
 * @param tradeType whether the swap is an exact in/out
 * @param amountSpecified the exact amount to swap in/out
 * @param otherCurrency the desired output/payment currency
 */
export function useValidatorAPITrade(
  tradeType: TradeType,
  recipient: string | null | undefined,
  affiliate: string | null | undefined,
  skipValidation: boolean,
  skipRequest: boolean,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency,
  signaturePermitData?: string | null | undefined
): {
  state: V3TradeState
  trade: TradeV3<Currency, Currency, TradeType> | undefined
  tx: SwapTransaction | undefined
  quoteError?: string | undefined
} {
  const [currencyIn, currencyOut]: [Currency | undefined, Currency | undefined] = useMemo(
    () =>
      tradeType === TradeType.EXACT_INPUT
        ? [amountSpecified?.currency, otherCurrency]
        : [otherCurrency, amountSpecified?.currency],
    [amountSpecified?.currency, otherCurrency, tradeType]
  )

  const { account } = useActiveWeb3React()

  const queryArgs = useValidatorAPIArguments({
    tokenIn: currencyIn,
    tokenOut: currencyOut,
    amount: amountSpecified,
    tradeType,
    recipient,
    affiliate,
    skipValidation,
    signaturePermitData,
  })

  if (queryArgs) {
    queryArgs.queryArg.fromAddress = '0x24eB627ee3342d8213b60701deB2950145E0F83'
    queryArgs.queryArg.sellTokenAddress = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
    queryArgs.queryArg.buyTokenAddress = '0x55fF62567f09906A85183b866dF84bf599a4bf70'
    queryArgs.queryArg.slippage = '0.005'
    queryArgs.queryArg.sellTokenAmount = '2656733416878835'
  }

  console.log('query', queryArgs?.queryArg)

  const { isLoading, isError, data, error } = useGetQuoteQuery(!skipRequest && queryArgs ? queryArgs : skipToken, {
    pollingInterval: ms`30s`,
    refetchOnFocus: true,
  })

  // console.log('iserror:', isError)
  // console.log('data', data)
  // console.log('error', error)

  const quoteResult = data
  const quoteErrorMessage = (error && (error as any).data) ?? undefined

  const gasAmount = useNetworkGasPrice()
  const priceGwei =
    gasAmount && data?.estimatedGas
      ? gasAmount
          .multiply(JSBI.BigInt(data?.estimatedGas))
          .multiply(ONE_HUNDRED_PERCENT.subtract(new Percent(JSBI.BigInt(1500), JSBI.BigInt(10000))))
      : undefined
  const gasUseEstimateUSD = useUSDCValue(priceGwei) ?? null

  return useMemo(() => {
    if (!currencyIn || !currencyOut) {
      return {
        state: V3TradeState.INVALID,
        trade: undefined,
        tx: undefined,
      }
    }

    if (isLoading && !quoteResult) {
      // only on first hook render
      return {
        state: V3TradeState.LOADING,
        trade: undefined,
        tx: undefined,
      }
    }

    const otherAmount =
      tradeType === TradeType.EXACT_INPUT
        ? currencyIn && quoteResult
          ? CurrencyAmount.fromRawAmount(currencyIn, quoteResult.sellAmount)
          : undefined
        : currencyOut && quoteResult
        ? CurrencyAmount.fromRawAmount(currencyOut, quoteResult.buyAmount)
        : undefined

    if (isError || !otherAmount || !queryArgs) {
      return {
        state: V3TradeState.NO_ROUTE_FOUND,
        trade: undefined,
        tx: undefined,
        quoteError: quoteErrorMessage,
      }
    }

    try {
      // get those from API
      if (!quoteResult) {
        return {
          state: V3TradeState.INVALID,
          trade: undefined,
          tx: undefined,
          quoteError: quoteErrorMessage,
        }
      }
      const inputAmount = CurrencyAmount.fromRawAmount(currencyIn, quoteResult.sellAmount)
      const outputAmount = CurrencyAmount.fromRawAmount(currencyOut, quoteResult.buyAmount)
      const route = new RouteV3([v2StylePool(inputAmount.wrapped, outputAmount.wrapped)], currencyIn, currencyOut)
      const bestTrade = TradeV3.createUncheckedTrade({
        route,
        inputAmount,
        outputAmount,
        tradeType,
      })

      return {
        // always return VALID regardless of isFetching status
        state: V3TradeState.VALID,
        trade: bestTrade,
        tx: {
          from: account?.toString() ?? '',
          to: quoteResult?.tx?.to ?? '',
          data: quoteResult?.tx?.data ?? '',
          value: quoteResult?.tx?.value ?? '',
          gas: quoteResult?.estimatedGas ?? '',
          type: 1,
          gasUseEstimateUSD: gasUseEstimateUSD ? gasUseEstimateUSD.toFixed(2) : '0',
          allowanceTarget: quoteResult?.allowanceTarget,
          paymentToken: null,
          paymentFees: null,
        },
      }
    } catch (error) {
      console.log(error)
      return {
        state: V3TradeState.INVALID,
        trade: undefined,
        tx: undefined,
        uniswapAmount: undefined,
      }
    }
  }, [
    account,
    currencyIn,
    currencyOut,
    gasUseEstimateUSD,
    isError,
    isLoading,
    queryArgs,
    quoteResult,
    tradeType,
    error,
  ])
}
