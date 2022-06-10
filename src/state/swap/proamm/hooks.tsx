import { Trans } from '@lingui/macro'
import { Trade } from '@kyberswap/ks-sdk-elastic'
import { CurrencyAmount, Currency, TradeType } from '@kyberswap/ks-sdk-core'
import { basisPointsToPercent, isAddress } from '../../../utils'
import { useActiveWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import useENS from 'hooks/useENS'
import React, { ReactNode, useMemo } from 'react'
import { TradeState } from 'state/routing/types'
import { useCurrencyBalances } from 'state/wallet/hooks'
import { Field } from '../actions'
import { tryParseAmount, useSwapState } from '../hooks'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { useProAmmBestTrade } from 'hooks/useProAmmBestTrade'
import { BAD_RECIPIENT_ADDRESSES } from '../../../constants'

export function useProAmmDerivedSwapInfo(): {
  currencies: { [field in Field]?: Currency | null }
  currencyBalances: { [field in Field]?: CurrencyAmount<Currency> }
  parsedAmount: CurrencyAmount<Currency> | undefined
  inputError?: ReactNode
  trade: {
    trade: Trade<Currency, Currency, TradeType> | undefined
    state: TradeState
  }
  allowedSlippage: number
} {
  const { account } = useActiveWeb3React()
  const {
    independentField,
    typedValue,
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId },
    recipient,
  } = useSwapState()
  const inputCurrency = useCurrency(inputCurrencyId)
  const outputCurrency = useCurrency(outputCurrencyId)
  const recipientLookup = useENS(recipient ?? undefined)
  const to: string | null = (recipient === null ? account : recipientLookup.address) ?? null

  const relevantTokenBalances = useCurrencyBalances(
    account ?? undefined,
    useMemo(() => [inputCurrency ?? undefined, outputCurrency ?? undefined], [inputCurrency, outputCurrency]),
  )

  const isExactIn: boolean = independentField === Field.INPUT
  const parsedAmount = useMemo(
    () => tryParseAmount(typedValue, (isExactIn ? inputCurrency : outputCurrency) ?? undefined),
    [inputCurrency, isExactIn, outputCurrency, typedValue],
  )

  const trade = useProAmmBestTrade(
    isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT,
    parsedAmount,
    (isExactIn ? outputCurrency : inputCurrency) ?? undefined,
  )

  const currencyBalances = {
    [Field.INPUT]: relevantTokenBalances[0],
    [Field.OUTPUT]: relevantTokenBalances[1],
  }

  const currencies: { [field in Field]?: Currency | null } = {
    [Field.INPUT]: inputCurrency,
    [Field.OUTPUT]: outputCurrency,
  }

  let inputError: ReactNode | undefined
  if (!account) {
    inputError = <Trans>Connect Wallet</Trans>
  }

  if (!currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
    inputError = inputError ?? <Trans>Select a token</Trans>
  }

  if (!parsedAmount) {
    inputError = inputError ?? <Trans>Enter an amount</Trans>
  }
  const formattedTo = isAddress(to)
  if (!to || !formattedTo) {
    inputError = inputError ?? <Trans>Enter a recipient</Trans>
  } else {
    if (BAD_RECIPIENT_ADDRESSES.indexOf(formattedTo) !== -1) {
      inputError = inputError ?? <Trans>Invalid recipient</Trans>
    }
  }

  const [allowedSlippage] = useUserSlippageTolerance()
  // compare input balance to max input based on version
  const [balanceIn, amountIn] = [
    currencyBalances[Field.INPUT],
    trade.trade?.maximumAmountIn(basisPointsToPercent(allowedSlippage)),
  ]
  if (balanceIn && amountIn && balanceIn.lessThan(amountIn)) {
    inputError = <Trans>Insufficient {amountIn.currency.symbol} balance</Trans>
  }

  return {
    currencies,
    currencyBalances,
    parsedAmount,
    inputError,
    trade,
    allowedSlippage: allowedSlippage,
  }
}
