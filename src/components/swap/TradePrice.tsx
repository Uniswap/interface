import { Trans } from '@lingui/macro'
import { Currency, Price } from '@uniswap/sdk-core'
import useStablecoinPrice from 'hooks/useStablecoinPrice'
import { useCallback, useState } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { formatDollar, formatTransactionAmount, priceToPreciseFloat } from 'utils/formatNumbers'

interface TradePriceProps {
  price: Price<Currency, Currency>
}

const StyledPriceContainer = styled.button`
  background-color: transparent;
  border: none;
  cursor: pointer;
  align-items: center;
  justify-content: flex-start;
  padding: 0;
  grid-template-columns: 1fr auto;
  grid-gap: 0.25rem;
  display: flex;
  flex-direction: row;
  text-align: left;
  flex-wrap: wrap;
  padding: 8px 0;
  user-select: text;
`

export default function TradePrice({ price }: TradePriceProps) {
  const [showInverted, setShowInverted] = useState<boolean>(false)

  const usdcPrice = useStablecoinPrice(showInverted ? price.baseCurrency : price.quoteCurrency)

  let formattedPrice: string
  try {
    formattedPrice = showInverted
      ? formatTransactionAmount(priceToPreciseFloat(price))
      : formatTransactionAmount(priceToPreciseFloat(price.invert()))
  } catch (error) {
    formattedPrice = '0'
  }

  const label = showInverted ? `${price.quoteCurrency?.symbol}` : `${price.baseCurrency?.symbol} `
  const labelInverted = showInverted ? `${price.baseCurrency?.symbol} ` : `${price.quoteCurrency?.symbol}`
  const flipPrice = useCallback(() => setShowInverted(!showInverted), [setShowInverted, showInverted])

  const text = `${'1 ' + labelInverted + ' = ' + formattedPrice ?? '-'} ${label}`

  return (
    <StyledPriceContainer
      onClick={(e) => {
        e.stopPropagation() // dont want this click to affect dropdowns / hovers
        flipPrice()
      }}
      title={text}
    >
      <ThemedText.BodySmall>{text}</ThemedText.BodySmall>{' '}
      {usdcPrice && (
        <ThemedText.DeprecatedDarkGray>
          <Trans>({formatDollar({ num: priceToPreciseFloat(usdcPrice), isPrice: true })})</Trans>
        </ThemedText.DeprecatedDarkGray>
      )}
    </StyledPriceContainer>
  )
}
