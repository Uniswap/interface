import { TrueSightTokenData } from 'pages/TrueSight/hooks/useGetTrendingSoonData'
import { formattedNumLong } from 'utils'

export default function getFormattedNumLongDiscoveredDetails(tokenData: TrueSightTokenData): {
  price: string
  pricePercent: string
  tradingVolume: string
  tradingVolumePercent: string
  marketCap: string
  marketCapPercent: string
} {
  if (tokenData.discovered_details === undefined)
    return {
      price: '',
      pricePercent: '',
      tradingVolume: '',
      tradingVolumePercent: '',
      marketCap: '',
      marketCapPercent: '',
    }
  const { price, trading_volume, market_cap, discovered_details } = tokenData
  const { price_discovered, trading_volume_discovered, market_cap_discovered } = discovered_details
  return {
    price: price_discovered <= 0 ? '--' : formattedNumLong(price_discovered, true),
    pricePercent:
      price <= 0 || price_discovered <= 0
        ? '--'
        : formattedNumLong((price / price_discovered) * 100 - 100, false) + '%',
    tradingVolume: trading_volume_discovered <= 0 ? '--' : formattedNumLong(trading_volume_discovered, true),
    tradingVolumePercent:
      trading_volume <= 0 || trading_volume_discovered <= 0
        ? '--'
        : formattedNumLong((trading_volume / trading_volume_discovered) * 100 - 100, false) + '%',
    marketCap: market_cap_discovered <= 0 ? '--' : formattedNumLong(market_cap_discovered, true),
    marketCapPercent:
      market_cap <= 0 || market_cap_discovered <= 0
        ? '--'
        : formattedNumLong((market_cap / market_cap_discovered) * 100 - 100, false) + '%',
  }
}
