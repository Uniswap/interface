import { memo, useMemo } from 'react'
import { Text, TextProps } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { EllipsisText } from '~/components/Table/shared/TableText'
import { EmptyTableCell } from '~/pages/Portfolio/EmptyTableCell'
import type { TokenData } from '~/pages/Portfolio/Tokens/hooks/useTransformTokenTableData'

function BalanceInner({
  color,
  balance,
}: {
  balance: Pick<TokenData, 'quantity' | 'symbol'>
  color?: TextProps['color']
}) {
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
      <Text variant="body3" color={textColor}>
        {formattedBalance}
      </Text>{' '}
      {balance.symbol}
    </EllipsisText>
  )
}

export const Balance = memo(BalanceInner, (prev, next) => {
  return (
    prev.balance.quantity === next.balance.quantity &&
    prev.balance.symbol === next.balance.symbol &&
    prev.color === next.color
  )
})
Balance.displayName = 'Balance'
