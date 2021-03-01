import { Currency, Fraction, JSBI, Pair, Percent, Price } from 'libs/sdk/src'
import React, { useContext } from 'react'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { priceRangeCalc } from 'utils/dmm'
import { AutoColumn } from '../../components/Column'
import { AutoRow } from '../../components/Row'
import { ONE_BIPS } from '../../constants'
import { Field } from '../../state/mint/actions'
import { TYPE } from '../../theme'

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
    : '.'
  const percentToken1 = pair
    ? new Fraction(JSBI.BigInt(100), JSBI.BigInt(1)).subtract(percentToken0).toSignificant(2) ?? '.'
    : '.'
  return (
    <AutoColumn gap="md">
      <AutoRow justify="space-between" gap="4px">
        <AutoColumn>
          <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
            {currencies[Field.CURRENCY_B]?.symbol}/{currencies[Field.CURRENCY_A]?.symbol} ={' '}
            {price?.toSignificant(6) ?? '-'}
          </Text>
          <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
            {currencies[Field.CURRENCY_A]?.symbol}/{currencies[Field.CURRENCY_B]?.symbol} ={' '}
            {price?.invert()?.toSignificant(6) ?? '-'}
          </Text>
        </AutoColumn>
        <AutoColumn>
          <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
            Share of Pool :{' '}
            {noLiquidity && price
              ? '100'
              : (poolTokenPercentage?.lessThan(ONE_BIPS) ? '<0.01' : poolTokenPercentage?.toFixed(2)) ?? '0'}
            %
          </Text>
          <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
            Ratio:
            {pair && (
              <>
                {percentToken0}% {pair.token0.symbol} - {percentToken1}% {pair.token1.symbol}
              </>
            )}
          </Text>
        </AutoColumn>
      </AutoRow>
    </AutoColumn>
  )
}

export function PoolPriceRangeBar({
  currencies,
  price,
  pair
}: {
  currencies: { [field in Field]?: Currency }
  price?: Price | Fraction
  pair: Pair | null | undefined
}) {
  const amp = pair?.virtualReserve0.divide(pair?.reserve0)
  const theme = useContext(ThemeContext)
  return (
    <AutoColumn gap="md">
      <AutoRow justify="space-between" gap="4px">
        <AutoColumn>
          <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
            {currencies[Field.CURRENCY_A]?.symbol}/{currencies[Field.CURRENCY_B]?.symbol}
          </Text>
          <TYPE.black>Max: {priceRangeCalc(price, amp)[0]?.toSignificant(6) ?? '-'}</TYPE.black>
          <TYPE.black>Min: {priceRangeCalc(price, amp)[1]?.toSignificant(6) ?? '-'}</TYPE.black>
        </AutoColumn>
        <AutoColumn justify="end">
          <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
            {currencies[Field.CURRENCY_B]?.symbol}/{currencies[Field.CURRENCY_A]?.symbol}
          </Text>
          <TYPE.black>Max: {priceRangeCalc(price?.invert(), amp)[0]?.toSignificant(6) ?? '-'}</TYPE.black>
          <TYPE.black>Min: {priceRangeCalc(price?.invert(), amp)[1]?.toSignificant(6) ?? '-'}</TYPE.black>
        </AutoColumn>
      </AutoRow>
    </AutoColumn>
  )
}
