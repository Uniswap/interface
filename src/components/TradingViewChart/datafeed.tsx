import { useEffect, useMemo, useRef } from 'react'
import { PoolResponse, transformData, useLazyOhlcvQuery } from 'services/geckoTermial'

import { useActiveWeb3React } from 'hooks'

import {
  ErrorCallback,
  HistoryCallback,
  LibrarySymbolInfo,
  PeriodParams,
  ResolutionString,
  ResolveCallback,
  SubscribeBarsCallback,
  Timezone,
} from './charting_library'

const configurationData = {
  supported_resolutions: ['1', '5', '15', '1H', '4H', '12H', '1D'],
}

export const useDatafeed = (poolDetail: PoolResponse, isReverse: boolean, label: string) => {
  const { networkInfo } = useActiveWeb3React()
  const [getCandles, { isLoading }] = useLazyOhlcvQuery()

  const intervalRef = useRef<any>()

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return useMemo(() => {
    return {
      onReady: (callback: any) => {
        setTimeout(() => callback(configurationData))
      },
      resolveSymbol: async (
        _symbolName: string,
        onSymbolResolvedCallback: ResolveCallback,
        _onResolveErrorCallback: ErrorCallback,
      ) => {
        try {
          const symbolInfo: LibrarySymbolInfo = {
            ticker: label,
            name: label,
            full_name: label,
            listed_exchange: '',
            format: 'price',
            description: label,
            type: 'crypto',
            session: '24x7',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone as Timezone,
            exchange: '',
            minmov: 1,
            pricescale: 10000,
            has_intraday: true,
            // has_empty_bars: true,
            has_weekly_and_monthly: true,
            has_daily: true,
            supported_resolutions: configurationData.supported_resolutions as ResolutionString[],
            data_status: 'streaming',
          }
          onSymbolResolvedCallback(symbolInfo)
        } catch (error) {
          console.log(error)
        }
      },
      getBars: async (
        // symbolInfo is not used
        _symbolInfo: LibrarySymbolInfo,
        resolution: ResolutionString,
        periodParams: PeriodParams,
        onHistoryCallback: HistoryCallback,
        _onErrorCallback: ErrorCallback,
      ) => {
        if (isLoading) return

        const { from, to, countBack } = periodParams

        const timeframe = resolution === '1D' ? 'day' : Number(resolution) > 15 ? 'hour' : 'minute'
        const timePeriod = resolution === '1D' ? '1' : Number(resolution) > 15 ? Number(resolution) / 60 : resolution

        const secondsPerCandle = (to - from) / countBack

        const promises = []
        const n = Math.ceil(countBack / 1000)
        for (let i = 0; i < n; i++) {
          promises.push(
            getCandles({
              network: networkInfo.geckoTermialId || '',
              poolAddress: poolDetail.attributes.address,
              timeframe,
              timePeriod,
              token: isReverse ? 'quote' : 'base',
              before_timestamp: Math.floor(to - i * 1000 * secondsPerCandle),
              limit: countBack > 1000 ? (i === n - 1 ? countBack % 1000 : 1000) : countBack,
            }),
          )
        }

        const res = await Promise.all(promises)

        if (res.some(data => data.error || !Array.isArray(data.data?.data?.attributes?.ohlcv_list))) {
          onHistoryCallback([], { noData: true })
          return
        }

        const bars = transformData(res.map(item => item.data?.data.attributes.ohlcv_list).flat() as any)

        onHistoryCallback(bars, { noData: res.some(data => !data?.data?.data?.attributes.ohlcv_list.length) })
      },
      searchSymbols: () => {
        //
      },
      subscribeBars: async (
        _symbolInfo: LibrarySymbolInfo,
        resolution: ResolutionString,
        onTick: SubscribeBarsCallback,
        _listenerGuid: string,
        _onResetCacheNeededCallback: () => void,
      ) => {
        const getData = async () => {
          const data = await getCandles({
            network: networkInfo.geckoTermialId || '',
            poolAddress: poolDetail.attributes.address,
            timeframe: resolution === '1D' ? 'day' : Number(resolution) > 15 ? 'hour' : 'minute',
            timePeriod: resolution === '1D' ? '1' : Number(resolution) > 15 ? Number(resolution) / 60 : resolution,
            before_timestamp: Math.floor(Date.now() / 1000),
            limit: 1,
            token: isReverse ? 'quote' : 'base',
          })
          if (data.data?.data?.attributes?.ohlcv_list?.length)
            onTick(transformData(data.data.data.attributes.ohlcv_list)[0])
        }
        if (intervalRef.current) clearInterval(intervalRef.current)
        intervalRef.current = setInterval(getData, 30000)
        getData()
      },
      unsubscribeBars: () => {
        //
      },
    }
  }, [getCandles, isLoading, label, isReverse, networkInfo.geckoTermialId, poolDetail.attributes.address])
}
