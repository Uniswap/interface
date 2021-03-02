import { Currency, CurrencyAmount, Fraction, JSBI, Pair, Percent } from 'libs/sdk/src'
import React from 'react'
import { Text } from 'rebass'
import { ButtonPrimary } from '../../components/Button'
import { AutoRow, RowBetween, RowFixed } from '../../components/Row'
import CurrencyLogo from '../../components/CurrencyLogo'
import { Field } from '../../state/mint/actions'
import { TYPE } from '../../theme'
import { PoolPriceRangeBar } from './PoolPriceBar'
import { AutoColumn } from 'components/Column'
import { Separator } from 'components/SearchModal/styleds'
import styled from 'styled-components'
import { parseUnits } from 'ethers/lib/utils'

const SeparatorWhite = styled(Separator)`
  background-color: ${({ theme }) => theme.white};
`
export function ConfirmAddModalBottom({
  pair,
  noLiquidity,
  price,
  currencies,
  parsedAmounts,
  poolTokenPercentage,
  onAdd,
  typedAmp
}: {
  pair: Pair | null | undefined
  noLiquidity?: boolean
  price?: Fraction
  currencies: { [field in Field]?: Currency }
  parsedAmounts: { [field in Field]?: CurrencyAmount }
  poolTokenPercentage?: Percent
  onAdd: () => void
  typedAmp?: number
}) {
  // console.log(
  //   'onAdd',
  //   new Fraction(JSBI.BigInt(parseUnits('1.234567', 10)), JSBI.BigInt(parseUnits('1', 6))).toSignificant(5)
  // )
  let amp
  if (pair) {
    amp = pair.virtualReserve0.divide(pair?.reserve0)
  } else {
    amp = new Fraction(JSBI.BigInt(parseUnits((typedAmp as number).toString(), 20)), JSBI.BigInt(parseUnits('1', 20)))
  }
  return (
    <>
      <RowBetween>
        <TYPE.body>{currencies[Field.CURRENCY_A]?.symbol} Deposited</TYPE.body>
        <RowFixed>
          <CurrencyLogo currency={currencies[Field.CURRENCY_A]} style={{ marginRight: '8px' }} />
          <TYPE.body>{parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)}</TYPE.body>
        </RowFixed>
      </RowBetween>
      <RowBetween>
        <TYPE.body>{currencies[Field.CURRENCY_B]?.symbol} Deposited</TYPE.body>
        <RowFixed>
          <CurrencyLogo currency={currencies[Field.CURRENCY_B]} style={{ marginRight: '8px' }} />
          <TYPE.body>{parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)}</TYPE.body>
        </RowFixed>
      </RowBetween>
      <RowBetween>
        <TYPE.body>Rates</TYPE.body>
        <TYPE.body>
          {`1 ${currencies[Field.CURRENCY_A]?.symbol} = ${price?.toSignificant(4)} ${
            currencies[Field.CURRENCY_B]?.symbol
          }`}
        </TYPE.body>
      </RowBetween>
      <RowBetween style={{ justifyContent: 'flex-end' }}>
        <TYPE.body>
          {`1 ${currencies[Field.CURRENCY_B]?.symbol} = ${price?.invert().toSignificant(4)} ${
            currencies[Field.CURRENCY_A]?.symbol
          }`}
        </TYPE.body>
      </RowBetween>
      <SeparatorWhite />
      <TYPE.body>AMP {amp.toSignificant(5)}</TYPE.body>
      <PoolPriceRangeBar pair={pair} currencies={currencies} price={price} />

      <SeparatorWhite />
      <RowBetween>
        <TYPE.body>Share of Pool:</TYPE.body>
        <TYPE.body>{noLiquidity ? '100' : poolTokenPercentage?.toSignificant(4)}%</TYPE.body>
      </RowBetween>
      <ButtonPrimary style={{ margin: '20px 0 0 0' }} onClick={onAdd}>
        <Text fontWeight={500} fontSize={20}>
          {noLiquidity ? 'Create Pool & Supply' : 'Confirm Supply'}
        </Text>
      </ButtonPrimary>
    </>
  )
}
