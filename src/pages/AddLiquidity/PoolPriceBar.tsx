import { OutlineCard } from 'components/Card'
import { Currency, Fraction, JSBI, Pair, Percent, Price } from 'libs/sdk/src'
import React, { useContext } from 'react'
import { Text } from 'rebass'
import styled, { ThemeContext } from 'styled-components'
import { priceRangeCalc } from 'utils/dmm'
import { AutoColumn } from '../../components/Column'
import { AutoRow } from '../../components/Row'
import { ONE_BIPS } from '../../constants'
import { Field } from '../../state/mint/actions'
import { TYPE } from '../../theme'

const AutoColumn2 = styled(AutoColumn)`
  width: 48%;
  height: 100%;
  margin: 0 !important;
`

const OutlineCard2 = styled(OutlineCard)`
  padding: 0.75rem;
  border: 2px solid ${({ theme }) => theme.bg3};
  border-style: dashed;
`
export function PoolPriceBar({
  currencies,
  noLiquidity,
  poolTokenPercentage,
  price,
  pair
}: {
  currencies: { [field in Field]?: Currency }
  noLiquidity?: boolean
  poolTokenPercentage?: Percent
  price?: Price
  pair: Pair | null | undefined
}) {
  const theme = useContext(ThemeContext)
  const percentToken0 = pair
    ? pair.virtualReserve0
        .divide(pair.reserve0)
        .multiply('100')
        .divide(pair.virtualReserve0.divide(pair.reserve0).add(pair.virtualReserve1.divide(pair.reserve1)))
        .toSignificant(2) ?? '.'
    : '50%'
  const percentToken1 = pair
    ? new Fraction(JSBI.BigInt(100), JSBI.BigInt(1)).subtract(percentToken0).toSignificant(2) ?? '.'
    : '50%'
  return (
    <AutoColumn gap="md">
      <AutoRow justify="space-between" gap="4px">
        <AutoColumn2>
          <OutlineCard2>
            <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
              {currencies[Field.CURRENCY_A]?.symbol}/{currencies[Field.CURRENCY_B]?.symbol} ={' '}
              {price?.toSignificant(6) ?? '-'}
            </Text>
            <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
              {currencies[Field.CURRENCY_B]?.symbol}/{currencies[Field.CURRENCY_A]?.symbol} ={' '}
              {price?.invert()?.toSignificant(6) ?? '-'}
            </Text>
          </OutlineCard2>
        </AutoColumn2>
        <AutoColumn2>
          <OutlineCard2>
            <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
              Share of Pool :{' '}
              {noLiquidity && price
                ? '100'
                : (poolTokenPercentage?.lessThan(ONE_BIPS) ? '<0.01' : poolTokenPercentage?.toFixed(2)) ?? '0'}
              %
            </Text>
            <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
              Ratio: {percentToken0}&nbsp;{currencies[Field.CURRENCY_A]?.symbol}&nbsp;-&nbsp;{percentToken1}&nbsp;
              {currencies[Field.CURRENCY_B]?.symbol}
            </Text>
          </OutlineCard2>
        </AutoColumn2>
      </AutoRow>
    </AutoColumn>
  )
}

export function PoolPriceRangeBar({
  currencies,
  price,
  pair,
  amplification
}: {
  currencies: { [field in Field]?: Currency }
  price?: Price | Fraction
  pair: Pair | null | undefined
  amplification?: Fraction
}) {
  const amp = !!pair ? new Fraction(pair.amp).divide(JSBI.BigInt(10000)) : amplification?.divide(JSBI.BigInt(10000))
  const theme = useContext(ThemeContext)
  const show = !!priceRangeCalc(price, amp)[0]
  return (
    <AutoColumn gap="md">
      <AutoRow justify="space-between" gap="4px">
        <AutoColumn>
          <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
            {currencies[Field.CURRENCY_A]?.symbol}/{currencies[Field.CURRENCY_B]?.symbol}
          </Text>
          {show ? (
            <>
              <TYPE.black>Max: {priceRangeCalc(price, amp)[0]?.toSignificant(6) ?? '-'}</TYPE.black>
              <TYPE.black>Min: {priceRangeCalc(price, amp)[1]?.toSignificant(6) ?? '-'}</TYPE.black>
            </>
          ) : (
            '--/--'
          )}
        </AutoColumn>
        <AutoColumn justify="end">
          <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
            {currencies[Field.CURRENCY_B]?.symbol}/{currencies[Field.CURRENCY_A]?.symbol}
          </Text>
          {show ? (
            <>
              <TYPE.black>Max: {priceRangeCalc(price?.invert(), amp)[0]?.toSignificant(6) ?? '-'}</TYPE.black>
              <TYPE.black>Min: {priceRangeCalc(price?.invert(), amp)[1]?.toSignificant(6) ?? '-'}</TYPE.black>
            </>
          ) : (
            '--/--'
          )}
        </AutoColumn>
      </AutoRow>
    </AutoColumn>
  )
}
