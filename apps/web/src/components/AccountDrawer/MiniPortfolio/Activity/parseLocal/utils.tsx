import type { Currency } from '@uniswap/sdk-core'
import { CurrencyAmount } from '@uniswap/sdk-core'
import i18n from 'uniswap/src/i18n'
import { NumberType } from 'utilities/src/format/types'
import type { FormatNumberFunctionType } from '~/components/AccountDrawer/MiniPortfolio/Activity/parseLocal/types'

export function buildCurrencyDescriptor({
  currencyA,
  amtA,
  currencyB,
  amtB,
  formatNumber,
  isSwap = false,
}: {
  currencyA?: Currency
  amtA: string
  currencyB?: Currency
  amtB: string
  formatNumber: FormatNumberFunctionType
  isSwap?: boolean
}) {
  const formattedA = currencyA
    ? formatNumber({
        value: parseFloat(CurrencyAmount.fromRawAmount(currencyA, amtA).toSignificant()),
        type: NumberType.TokenNonTx,
      })
    : i18n.t('common.unknown')
  const symbolA = currencyA?.symbol ? ` ${currencyA.symbol}` : ''
  const formattedB = currencyB
    ? formatNumber({
        value: parseFloat(CurrencyAmount.fromRawAmount(currencyB, amtB).toSignificant()),
        type: NumberType.TokenNonTx,
      })
    : i18n.t('common.unknown')
  const symbolB = currencyB?.symbol ? ` ${currencyB.symbol}` : ''

  const amountWithSymbolA = `${formattedA}${symbolA}`
  const amountWithSymbolB = `${formattedB}${symbolB}`

  return isSwap
    ? i18n.t('activity.transaction.swap.descriptor', {
        amountWithSymbolA,
        amountWithSymbolB,
      })
    : i18n.t('activity.transaction.tokens.descriptor', {
        amountWithSymbolA,
        amountWithSymbolB,
      })
}
