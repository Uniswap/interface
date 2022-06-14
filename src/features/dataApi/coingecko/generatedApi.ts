import { emptyApi as api } from './emptyApi'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAssetPlatforms: build.query<GetAssetPlatformsApiResponse, GetAssetPlatformsApiArg>({
      query: () => ({ url: `/asset_platforms` }),
    }),
    getCoinsCategories: build.query<GetCoinsCategoriesApiResponse, GetCoinsCategoriesApiArg>({
      query: (queryArg) => ({ url: `/coins/categories`, params: { order: queryArg.order } }),
    }),
    getCoinsCategoriesList: build.query<
      GetCoinsCategoriesListApiResponse,
      GetCoinsCategoriesListApiArg
    >({
      query: () => ({ url: `/coins/categories/list` }),
    }),
    getCoinsList: build.query<GetCoinsListApiResponse, GetCoinsListApiArg>({
      query: (queryArg) => ({
        url: `/coins/list`,
        params: { include_platform: queryArg.includePlatform },
      }),
    }),
    getCoinsMarkets: build.query<GetCoinsMarketsApiResponse, GetCoinsMarketsApiArg>({
      query: (queryArg) => ({
        url: `/coins/markets`,
        params: {
          vs_currency: queryArg.vsCurrency,
          ids: queryArg.ids,
          category: queryArg.category,
          order: queryArg.order,
          per_page: queryArg.perPage,
          page: queryArg.page,
          sparkline: queryArg.sparkline,
          price_change_percentage: queryArg.priceChangePercentage,
        },
      }),
    }),
    getCoinsById: build.query<GetCoinsByIdApiResponse, GetCoinsByIdApiArg>({
      query: (queryArg) => ({
        url: `/coins/${queryArg.id}`,
        params: {
          localization: queryArg.localization,
          tickers: queryArg.tickers,
          market_data: queryArg.marketData,
          community_data: queryArg.communityData,
          developer_data: queryArg.developerData,
          sparkline: queryArg.sparkline,
        },
      }),
    }),
    getCoinsByIdContractAndContractAddress: build.query<
      GetCoinsByIdContractAndContractAddressApiResponse,
      GetCoinsByIdContractAndContractAddressApiArg
    >({
      query: (queryArg) => ({ url: `/coins/${queryArg.id}/contract/${queryArg.contractAddress}` }),
    }),
    getCoinsByIdContractAndContractAddressMarketChart: build.query<
      GetCoinsByIdContractAndContractAddressMarketChartApiResponse,
      GetCoinsByIdContractAndContractAddressMarketChartApiArg
    >({
      query: (queryArg) => ({
        url: `/coins/${queryArg.id}/contract/${queryArg.contractAddress}/market_chart/`,
        params: { vs_currency: queryArg.vsCurrency, days: queryArg.days },
      }),
    }),
    getCoinsByIdContractAndContractAddressMarketChartRange: build.query<
      GetCoinsByIdContractAndContractAddressMarketChartRangeApiResponse,
      GetCoinsByIdContractAndContractAddressMarketChartRangeApiArg
    >({
      query: (queryArg) => ({
        url: `/coins/${queryArg.id}/contract/${queryArg.contractAddress}/market_chart/range`,
        params: { vs_currency: queryArg.vsCurrency, from: queryArg['from'], to: queryArg.to },
      }),
    }),
    getCoinsByIdHistory: build.query<GetCoinsByIdHistoryApiResponse, GetCoinsByIdHistoryApiArg>({
      query: (queryArg) => ({
        url: `/coins/${queryArg.id}/history`,
        params: { date: queryArg.date, localization: queryArg.localization },
      }),
    }),
    getCoinsByIdMarketChart: build.query<
      GetCoinsByIdMarketChartApiResponse,
      GetCoinsByIdMarketChartApiArg
    >({
      query: (queryArg) => ({
        url: `/coins/${queryArg.id}/market_chart`,
        params: {
          vs_currency: queryArg.vsCurrency,
          days: queryArg.days,
          interval: queryArg.interval,
        },
      }),
    }),
    getCoinsByIdMarketChartRange: build.query<
      GetCoinsByIdMarketChartRangeApiResponse,
      GetCoinsByIdMarketChartRangeApiArg
    >({
      query: (queryArg) => ({
        url: `/coins/${queryArg.id}/market_chart/range`,
        params: { vs_currency: queryArg.vsCurrency, from: queryArg['from'], to: queryArg.to },
      }),
    }),
    getCoinsByIdOhlc: build.query<GetCoinsByIdOhlcApiResponse, GetCoinsByIdOhlcApiArg>({
      query: (queryArg) => ({
        url: `/coins/${queryArg.id}/ohlc`,
        params: { vs_currency: queryArg.vsCurrency, days: queryArg.days },
      }),
    }),
    getCoinsByIdTickers: build.query<GetCoinsByIdTickersApiResponse, GetCoinsByIdTickersApiArg>({
      query: (queryArg) => ({
        url: `/coins/${queryArg.id}/tickers`,
        params: {
          exchange_ids: queryArg.exchangeIds,
          include_exchange_logo: queryArg.includeExchangeLogo,
          page: queryArg.page,
          order: queryArg.order,
          depth: queryArg.depth,
        },
      }),
    }),
    getDerivatives: build.query<GetDerivativesApiResponse, GetDerivativesApiArg>({
      query: (queryArg) => ({
        url: `/derivatives`,
        params: { include_tickers: queryArg.includeTickers },
      }),
    }),
    getDerivativesExchanges: build.query<
      GetDerivativesExchangesApiResponse,
      GetDerivativesExchangesApiArg
    >({
      query: (queryArg) => ({
        url: `/derivatives/exchanges`,
        params: { order: queryArg.order, per_page: queryArg.perPage, page: queryArg.page },
      }),
    }),
    getDerivativesExchangesList: build.query<
      GetDerivativesExchangesListApiResponse,
      GetDerivativesExchangesListApiArg
    >({
      query: () => ({ url: `/derivatives/exchanges/list` }),
    }),
    getDerivativesExchangesById: build.query<
      GetDerivativesExchangesByIdApiResponse,
      GetDerivativesExchangesByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/derivatives/exchanges/${queryArg.id}`,
        params: { include_tickers: queryArg.includeTickers },
      }),
    }),
    getExchangeRates: build.query<GetExchangeRatesApiResponse, GetExchangeRatesApiArg>({
      query: () => ({ url: `/exchange_rates` }),
    }),
    getExchanges: build.query<GetExchangesApiResponse, GetExchangesApiArg>({
      query: (queryArg) => ({
        url: `/exchanges`,
        params: { per_page: queryArg.perPage, page: queryArg.page },
      }),
    }),
    getExchangesList: build.query<GetExchangesListApiResponse, GetExchangesListApiArg>({
      query: () => ({ url: `/exchanges/list` }),
    }),
    getExchangesById: build.query<GetExchangesByIdApiResponse, GetExchangesByIdApiArg>({
      query: (queryArg) => ({ url: `/exchanges/${queryArg.id}` }),
    }),
    getExchangesByIdTickers: build.query<
      GetExchangesByIdTickersApiResponse,
      GetExchangesByIdTickersApiArg
    >({
      query: (queryArg) => ({
        url: `/exchanges/${queryArg.id}/tickers`,
        params: {
          coin_ids: queryArg.coinIds,
          include_exchange_logo: queryArg.includeExchangeLogo,
          page: queryArg.page,
          depth: queryArg.depth,
          order: queryArg.order,
        },
      }),
    }),
    getExchangesByIdVolumeChart: build.query<
      GetExchangesByIdVolumeChartApiResponse,
      GetExchangesByIdVolumeChartApiArg
    >({
      query: (queryArg) => ({
        url: `/exchanges/${queryArg.id}/volume_chart`,
        params: { days: queryArg.days },
      }),
    }),
    getGlobal: build.query<GetGlobalApiResponse, GetGlobalApiArg>({
      query: () => ({ url: `/global` }),
    }),
    getGlobalDecentralizedFinanceDefi: build.query<
      GetGlobalDecentralizedFinanceDefiApiResponse,
      GetGlobalDecentralizedFinanceDefiApiArg
    >({
      query: () => ({ url: `/global/decentralized_finance_defi` }),
    }),
    getIndexes: build.query<GetIndexesApiResponse, GetIndexesApiArg>({
      query: (queryArg) => ({
        url: `/indexes`,
        params: { per_page: queryArg.perPage, page: queryArg.page },
      }),
    }),
    getIndexesList: build.query<GetIndexesListApiResponse, GetIndexesListApiArg>({
      query: () => ({ url: `/indexes/list` }),
    }),
    getIndexesByMarketIdAndId: build.query<
      GetIndexesByMarketIdAndIdApiResponse,
      GetIndexesByMarketIdAndIdApiArg
    >({
      query: (queryArg) => ({ url: `/indexes/${queryArg.marketId}/${queryArg.id}` }),
    }),
    getPing: build.query<GetPingApiResponse, GetPingApiArg>({
      query: () => ({ url: `/ping` }),
    }),
    getSearch: build.query<GetSearchApiResponse, GetSearchApiArg>({
      query: (queryArg) => ({ url: `/search`, params: { query: queryArg.query } }),
    }),
    getSearchTrending: build.query<GetSearchTrendingApiResponse, GetSearchTrendingApiArg>({
      query: () => ({ url: `/search/trending` }),
    }),
    getSimplePrice: build.query<GetSimplePriceApiResponse, GetSimplePriceApiArg>({
      query: (queryArg) => ({
        url: `/simple/price`,
        params: {
          ids: queryArg.ids,
          vs_currencies: queryArg.vsCurrencies,
          include_market_cap: queryArg.includeMarketCap,
          include_24hr_vol: queryArg.include24HrVol,
          include_24hr_change: queryArg.include24HrChange,
          include_last_updated_at: queryArg.includeLastUpdatedAt,
        },
      }),
    }),
    getSimpleSupportedVsCurrencies: build.query<
      GetSimpleSupportedVsCurrenciesApiResponse,
      GetSimpleSupportedVsCurrenciesApiArg
    >({
      query: () => ({ url: `/simple/supported_vs_currencies` }),
    }),
    getSimpleTokenPriceById: build.query<
      GetSimpleTokenPriceByIdApiResponse,
      GetSimpleTokenPriceByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/simple/token_price/${queryArg.id}`,
        params: {
          contract_addresses: queryArg.contractAddresses,
          vs_currencies: queryArg.vsCurrencies,
          include_market_cap: queryArg.includeMarketCap,
          include_24hr_vol: queryArg.include24HrVol,
          include_24hr_change: queryArg.include24HrChange,
          include_last_updated_at: queryArg.includeLastUpdatedAt,
        },
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as generatedApi }
export type GetAssetPlatformsApiResponse = unknown
export type GetAssetPlatformsApiArg = void
export type GetCoinsCategoriesApiResponse = unknown
export type GetCoinsCategoriesApiArg = {
  /** valid values: <b>market_cap_desc (default), market_cap_asc, name_desc, name_asc, market_cap_change_24h_desc and market_cap_change_24h_asc</b> */
  order?: string
}
export type GetCoinsCategoriesListApiResponse = unknown
export type GetCoinsCategoriesListApiArg = void
export type GetCoinsListApiResponse = unknown
export type GetCoinsListApiArg = {
  /** flag to include platform contract addresses (eg. 0x.... for Ethereum based tokens).
     valid values: true, false */
  includePlatform?: boolean
}
export type GetCoinsMarketsApiResponse = unknown
export type GetCoinsMarketsApiArg = {
  /** The target currency of market data (usd, eur, jpy, etc.) */
  vsCurrency: string
  /** The ids of the coin, comma separated crytocurrency symbols (base). refers to `/coins/list`.
    <b>When left empty, returns numbers the coins observing the params `limit` and `start`</b> */
  ids?: string
  /** filter by coin category. Refer to /coin/categories/list */
  category?: string
  /** valid values: <b>market_cap_desc, gecko_desc, gecko_asc, market_cap_asc, market_cap_desc, volume_asc, volume_desc, id_asc, id_desc</b>
    sort results by field. */
  order?: string
  /** valid values: 1..250
     Total results per page */
  perPage?: number
  /** Page through results */
  page?: number
  /** Include sparkline 7 days data (eg. true, false) */
  sparkline?: boolean
  /** Include price change percentage in <b>1h, 24h, 7d, 14d, 30d, 200d, 1y</b> (eg. '`1h,24h,7d`' comma-separated, invalid values will be discarded) */
  priceChangePercentage?: string
}
export type GetCoinsByIdApiResponse = unknown
export type GetCoinsByIdApiArg = {
  /** pass the coin id (can be obtained from /coins) eg. bitcoin */
  id: string
  /** Include all localized languages in response (true/false) <b>[default: true]</b> */
  localization?: string
  /** Include tickers data (true/false) <b>[default: true]</b> */
  tickers?: boolean
  /** Include market_data (true/false) <b>[default: true]</b> */
  marketData?: boolean
  /** Include community_data data (true/false) <b>[default: true]</b> */
  communityData?: boolean
  /** Include developer_data data (true/false) <b>[default: true]</b> */
  developerData?: boolean
  /** Include sparkline 7 days data (eg. true, false) <b>[default: false]</b> */
  sparkline?: boolean
}
export type GetCoinsByIdContractAndContractAddressApiResponse = unknown
export type GetCoinsByIdContractAndContractAddressApiArg = {
  /** Asset platform (See asset_platforms endpoint for list of options) */
  id: string
  /** Token's contract address */
  contractAddress: string
}
export type GetCoinsByIdContractAndContractAddressMarketChartApiResponse = unknown
export type GetCoinsByIdContractAndContractAddressMarketChartApiArg = {
  /** The id of the platform issuing tokens (See asset_platforms endpoint for list of options) */
  id: string
  /** Token's contract address */
  contractAddress: string
  /** The target currency of market data (usd, eur, jpy, etc.) */
  vsCurrency: string
  /** Data up to number of days ago (eg. 1,14,30,max) */
  days: string
}
export type GetCoinsByIdContractAndContractAddressMarketChartRangeApiResponse = unknown
export type GetCoinsByIdContractAndContractAddressMarketChartRangeApiArg = {
  /** The id of the platform issuing tokens (See asset_platforms endpoint for list of options) */
  id: string
  /** Token's contract address */
  contractAddress: string
  /** The target currency of market data (usd, eur, jpy, etc.) */
  vsCurrency: string
  /** From date in UNIX Timestamp (eg. 1392577232) */
  from: string
  /** To date in UNIX Timestamp (eg. 1422577232) */
  to: string
}
export type GetCoinsByIdHistoryApiResponse = unknown
export type GetCoinsByIdHistoryApiArg = {
  /** pass the coin id (can be obtained from /coins) eg. bitcoin */
  id: string
  /** The date of data snapshot in dd-mm-yyyy eg. 30-12-2017 */
  date: string
  /** Set to false to exclude localized languages in response */
  localization?: string
}
export type GetCoinsByIdMarketChartApiResponse = unknown
export type GetCoinsByIdMarketChartApiArg = {
  /** pass the coin id (can be obtained from /coins) eg. bitcoin */
  id: string
  /** The target currency of market data (usd, eur, jpy, etc.) */
  vsCurrency: string
  /** Data up to number of days ago (eg. 1,14,30,max) */
  days: string
  /** Data interval. Possible value: daily */
  interval?: string
}
export type GetCoinsByIdMarketChartRangeApiResponse = unknown
export type GetCoinsByIdMarketChartRangeApiArg = {
  /** pass the coin id (can be obtained from /coins) eg. bitcoin */
  id: string
  /** The target currency of market data (usd, eur, jpy, etc.) */
  vsCurrency: string
  /** From date in UNIX Timestamp (eg. 1392577232) */
  from: string
  /** To date in UNIX Timestamp (eg. 1422577232) */
  to: string
}
export type GetCoinsByIdOhlcApiResponse = /** status 200 successful operation

[
1594382400000 (time),
1.1 (open),
 2.2 (high),
 3.3 (low),
 4.4 (close)
] */ number[]
export type GetCoinsByIdOhlcApiArg = {
  /** pass the coin id (can be obtained from /coins/list) eg. bitcoin */
  id: string
  /** The target currency of market data (usd, eur, jpy, etc.) */
  vsCurrency: string
  /**  Data up to number of days ago (1/7/14/30/90/180/365/max) */
  days: string
}
export type GetCoinsByIdTickersApiResponse = unknown
export type GetCoinsByIdTickersApiArg = {
  /** pass the coin id (can be obtained from /coins/list) eg. bitcoin */
  id: string
  /** filter results by exchange_ids (ref: v3/exchanges/list) */
  exchangeIds?: string
  /** flag to show exchange_logo */
  includeExchangeLogo?: string
  /** Page through results */
  page?: number
  /** valid values: <b>trust_score_desc (default), trust_score_asc and volume_desc</b> */
  order?: string
  /** flag to show 2% orderbook depth. valid values: true, false */
  depth?: string
}
export type GetDerivativesApiResponse = unknown
export type GetDerivativesApiArg = {
  /** ['all', 'unexpired'] - expired to show unexpired tickers, all to list all tickers, defaults to unexpired */
  includeTickers?: string
}
export type GetDerivativesExchangesApiResponse = unknown
export type GetDerivativesExchangesApiArg = {
  /** order results using following params name_asc，name_desc，open_interest_btc_asc，open_interest_btc_desc，trade_volume_24h_btc_asc，trade_volume_24h_btc_desc */
  order?: string
  /** Total results per page */
  perPage?: number
  /** Page through results */
  page?: number
}
export type GetDerivativesExchangesListApiResponse = unknown
export type GetDerivativesExchangesListApiArg = void
export type GetDerivativesExchangesByIdApiResponse = unknown
export type GetDerivativesExchangesByIdApiArg = {
  /** pass the exchange id (can be obtained from derivatives/exchanges/list) eg. bitmex */
  id: string
  /** ['all', 'unexpired'] - expired to show unexpired tickers, all to list all tickers, leave blank to omit tickers data in response */
  includeTickers?: string
}
export type GetExchangeRatesApiResponse = unknown
export type GetExchangeRatesApiArg = void
export type GetExchangesApiResponse = unknown
export type GetExchangesApiArg = {
  /** Valid values: 1...250
    Total results per page
    Default value:: 100 */
  perPage?: number
  /** page through results */
  page?: string
}
export type GetExchangesListApiResponse = unknown
export type GetExchangesListApiArg = void
export type GetExchangesByIdApiResponse = unknown
export type GetExchangesByIdApiArg = {
  /** pass the exchange id (can be obtained from /exchanges/list) eg. binance */
  id: string
}
export type GetExchangesByIdTickersApiResponse = unknown
export type GetExchangesByIdTickersApiArg = {
  /** pass the exchange id (can be obtained from /exchanges/list) eg. binance */
  id: string
  /** filter tickers by coin_ids (ref: v3/coins/list) */
  coinIds?: string
  /** flag to show exchange_logo */
  includeExchangeLogo?: string
  /** Page through results */
  page?: number
  /** flag to show 2% orderbook depth i.e., cost_to_move_up_usd and cost_to_move_down_usd */
  depth?: string
  /** valid values: <b>trust_score_desc (default), trust_score_asc and volume_desc</b> */
  order?: string
}
export type GetExchangesByIdVolumeChartApiResponse = unknown
export type GetExchangesByIdVolumeChartApiArg = {
  /** pass the exchange id (can be obtained from /exchanges/list) eg. binance */
  id: string
  /**  Data up to number of days ago (eg. 1,14,30) */
  days: number
}
export type GetGlobalApiResponse = unknown
export type GetGlobalApiArg = void
export type GetGlobalDecentralizedFinanceDefiApiResponse = unknown
export type GetGlobalDecentralizedFinanceDefiApiArg = void
export type GetIndexesApiResponse = unknown
export type GetIndexesApiArg = {
  /** Total results per page */
  perPage?: number
  /** Page through results */
  page?: number
}
export type GetIndexesListApiResponse = unknown
export type GetIndexesListApiArg = void
export type GetIndexesByMarketIdAndIdApiResponse = unknown
export type GetIndexesByMarketIdAndIdApiArg = {
  /** pass the market id (can be obtained from /exchanges/list) */
  marketId: string
  /** pass the index id (can be obtained from /indexes/list) */
  id: string
}
export type GetPingApiResponse = unknown
export type GetPingApiArg = void
export type GetSearchApiResponse =
  /** status 200 List of coins, categories and markets matching search term ordered by market cap */ {
    categories?: {
      item?: {
        id?: number
        name?: string
      }
    }
    coins?: {
      item?: {
        id?: string
        market_cap_rank?: number
        name?: string
        symbol?: string
      }
    }
    exchanges?: {
      item?: {
        id?: string
        market_type?: string
        name?: string
      }
    }
  }
export type GetSearchApiArg = {
  /** Search string */
  query: string
}
export type GetSearchTrendingApiResponse = unknown
export type GetSearchTrendingApiArg = void
export type GetSimplePriceApiResponse = unknown
export type GetSimplePriceApiArg = {
  /** id of coins, comma-separated if querying more than 1 coin
   *refers to <b>`coins/list`</b> */
  ids: string
  /** vs_currency of coins, comma-separated if querying more than 1 vs_currency
   *refers to <b>`simple/supported_vs_currencies`</b> */
  vsCurrencies: string
  /** <b>true/false</b> to include market_cap, <b>default: false</b> */
  includeMarketCap?: string
  /** <b>true/false</b> to include 24hr_vol, <b>default: false</b> */
  include24HrVol?: string
  /** <b>true/false</b> to include 24hr_change, <b>default: false</b> */
  include24HrChange?: string
  /** <b>true/false</b> to include last_updated_at of price, <b>default: false</b> */
  includeLastUpdatedAt?: string
}
export type GetSimpleSupportedVsCurrenciesApiResponse = unknown
export type GetSimpleSupportedVsCurrenciesApiArg = void
export type GetSimpleTokenPriceByIdApiResponse = unknown
export type GetSimpleTokenPriceByIdApiArg = {
  /** The id of the platform issuing tokens (See asset_platforms endpoint for list of options) */
  id: string
  /** The contract address of tokens, comma separated */
  contractAddresses: string
  /** vs_currency of coins, comma-separated if querying more than 1 vs_currency
   *refers to <b>`simple/supported_vs_currencies`</b> */
  vsCurrencies: string
  /** <b>true/false</b> to include market_cap, <b>default: false</b> */
  includeMarketCap?: string
  /** <b>true/false</b> to include 24hr_vol, <b>default: false</b> */
  include24HrVol?: string
  /** <b>true/false</b> to include 24hr_change, <b>default: false</b> */
  include24HrChange?: string
  /** <b>true/false</b> to include last_updated_at of price, <b>default: false</b> */
  includeLastUpdatedAt?: string
}
export const {
  useGetAssetPlatformsQuery,
  useGetCoinsCategoriesQuery,
  useGetCoinsCategoriesListQuery,
  useGetCoinsListQuery,
  useGetCoinsMarketsQuery,
  useGetCoinsByIdQuery,
  useGetCoinsByIdContractAndContractAddressQuery,
  useGetCoinsByIdContractAndContractAddressMarketChartQuery,
  useGetCoinsByIdContractAndContractAddressMarketChartRangeQuery,
  useGetCoinsByIdHistoryQuery,
  useGetCoinsByIdMarketChartQuery,
  useGetCoinsByIdMarketChartRangeQuery,
  useGetCoinsByIdOhlcQuery,
  useGetCoinsByIdTickersQuery,
  useGetDerivativesQuery,
  useGetDerivativesExchangesQuery,
  useGetDerivativesExchangesListQuery,
  useGetDerivativesExchangesByIdQuery,
  useGetExchangeRatesQuery,
  useGetExchangesQuery,
  useGetExchangesListQuery,
  useGetExchangesByIdQuery,
  useGetExchangesByIdTickersQuery,
  useGetExchangesByIdVolumeChartQuery,
  useGetGlobalQuery,
  useGetGlobalDecentralizedFinanceDefiQuery,
  useGetIndexesQuery,
  useGetIndexesListQuery,
  useGetIndexesByMarketIdAndIdQuery,
  useGetPingQuery,
  useGetSearchQuery,
  useGetSearchTrendingQuery,
  useGetSimplePriceQuery,
  useGetSimpleSupportedVsCurrenciesQuery,
  useGetSimpleTokenPriceByIdQuery,
} = injectedRtkApi
