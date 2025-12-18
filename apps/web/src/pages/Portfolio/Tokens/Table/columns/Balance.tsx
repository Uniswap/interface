import { EllipsisText } from 'components/Table/styled'
import { ValueWithFadedDecimals } from 'pages/Portfolio/components/ValueWithFadedDecimals/ValueWithFadedDecimals'
import { EmptyTableCell } from 'pages/Portfolio/EmptyTableCell'
import { TokenData } from 'pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import { memo, useMemo } from 'react'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

export const Balance = memo(function Balance({ balance }: { balance: TokenData['balance'] }) {
  const { formatNumberOrString } = useLocalizationContext()

  const formattedBalance = useMemo(() => {
    return formatNumberOrString({ value: balance.value, type: NumberType.TokenNonTx })
  }, [balance.value, formatNumberOrString])

  if (!balance.value && balance.value !== 0) {
    return <EmptyTableCell />
  }

  return (
    <EllipsisText textAlign="right" variant="body3">
      <ValueWithFadedDecimals value={formattedBalance} /> {balance.symbol}
    </EllipsisText>
  )
})
Balance.displayName = 'Balance'
