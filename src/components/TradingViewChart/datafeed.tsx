import { LiveDataTimeframeEnum } from 'hooks/useLiveChartData'
import {
  ResolveCallback,
  ErrorCallback,
  LibrarySymbolInfo,
  ResolutionString,
  PeriodParams,
  HistoryCallback,
} from './charting_library'

const getResolutionTimeTicks = (resolution: ResolutionString) => {
  switch (resolution) {
    case '1':
      return 60000
    case '5':
      return 300000
    case '15':
      return 900000
    case '60':
      return 3600000
    case '240':
      return 14400000
    default:
      return 300000
  }
}

const getLatestBarTimestamp = (resolution: ResolutionString) => {
  const nowTimestamp = new Date().getTime() 
  return nowTimestamp - (nowTimestamp % getResolutionTimeTicks(resolution))
}
export const getTimeframeMilliseconds = (timeFrame: LiveDataTimeframeEnum) => {
  switch (timeFrame) {
    case LiveDataTimeframeEnum.HOUR: 
      return 3600000
    case LiveDataTimeframeEnum.FOUR_HOURS: 
      return 14400000
    case LiveDataTimeframeEnum.DAY: 
      return 86400000
    case LiveDataTimeframeEnum.WEEK: 
      return 604800000
    case LiveDataTimeframeEnum.MONTH: 
      return 2592000000
    case LiveDataTimeframeEnum.SIX_MONTHS: 
      return 15552000000
  }
}

const configurationData = {
  supported_resolutions: ['15', '1H', '4H'],
  exchanges: [
    {
      value: 'Bitfinex',
      name: 'Bitfinex',
      desc: 'Bitfinex',
    },
    {
      // `exchange` argument for the `searchSymbols` method, if a user selects this exchange
      value: 'Kraken',

      // filter name
      name: 'Kraken',

      // full exchange name displayed in the filter popup
      desc: 'Kraken bitcoin exchange',
    },
  ],
  symbols_types: [
    {
      name: 'crypto',

      // `symbolType` argument for the `searchSymbols` method, if a user selects this symbol type
      value: 'crypto',
    },
    // ...
  ],
}

export const useDatafeed = (data: any, timeframe: LiveDataTimeframeEnum) => {
  return {
    onReady: (callback: any) => {
      setTimeout(() => callback(configurationData))
    },
    resolveSymbol: (
      symbolName: string,
      onSymbolResolvedCallback: ResolveCallback,
      onResolveErrorCallback: ErrorCallback,
    ) => {
      const symbolInfo: LibrarySymbolInfo = {
        ticker: 'TEST',
        name: 'TEST',
        full_name: 'Full name',
        listed_exchange: 'listed exchange',
        format: 'price',
        description: 'Test description',
        type: 'crypto',
        session: '24x7',
        timezone: 'Etc/UTC',
        exchange: 'TEST EXCHANGE',
        minmov: 1,
        pricescale: 100,
        has_intraday: true,
        has_no_volume: true,
        has_empty_bars: true,
        has_weekly_and_monthly: true,
        supported_resolutions: configurationData.supported_resolutions as ResolutionString[],
        volume_precision: 2,
        data_status: 'streaming',
      }
      console.log('[resolveSymbol]: Symbol resolved')
      onSymbolResolvedCallback(symbolInfo)
    },
    getBars: async (
      symbolInfo: LibrarySymbolInfo,
      resolution: ResolutionString,
      periodParams: PeriodParams,
      onHistoryCallback: HistoryCallback,
      onErrorCallback: ErrorCallback,
    ) => {
      console.log('🚀 ~ file: datafeed.js ~ line 57 ~ getBars: ~ periodParams', periodParams)
      console.log('🚀 ~ file: datafeed.js ~ line 57 ~ getBars: ~ symbolInfo', symbolInfo)
      console.log('🚀 ~ file: datafeed.js ~ line 57 ~ getBars: ~ resolution', resolution)
      console.log(data)
      try {
        const timeframeMilliseconds = getTimeframeMilliseconds(timeframe)
        const { countBack, from, to } = periodParams
        console.log("🚀 ~ file: datafeed.tsx ~ line 111 ~ useDatafeed ~ to", to)
        if (to < (new Date().getTime() - timeframeMilliseconds) /1000) {
          onHistoryCallback([], { noData: true })
          return
        }
        const resolutionTicks = getResolutionTimeTicks(resolution)
        const latestBarTimestamp = getLatestBarTimestamp(resolution)
        const firstBarTimestamp = latestBarTimestamp - timeframeMilliseconds
        let currentBarTimestamp = firstBarTimestamp
        let bars: any[] = []
        let bar: any = {time:firstBarTimestamp}
      
        data.forEach((item: any) => {
          let newValue = parseFloat(item.value)
          if (!bar.open) {
            bar.open = newValue
            bar.high = newValue
            bar.low = newValue
          } else {
            if (!bar.high || bar.high < newValue) {
              bar.high = newValue
            }
            if (!bar.low || bar.low > newValue) {
              bar.low = newValue
            }
          }
          if (currentBarTimestamp + resolutionTicks < item.time) {
            bar.close = newValue
            bars = [...bars, bar]
            bar = {};
            currentBarTimestamp += resolutionTicks
            bar.time = currentBarTimestamp
            bar.open = newValue
          } 
        })
        console.log(bars)

        // bars = data.map((item: { time: number, value: string }, index: number) => {
        //   const open = parseFloat(item.value);
        //   const close = parseFloat(data[index + 1]?.value || item.value);
        //   return {time:item.time, open:open, close: close, high: Math.max(open,close), low: Math.min(open,close) }
        // })
        onHistoryCallback(bars, { noData: false })
      } catch (error) {
        console.log('[getBars]: Get error', error)
        onErrorCallback(error as string)
      }
    },
    searchSymbols: () => {},
    subscribeBars: () => {},
    unsubscribeBars: () => {},
  }
}
