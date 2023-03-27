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
  background-color: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 4px;
  text-align: left;
`

export default function TradePrice({ price, showInverted, setShowInverted }: TradePriceProps) {
  const theme = useContext(ThemeContext)
  const usdcPrice = useUSDCPrice(showInverted ? price.baseCurrency : price.quoteCurrency)

  let formattedPrice: string
  try {
    formattedPrice = showInverted ? price.toSignificant(6) : price.invert()?.toSignificant(6)
  } catch (error) {
    formattedPrice = '0'
  }

  const label = showInverted ? `${price.quoteCurrency?.symbol}` : `${price.baseCurrency?.symbol} `
  const labelInverted = showInverted ? `${price.baseCurrency?.symbol} ` : `${price.quoteCurrency?.symbol}`
  const flipPrice = useCallback(() => setShowInverted(!showInverted), [setShowInverted, showInverted])

  const text = `${'1 ' + labelInverted + ' = ' + formattedPrice ?? '-'} ${label}`

  return (
    <StyledPriceContainer onClick={flipPrice} title={text}>
      <Text fontWeight={400} fontSize={14} color={theme.text1}>
        {text}
      </Text>
      {usdcPrice && (
        <TYPE.small color={theme.text2}>
          <Trans>(${usdcPrice.toSignificant(6, { groupSeparator: ',' })})</Trans>
        </TYPE.small>
      )}
    </StyledPriceContainer>
  )
}
