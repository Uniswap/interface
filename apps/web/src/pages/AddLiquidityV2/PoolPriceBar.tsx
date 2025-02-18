import { Currency, Percent, Price } from '@uniswap/sdk-core'
import { AutoColumn } from 'components/deprecated/Column'
import { AutoRow } from 'components/deprecated/Row'
import { ONE_BIPS } from 'constants/misc'
import { useTheme } from 'lib/styled-components'
import { Trans } from 'react-i18next'
import { Text } from 'rebass'
import { Field } from 'state/mint/actions'
import { ThemedText } from 'theme/components'

export function PoolPriceBar({
  currencies,
  noLiquidity,
  poolTokenPercentage,
  price,
}: {
  currencies: { [field in Field]?: Currency }
  noLiquidity?: boolean
  poolTokenPercentage?: Percent
  price?: Price<Currency, Currency>
}) {
  const theme = useTheme()

  let invertedPrice: string | undefined
  try {
    invertedPrice = price?.invert()?.toSignificant(6)
  } catch (error) {
    invertedPrice = undefined
  }

  return (
    <AutoColumn gap="md">
      <AutoRow justify="space-around" gap="4px">
        <AutoColumn justify="center">
          <ThemedText.DeprecatedBlack data-testid="currency-b-price">
            {price?.toSignificant(6) ?? '-'}
          </ThemedText.DeprecatedBlack>
          <Text fontWeight={535} fontSize={14} color={theme.neutral2} pt={1}>
            <Trans
              i18nKey="common.feesEarnedPerBase"
              values={{ symbolA: currencies[Field.CURRENCY_B]?.symbol, symbolB: currencies[Field.CURRENCY_A]?.symbol }}
            />
          </Text>
        </AutoColumn>
        <AutoColumn justify="center">
          <ThemedText.DeprecatedBlack data-testid="currency-a-price">{invertedPrice ?? '-'}</ThemedText.DeprecatedBlack>
          <Text fontWeight={535} fontSize={14} color={theme.neutral2} pt={1}>
            <Trans
              i18nKey="common.feesEarnedPerBase"
              values={{ symbolA: currencies[Field.CURRENCY_A]?.symbol, symbolB: currencies[Field.CURRENCY_B]?.symbol }}
            />
          </Text>
        </AutoColumn>
        <AutoColumn justify="center">
          <ThemedText.DeprecatedBlack>
            {noLiquidity && price
              ? '100'
              : (poolTokenPercentage?.lessThan(ONE_BIPS) ? '<0.01' : poolTokenPercentage?.toFixed(2)) ?? '0'}
            %
          </ThemedText.DeprecatedBlack>
          <Text fontWeight={535} fontSize={14} color={theme.neutral2} pt={1}>
            <Trans i18nKey="addLiquidity.shareOfPool" />
          </Text>
        </AutoColumn>
      </AutoRow>
    </AutoColumn>
  )
}
