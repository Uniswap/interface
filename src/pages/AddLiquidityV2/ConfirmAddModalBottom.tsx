import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Fraction, Percent } from '@uniswap/sdk-core'
import { Text as RebassText } from 'rebass'

import { ButtonPrimary } from '../../components/Button'
import CurrencyLogo from '../../components/CurrencyLogo'
import { RowBetween, RowFixed } from '../../components/Row'
import { Field } from '../../state/mint/actions'
import { TextPreset } from '../../theme'

export function ConfirmAddModalBottom({
  noLiquidity,
  price,
  currencies,
  parsedAmounts,
  poolTokenPercentage,
  onAdd,
}: {
  noLiquidity?: boolean
  price?: Fraction
  currencies: { [field in Field]?: Currency }
  parsedAmounts: { [field in Field]?: CurrencyAmount<Currency> }
  poolTokenPercentage?: Percent
  onAdd: () => void
}) {
  return (
    <>
      <RowBetween>
        <TextPreset.Body>
          <Trans>{currencies[Field.CURRENCY_A]?.symbol} Deposited</Trans>
        </TextPreset.Body>
        <RowFixed>
          <CurrencyLogo currency={currencies[Field.CURRENCY_A]} style={{ marginRight: '8px' }} />
          <TextPreset.Body>{parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)}</TextPreset.Body>
        </RowFixed>
      </RowBetween>
      <RowBetween>
        <TextPreset.Body>
          <Trans>{currencies[Field.CURRENCY_B]?.symbol} Deposited</Trans>
        </TextPreset.Body>
        <RowFixed>
          <CurrencyLogo currency={currencies[Field.CURRENCY_B]} style={{ marginRight: '8px' }} />
          <TextPreset.Body>{parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)}</TextPreset.Body>
        </RowFixed>
      </RowBetween>
      <RowBetween>
        <TextPreset.Body>
          <Trans>Rates</Trans>
        </TextPreset.Body>
        <TextPreset.Body>
          {`1 ${currencies[Field.CURRENCY_A]?.symbol} = ${price?.toSignificant(4)} ${
            currencies[Field.CURRENCY_B]?.symbol
          }`}
        </TextPreset.Body>
      </RowBetween>
      <RowBetween style={{ justifyContent: 'flex-end' }}>
        <TextPreset.Body>
          {`1 ${currencies[Field.CURRENCY_B]?.symbol} = ${price?.invert().toSignificant(4)} ${
            currencies[Field.CURRENCY_A]?.symbol
          }`}
        </TextPreset.Body>
      </RowBetween>
      <RowBetween>
        <TextPreset.Body>
          <Trans>Share of Pool:</Trans>
        </TextPreset.Body>
        <TextPreset.Body>
          <Trans>{noLiquidity ? '100' : poolTokenPercentage?.toSignificant(4)}%</Trans>
        </TextPreset.Body>
      </RowBetween>
      <ButtonPrimary style={{ margin: '20px 0 0 0' }} onClick={onAdd}>
        <RebassText fontWeight={500} fontSize={20}>
          {noLiquidity ? <Trans>Create Pool & Supply</Trans> : <Trans>Confirm Supply</Trans>}
        </RebassText>
      </ButtonPrimary>
    </>
  )
}
