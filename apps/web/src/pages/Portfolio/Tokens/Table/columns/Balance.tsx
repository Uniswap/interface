import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { memo, useMemo } from 'react'
import { Text, TextProps } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { EllipsisText } from '~/components/Table/shared/TableText'
import { ValueWithFadedDecimals } from '~/pages/Portfolio/components/ValueWithFadedDecimals/ValueWithFadedDecimals'
import { EmptyTableCell } from '~/pages/Portfolio/EmptyTableCell'
import type { TokenData } from '~/pages/Portfolio/Tokens/hooks/useTransformTokenTableData'

export const Balance = memo(function Balance({
  color,
  balance,
}: {
  balance: Pick<TokenData, 'quantity' | 'symbol'>
  color?: TextProps['color']
}) {
  const multichainTokenUxEnabled = useFeatureFlag(FeatureFlags.MultichainTokenUx)
  const { formatNumberOrString } = useLocalizationContext()

  const formattedBalance = useMemo(() => {
    return formatNumberOrString({ value: balance.quantity, type: NumberType.TokenNonTx })
  }, [balance.quantity, formatNumberOrString])

  if (!balance.quantity && balance.quantity !== 0) {
    return <EmptyTableCell />
  }

  const textColor = color ?? '$neutral1'

  return (
    <EllipsisText textAlign="right" variant="body3" color={textColor}>
      {multichainTokenUxEnabled ? (
        <Text variant="body3" color={textColor}>
          {formattedBalance}
        </Text>
      ) : (
        <ValueWithFadedDecimals value={formattedBalance} />
      )}{' '}
      {balance.symbol}
    </EllipsisText>
  )
})
Balance.displayName = 'Balance'
