import { Currency, CurrencyAmount, Fraction, Percent } from 'dxswap-sdk'
import React from 'react'
import { Text } from 'rebass'
import { ButtonPrimary } from '../../components/Button'
import { RowBetween, RowFixed } from '../../components/Row'
import CurrencyLogo from '../../components/CurrencyLogo'
import { Field } from '../../state/mint/actions'
import { TYPE } from '../../theme'

export function ConfirmAddModalBottom({
  noLiquidity,
  price,
  currencies,
  parsedAmounts,
  poolTokenPercentage,
  onAdd
}: {
  noLiquidity?: boolean
  price?: Fraction
  currencies: { [field in Field]?: Currency }
  parsedAmounts: { [field in Field]?: CurrencyAmount }
  poolTokenPercentage?: Percent
  onAdd: () => void
}) {
  return (
    <>
      <RowBetween>
        <TYPE.body fontSize="14px" fontWeight={500} color="text5">
          {currencies[Field.CURRENCY_A]?.symbol} Deposited
        </TYPE.body>
        <RowFixed>
          <CurrencyLogo size="16px" currency={currencies[Field.CURRENCY_A]} marginRight={4} />
          <TYPE.body fontSize="14px" fontWeight={500} color="text5">
            {parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)}
          </TYPE.body>
        </RowFixed>
      </RowBetween>
      <RowBetween>
        <TYPE.body fontSize="14px" fontWeight={500} color="text5">
          {currencies[Field.CURRENCY_B]?.symbol} Deposited
        </TYPE.body>
        <RowFixed>
          <CurrencyLogo size="16px" currency={currencies[Field.CURRENCY_B]} marginRight={4} />
          <TYPE.body fontSize="14px" fontWeight={500} color="text5">
            {parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)}
          </TYPE.body>
        </RowFixed>
      </RowBetween>
      <RowBetween>
        <TYPE.body fontSize="14px" fontWeight={500} color="text5">
          Rates
        </TYPE.body>
        <TYPE.body fontSize="14px" fontWeight={500} color="text5">
          {`1 ${currencies[Field.CURRENCY_A]?.symbol} = ${price?.toSignificant(4)} ${
            currencies[Field.CURRENCY_B]?.symbol
          }`}
        </TYPE.body>
      </RowBetween>
      <RowBetween style={{ justifyContent: 'flex-end' }}>
        <TYPE.body fontSize="14px" fontWeight={500} color="text5">
          {`1 ${currencies[Field.CURRENCY_B]?.symbol} = ${price?.invert().toSignificant(4)} ${
            currencies[Field.CURRENCY_A]?.symbol
          }`}
        </TYPE.body>
      </RowBetween>
      <RowBetween>
        <TYPE.body fontSize="14px" fontWeight={500} color="text5">
          Share of Pool:
        </TYPE.body>
        <TYPE.body fontSize="14px" fontWeight={500} color="text5">
          {noLiquidity ? '100' : poolTokenPercentage?.toSignificant(4)}%
        </TYPE.body>
      </RowBetween>
      <ButtonPrimary style={{ margin: '20px 0 0 0' }} onClick={onAdd}>
        <Text fontWeight={600} fontSize={13}>
          {noLiquidity ? 'Create Pool & Supply' : 'Confirm Supply'}
        </Text>
      </ButtonPrimary>
    </>
  )
}
