import { Currency, CurrencyAmount, Fraction, Percent } from '@uniswap/sdk-core'
import { ButtonPrimary } from 'components/Button/buttons'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { RowBetween, RowFixed } from 'components/deprecated/Row'
import { Trans } from 'react-i18next'
import { Text } from 'rebass'
import { Field } from 'state/mint/actions'
import { ThemedText } from 'theme/components'

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
  const depositedAmtA = currencies[Field.CURRENCY_A]?.symbol
  const depositedAmtB = currencies[Field.CURRENCY_B]?.symbol
  return (
    <>
      <RowBetween>
        <ThemedText.DeprecatedBody>
          <Trans i18nKey="common.amountDeposited.label" values={{ amount: depositedAmtA }} />
        </ThemedText.DeprecatedBody>
        <RowFixed>
          <CurrencyLogo currency={currencies[Field.CURRENCY_A]} style={{ marginRight: '8px' }} />
          <ThemedText.DeprecatedBody>{parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)}</ThemedText.DeprecatedBody>
        </RowFixed>
      </RowBetween>
      <RowBetween>
        <ThemedText.DeprecatedBody>
          <Trans i18nKey="common.amountDeposited.label" values={{ amount: depositedAmtB }} />
        </ThemedText.DeprecatedBody>
        <RowFixed>
          <CurrencyLogo currency={currencies[Field.CURRENCY_B]} style={{ marginRight: '8px' }} />
          <ThemedText.DeprecatedBody>{parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)}</ThemedText.DeprecatedBody>
        </RowFixed>
      </RowBetween>
      <RowBetween>
        <ThemedText.DeprecatedBody>
          <Trans i18nKey="pool.rates" />
        </ThemedText.DeprecatedBody>
        <ThemedText.DeprecatedBody>
          {`1 ${currencies[Field.CURRENCY_A]?.symbol} = ${price?.toSignificant(4)} ${
            currencies[Field.CURRENCY_B]?.symbol
          }`}
        </ThemedText.DeprecatedBody>
      </RowBetween>
      <RowBetween style={{ justifyContent: 'flex-end' }}>
        <ThemedText.DeprecatedBody>
          {`1 ${currencies[Field.CURRENCY_B]?.symbol} = ${price?.invert().toSignificant(4)} ${
            currencies[Field.CURRENCY_A]?.symbol
          }`}
        </ThemedText.DeprecatedBody>
      </RowBetween>
      <RowBetween>
        <ThemedText.DeprecatedBody>
          <Trans i18nKey="pool.shareOf" />
        </ThemedText.DeprecatedBody>
        <ThemedText.DeprecatedBody>
          {noLiquidity ? '100' : poolTokenPercentage?.toSignificant(4)}%
        </ThemedText.DeprecatedBody>
      </RowBetween>
      <ButtonPrimary style={{ margin: '20px 0 0 0' }} onClick={onAdd}>
        <Text fontWeight={535} fontSize={20}>
          {noLiquidity ? <Trans i18nKey="pool.createAndSupply" /> : <Trans i18nKey="pool.confirmSupply" />}
        </Text>
      </ButtonPrimary>
    </>
  )
}
