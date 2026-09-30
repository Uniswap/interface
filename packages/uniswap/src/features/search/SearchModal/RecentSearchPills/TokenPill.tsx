import { iconSizes } from '@universe/mycelium'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { Pill, PillPressProps } from 'uniswap/src/features/search/SearchModal/RecentSearchPills/Pill'
import { getTokenWarningSeverity } from 'uniswap/src/features/tokens/warnings/safetyUtils'

export function TokenPill({
  currencyInfo,
  networkCount,
  ...pressProps
}: PillPressProps & { currencyInfo: CurrencyInfo; networkCount?: number }): JSX.Element {
  const { currency } = currencyInfo
  // Blocked pills stay pressable (dimmed) so the press still opens the token's blocked explanation.
  const dimmed = getTokenWarningSeverity(currencyInfo) === WarningSeverity.Blocked
  const isMultichain = networkCount !== undefined && networkCount > 1

  return (
    <Pill
      dimmed={dimmed}
      label={currency.symbol ?? currency.name ?? ''}
      leading={
        <TokenLogo
          chainId={currency.chainId}
          hideNetworkLogo={isMultichain}
          name={currency.name}
          size={iconSizes.icon24}
          symbol={currency.symbol}
          url={currencyInfo.logoUrl}
        />
      }
      {...pressProps}
    />
  )
}
