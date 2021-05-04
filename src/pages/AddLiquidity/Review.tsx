import React from 'react'
import { RowBetween, RowFixed } from '../../components/Row'
import { Field } from '../../state/mint/actions'
import { TYPE } from '../../theme'
import { AutoColumn } from 'components/Column'
import Card from 'components/Card'
import styled from 'styled-components'
import { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import { Position } from '@uniswap/v3-sdk'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { PositionPreview } from 'components/PositionPreview'
import { RangeBadge } from './styled'

const Wrapper = styled.div`
  padding-top: 20px;
`

export const Badge = styled(Card)<{ inRange?: boolean }>`
  width: fit-content;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  padding: 4px 6px;
  background-color: ${({ inRange, theme }) => (inRange ? theme.green1 : theme.yellow2)};
`

export function Review({
  position,
  currencies,
  outOfRange,
  baseCurrency,
}: {
  position?: Position
  existingPosition?: Position
  currencies: { [field in Field]?: Currency }
  parsedAmounts: { [field in Field]?: CurrencyAmount }
  priceLower?: Price
  priceUpper?: Price
  outOfRange: boolean
  baseCurrency?: Currency
}) {
  const currencyA: Currency | undefined = currencies[Field.CURRENCY_A]
  const currencyB: Currency | undefined = currencies[Field.CURRENCY_B]

  return (
    <Wrapper>
      <AutoColumn gap="lg">
        <RowBetween>
          <RowFixed>
            <DoubleCurrencyLogo currency0={currencyA} currency1={currencyB} size={24} margin={true} />
            <TYPE.label ml="10px" fontSize="24px">
              {currencyA?.symbol} / {currencyB?.symbol}
            </TYPE.label>
          </RowFixed>
          <RangeBadge inRange={!outOfRange}>{outOfRange ? 'Out of range' : 'In Range'}</RangeBadge>
        </RowBetween>
        {position ? (
          <PositionPreview position={position} title={'Tokens To Add'} baseCurrencyDefault={baseCurrency} />
        ) : null}
      </AutoColumn>
    </Wrapper>
  )
}

export default Review
