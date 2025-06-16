import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'nexttrade/src/components/CurrencyLogo/TokenLogo'
import { CurrencyInfo } from 'nexttrade/src/features/dataApi/types'

interface CurrencyLogoProps {
  currencyInfo: Maybe<CurrencyInfo>
  size?: number
  hideNetworkLogo?: boolean
  networkLogoBorderWidth?: number
}

export const STATUS_RATIO = 0.4

export function CurrencyLogo({
  currencyInfo,
  size = iconSizes.icon40,
  hideNetworkLogo,
  networkLogoBorderWidth,
}: CurrencyLogoProps): JSX.Element | null {
  if (!currencyInfo) {
    return null
  }

  const { currency, logoUrl } = currencyInfo
  const { chainId, symbol, name } = currency

  return (
    <TokenLogo
      chainId={chainId}
      hideNetworkLogo={hideNetworkLogo}
      name={name}
      networkLogoBorderWidth={networkLogoBorderWidth}
      size={size}
      symbol={symbol}
      url={logoUrl}
    />
  )
}
