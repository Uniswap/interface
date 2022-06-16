import { useGetCoinsListQuery } from 'src/features/dataApi/coingecko/enhancedApi'
import { CoinIdAndCurrencyIdMappings } from 'src/features/dataApi/coingecko/types'

export function useCoinIdAndCurrencyIdMappings() {
  const { currentData, isLoading } = useGetCoinsListQuery({ includePlatform: true })

  const mappings = currentData as Nullable<CoinIdAndCurrencyIdMappings>

  return {
    coinIdToCurrencyIds: mappings?.coinIdToCurrencyIds ?? {},
    currencyIdToCoinId: mappings?.currencyIdToCoinId ?? {},
    isLoading,
  }
}
