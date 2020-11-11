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
        <TYPE.purple3 fontSize="14px" fontWeight={500}>
          {currencies[Field.CURRENCY_A]?.symbol} Deposited
        </TYPE.purple3>
        <RowFixed>
          <CurrencyLogo currency={currencies[Field.CURRENCY_A]} style={{ marginRight: '8px' }} />
          <TYPE.purple3 fontSize="14px" fontWeight={500}>
            {parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)}
          </TYPE.purple3>
        </RowFixed>
      </RowBetween>
      <RowBetween>
        <TYPE.purple3 fontSize="14px" fontWeight={500}>
          {currencies[Field.CURRENCY_B]?.symbol} Deposited
        </TYPE.purple3>
        <RowFixed>
          <CurrencyLogo currency={currencies[Field.CURRENCY_B]} style={{ marginRight: '8px' }} />
          <TYPE.purple3 fontSize="14px" fontWeight={500}>
            {parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)}
          </TYPE.purple3>
        </RowFixed>
      </RowBetween>
      <RowBetween>
        <TYPE.purple3 fontSize="14px" fontWeight={500}>
          Rates
        </TYPE.purple3>
        <TYPE.purple3 fontSize="14px" fontWeight={500}>
          {`1 ${currencies[Field.CURRENCY_A]?.symbol} = ${price?.toSignificant(4)} ${
            currencies[Field.CURRENCY_B]?.symbol
          }`}
        </TYPE.purple3>
      </RowBetween>
      <RowBetween style={{ justifyContent: 'flex-end' }}>
        <TYPE.purple3 fontSize="14px" fontWeight={500}>
          {`1 ${currencies[Field.CURRENCY_B]?.symbol} = ${price?.invert().toSignificant(4)} ${
            currencies[Field.CURRENCY_A]?.symbol
          }`}
        </TYPE.purple3>
      </RowBetween>
      <RowBetween>
        <TYPE.purple3 fontSize="14px" fontWeight={500}>
          Share of Pool:
        </TYPE.purple3>
        <TYPE.purple3 fontSize="14px" fontWeight={500}>
          {noLiquidity ? '100' : poolTokenPercentage?.toSignificant(4)}%
        </TYPE.purple3>
      </RowBetween>
      <ButtonPrimary style={{ margin: '20px 0 0 0' }} onClick={onAdd}>
        <Text fontWeight={600} fontSize={13}>
          {noLiquidity ? 'Create Pool & Supply' : 'Confirm Supply'}
        </Text>
      </ButtonPrimary>
    </>
  )
}
