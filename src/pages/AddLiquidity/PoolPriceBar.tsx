import { ButtonEmpty } from 'components/Button'
import { OutlineCard } from 'components/Card'
import { FlyoutPriceRange } from 'components/Menu'
import { FixedHeightRow } from 'components/PositionCard'
import QuestionHelper from 'components/QuestionHelper'
import { Currency, Fraction, JSBI, Pair, Percent, Price } from 'libs/sdk/src'
import React, { ReactNode, useContext } from 'react'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import { Text } from 'rebass'
import styled, { ThemeContext } from 'styled-components'
import { priceRangeCalc, priceRangeCalcByPair } from 'utils/dmm'
import { AutoColumn } from '../../components/Column'
import { AutoRow, RowFixed } from '../../components/Row'
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

const OutlineCard3 = styled(OutlineCard2)`
  text-align: left;
`

const ChevronUp2 = styled(ChevronUp)`
  color: ${({ theme }) => theme.text1};
`
const ChevronDown2 = styled(ChevronDown)`
  color: ${({ theme }) => theme.text1};
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
    ? pair.reserve0
        .divide(pair.virtualReserve0)
        .multiply('100')
        .divide(pair.reserve0.divide(pair.virtualReserve0).add(pair.reserve1.divide(pair.virtualReserve1)))
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

export function ToggleComponent({
  children,
  title = '',
  question = ''
}: {
  children: ReactNode
  title: string
  question: string
}) {
  const theme = useContext(ThemeContext)
  const [showDetails, setShowDetails] = useState(false)
  return (
    <>
      <FixedHeightRow>
        <AutoRow>
          <Text fontWeight={500} fontSize={14} color={theme.text2}>
            {title}
          </Text>
          <QuestionHelper text={question} />
        </AutoRow>
        <RowFixed gap="8px">
          <ButtonEmpty
            padding="6px 8px"
            borderRadius="12px"
            width="fit-content"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? (
              <ChevronUp2 size="20" style={{ marginLeft: '10px' }} />
            ) : (
              <ChevronDown2 size="20" style={{ marginLeft: '10px' }} />
            )}
          </ButtonEmpty>
        </RowFixed>
      </FixedHeightRow>
      {showDetails && <>{children}</>}
    </>
  )
}

export function PoolPriceRangeBarToggle({
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
  return (
    <OutlineCard3>
      <ToggleComponent title="Active Price Range" question="Active Price Range">
        <PoolPriceRangeBar currencies={currencies} price={price} pair={pair} amplification={amplification} />
      </ToggleComponent>
    </OutlineCard3>
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
  const theme = useContext(ThemeContext)
  // const amp = !!pair ? new Fraction(pair.amp).divide(JSBI.BigInt(10000)) : amplification?.divide(JSBI.BigInt(10000))
  // const show = !!priceRangeCalc(price, amp)[0]
  const existedPriceRange = () => {
    const show = !!pair && !!priceRangeCalcByPair(pair)[0][0]
    return (
      <AutoColumn gap="md">
        <AutoRow justify="space-between" gap="4px">
          <AutoColumn>
            <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
              {currencies[Field.CURRENCY_A]?.symbol}/{currencies[Field.CURRENCY_B]?.symbol}
            </Text>
            {show && !!pair ? (
              <>
                <TYPE.black>
                  Max:{' '}
                  {priceRangeCalcByPair(pair)[
                    currencies[Field.CURRENCY_A]?.symbol == pair.token0.symbol ? 0 : 1
                  ][1]?.toSignificant(6) ?? '-'}
                </TYPE.black>
                <TYPE.black>
                  Min:{' '}
                  {priceRangeCalcByPair(pair)[
                    currencies[Field.CURRENCY_A]?.symbol == pair.token0.symbol ? 0 : 1
                  ][0]?.toSignificant(6) ?? '-'}
                </TYPE.black>
              </>
            ) : (
              '--/--'
            )}
          </AutoColumn>
          <AutoColumn justify="end">
            <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
              {currencies[Field.CURRENCY_B]?.symbol}/{currencies[Field.CURRENCY_A]?.symbol}
            </Text>
            {show && !!pair ? (
              <>
                <TYPE.black>
                  Max:{' '}
                  {priceRangeCalcByPair(pair)[
                    currencies[Field.CURRENCY_A]?.symbol == pair.token0.symbol ? 1 : 0
                  ][1]?.toSignificant(6) ?? '-'}
                </TYPE.black>
                <TYPE.black>
                  Min:{' '}
                  {priceRangeCalcByPair(pair)[
                    currencies[Field.CURRENCY_A]?.symbol == pair.token0.symbol ? 1 : 0
                  ][0]?.toSignificant(6) ?? '-'}
                </TYPE.black>
              </>
            ) : (
              '--/--'
            )}
          </AutoColumn>
        </AutoRow>
      </AutoColumn>
    )
  }
  const newPriceRange = () => {
    const amp = amplification?.divide(JSBI.BigInt(10000))
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

  return <>{!!pair ? existedPriceRange() : newPriceRange()}</>
}
