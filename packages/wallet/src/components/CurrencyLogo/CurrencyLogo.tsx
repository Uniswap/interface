import { iconSizes } from 'ui/src/theme'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { TokenLogo } from 'wallet/src/components/CurrencyLogo/TokenLogo'

interface CurrencyLogoProps {
  currencyInfo: Maybe<CurrencyInfo>
  size?: number
  hideNetworkLogo?: boolean
  networkLogoBorderWidth?: number
}

export const STATUS_RATIO = 2 / 5

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
