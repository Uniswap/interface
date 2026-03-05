import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { TFunction } from 'i18next'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { LocalizationContextState, useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { IntermediaryPlanState } from 'uniswap/src/features/transactions/swap/plan/intermediaryState/useIntermediaryPlanState'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'

interface IntermediaryStateDescriptorParams {
  intermediaryState: IntermediaryPlanState
  status: TransactionStatus
  long?: boolean
}

export function useIntermediaryPlanStateDescriptor({
  intermediaryState,
  long,
}: IntermediaryStateDescriptorParams): string | undefined {
  const { inputCurrency, intermediaryCurrencyAmount, hasSwapped, hasBridged } = intermediaryState

  const { t } = useTranslation()
  const { formatCurrencyAmount } = useLocalizationContext()

  const getDescriptor = long ? getLongIntermediaryStateDescriptor : getShortIntermediaryStateDescriptor

  return useMemo(
    () =>
      inputCurrency && intermediaryCurrencyAmount
        ? getDescriptor({ t, formatCurrencyAmount, inputCurrency, intermediaryCurrencyAmount, hasSwapped, hasBridged })
        : undefined,
    [t, formatCurrencyAmount, inputCurrency, intermediaryCurrencyAmount, hasSwapped, hasBridged, getDescriptor],
  )
}

interface GetLongIntermediaryStateDescriptorParams {
  t: TFunction
  hasBridged: boolean
  hasSwapped: boolean
  inputCurrency: Currency
  intermediaryCurrencyAmount: CurrencyAmount<Currency>
}

export function getLongIntermediaryStateDescriptor(params: GetLongIntermediaryStateDescriptorParams): string {
  const tokenInSymbol = params.inputCurrency.symbol

  if (params.hasBridged && !params.hasSwapped) {
    const destinationChain = getChainLabel(params.intermediaryCurrencyAmount.currency.chainId)
    return params.t('transaction.status.plan.intermediaryState.bridged.extended', { tokenInSymbol, destinationChain })
  }

  const tokenOutSymbol = params.intermediaryCurrencyAmount.currency.symbol
  return params.t('transaction.status.plan.intermediaryState.swapped.extended', { tokenInSymbol, tokenOutSymbol })
}

interface GetShortIntermediaryStateDescriptorParams extends GetLongIntermediaryStateDescriptorParams {
  formatCurrencyAmount: LocalizationContextState['formatCurrencyAmount']
}

function getShortIntermediaryStateDescriptor(params: GetShortIntermediaryStateDescriptorParams): string {
  const tokenInSymbol = params.inputCurrency.symbol

  if (params.hasBridged && !params.hasSwapped) {
    const destinationChain = getChainLabel(params.intermediaryCurrencyAmount.currency.chainId)
    return params.t('transaction.status.plan.intermediaryState.bridged', { tokenInSymbol, destinationChain })
  }

  const tokenOutSymbol = params.intermediaryCurrencyAmount.currency.symbol
  const amount = params.formatCurrencyAmount({ value: params.intermediaryCurrencyAmount })
  const strParams = { tokenInSymbol, tokenOutSymbol, amount }

  return params.t('transaction.status.plan.intermediaryState.swapped', strParams)
}
