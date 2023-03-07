import { Trans } from '@lingui/macro'
import { Currency, Percent, Price } from '@uniswap/sdk-core'
import { Text } from 'rebass'
import { useTheme } from 'styled-components/macro'

import { AutoColumn } from '../../components/Column'
import { AutoRow } from '../../components/Row'
import { ONE_BIPS } from '../../constants/misc'
import { Field } from '../../state/mint/actions'
import { ThemedText } from '../../theme'

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
  return (
    <AutoColumn gap="md">
      <AutoRow justify="space-around" gap="4px">
        <AutoColumn justify="center">
          <ThemedText.DeprecatedBlack>{price?.toSignificant(6) ?? '-'}</ThemedText.DeprecatedBlack>
          <Text fontWeight={500} fontSize={14} color={theme.textSecondary} pt={1}>
            <Trans>
              {currencies[Field.CURRENCY_B]?.symbol} per {currencies[Field.CURRENCY_A]?.symbol}
            </Trans>
          </Text>
        </AutoColumn>
        <AutoColumn justify="center">
          <ThemedText.DeprecatedBlack>{price?.invert()?.toSignificant(6) ?? '-'}</ThemedText.DeprecatedBlack>
          <Text fontWeight={500} fontSize={14} color={theme.textSecondary} pt={1}>
            <Trans>
              {currencies[Field.CURRENCY_A]?.symbol} per {currencies[Field.CURRENCY_B]?.symbol}
            </Trans>
          </Text>
        </AutoColumn>
        <AutoColumn justify="center">
          <ThemedText.DeprecatedBlack>
            {noLiquidity && price
              ? '100'
              : (poolTokenPercentage?.lessThan(ONE_BIPS) ? '<0.01' : poolTokenPercentage?.toFixed(2)) ?? '0'}
            %
          </ThemedText.DeprecatedBlack>
          <Text fontWeight={500} fontSize={14} color={theme.textSecondary} pt={1}>
            <Trans>Share of Pool</Trans>
          </Text>
        </AutoColumn>
      </AutoRow>
    </AutoColumn>
  )
}
