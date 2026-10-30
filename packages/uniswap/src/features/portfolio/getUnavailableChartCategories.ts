import type { PlainMessage } from '@bufbuild/protobuf'
import { type GetPortfolioChartResponse, WalletBalanceCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'

const CHART_SERIES_BY_CATEGORY: Partial<Record<WalletBalanceCategory, 'pools' | 'earn'>> = {
  [WalletBalanceCategory.POOLS]: 'pools',
  [WalletBalanceCategory.EARN_VAULTS]: 'earn',
}

/**
 * Returns the requested categories the chart response left empty while it has a tokens series. The backend leaves a
 * category unset when Zerion is still computing it or the fetch failed, so the total excludes it; a wallet with no
 * positions gets an all-zero series instead. No tokens series means an empty wallet, not a missing category.
 */
export function getUnavailableChartCategories({
  chartData,
  requestedCategories,
}: {
  // Partial: a chart cached by an older client can predate the pools / earn fields.
  chartData: Partial<Pick<PlainMessage<GetPortfolioChartResponse>, 'tokens' | 'pools' | 'earn'>> | undefined
  requestedCategories: WalletBalanceCategory[]
}): WalletBalanceCategory[] {
  if (!chartData?.tokens?.length) {
    return []
  }
  return requestedCategories.filter((category) => {
    const series = CHART_SERIES_BY_CATEGORY[category]
    return series !== undefined && !chartData[series]?.length
  })
}
