import { PositionInfo } from 'components/Liquidity/types'
import { EmptyTableCell } from 'pages/Portfolio/EmptyTableCell'
import { memo } from 'react'
import { Text } from 'ui/src'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { NumberType } from 'utilities/src/format/types'

// Fourth column cell component - Balance in USD
export const PoolBalanceCell = memo(function PoolBalanceCell({ position }: { position: PositionInfo }) {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const fiatValue0 = useUSDCValue(position.currency0Amount, PollingInterval.Slow)
  const fiatValue1 = useUSDCValue(position.currency1Amount, PollingInterval.Slow)

  if (!fiatValue0 && !fiatValue1) {
    return <EmptyTableCell />
  }

  // Calculate total with proper handling when one value might be missing
  const totalBalanceUSD = fiatValue0 && fiatValue1 ? fiatValue0.add(fiatValue1) : (fiatValue0 ?? fiatValue1)

  if (!totalBalanceUSD) {
    return <EmptyTableCell />
  }

  return (
    <Text variant="body3" color="$neutral1">
      {convertFiatAmountFormatted(totalBalanceUSD.toExact(), NumberType.FiatTokenPrice)}
    </Text>
  )
})
PoolBalanceCell.displayName = 'PoolBalanceCell'
