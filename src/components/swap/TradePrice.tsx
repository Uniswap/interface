import { Trans } from '@lingui/macro'
import { Currency, Price } from '@uniswap/sdk-core'
import useUSDCPrice from 'hooks/useUSDCPrice'
import { useCallback, useContext } from 'react'
import { Text } from 'rebass'
import styled, { ThemeContext } from 'styled-components/macro'
import { TYPE } from 'theme'

interface TradePriceProps {
  price: Price<Currency, Currency>
  showInverted: boolean
  setShowInverted: (showInverted: boolean) => void
}

const StyledPriceContainer = styled.button`
  align-items: center;
  background-color: transparent;
  border: none;
  cursor: pointer;
  display: grid;
  height: 24px;
  justify-content: center;
  padding: 0;
  grid-template-columns: 1fr auto;
  grid-gap: 0.25rem;
`

export default function TradePrice({ price, showInverted, setShowInverted }: TradePriceProps) {
  const theme = useContext(ThemeContext)

  const usdcPrice = useUSDCPrice(showInverted ? price.baseCurrency : price.quoteCurrency)

  let formattedPrice: string
  try {
    formattedPrice = showInverted ? price.toSignificant(4) : price.invert()?.toSignificant(4)
  } catch (error) {
    formattedPrice = '0'
  }

  const label = showInverted ? `${price.quoteCurrency?.symbol}` : `${price.baseCurrency?.symbol} `
  const labelInverted = showInverted ? `${price.baseCurrency?.symbol} ` : `${price.quoteCurrency?.symbol}`
  const flipPrice = useCallback(() => setShowInverted(!showInverted), [setShowInverted, showInverted])

  const text = `${'1 ' + labelInverted + ' = ' + formattedPrice ?? '-'} ${label}`

  return (
    <StyledPriceContainer onClick={flipPrice} title={text}>
      <Text fontWeight={500} fontSize={14} color={theme.text1}>
        {text}
      </Text>{' '}
      {usdcPrice && (
        <TYPE.darkGray>
          <Trans>(${usdcPrice.toSignificant(6, { groupSeparator: ',' })})</Trans>
        </TYPE.darkGray>
      )}
    </StyledPriceContainer>
  )
}
