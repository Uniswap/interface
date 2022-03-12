import { useLingui } from '@lingui/react'
import { Currency, Price } from '@uniswap/sdk-core'
import Row from 'lib/components/Row'
import { ThemedText } from 'lib/theme'
import formatLocaleNumber from 'lib/utils/formatLocaleNumber'
import { formatPrice } from 'utils/formatCurrencyAmount'

interface PriceProps {
  price: Price<Currency, Currency>
}

export default function Rate({ price }: PriceProps) {
  const { i18n } = useLingui()
  return (
    <Row>
      <ThemedText.Caption userSelect>
        {formatLocaleNumber({ number: 1, sigFigs: 1, locale: i18n.locale })} {price.baseCurrency.symbol} ={' '}
        {formatPrice(price, 6, i18n.locale)} {price.quoteCurrency.symbol}{' '}
      </ThemedText.Caption>
    </Row>
  )
}
