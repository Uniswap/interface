import { useEffect, useMemo, useRef } from 'react'
import { PoolResponse, useLazyCandelsticksQuery } from 'services/geckoTermial'

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
  supported_resolutions: ['1', '5', '15', '1H', '2H', '4H', '1D'],
}

export const useDatafeed = (poolDetail: PoolResponse, tokenId: string) => {
  const [getCandles, { isLoading }] = useLazyCandelsticksQuery()

  const intervalRef = useRef<any>()

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const base =
    poolDetail.included[0].id === tokenId
      ? poolDetail.included[0].attributes.symbol
      : poolDetail.included[1].attributes.symbol
  const quote =
    poolDetail.included[0].id !== tokenId
      ? poolDetail.included[0].attributes.symbol
      : poolDetail.included[1].attributes.symbol

  const label = `${base}/${quote}`

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
            has_empty_bars: true,
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

        const data = await getCandles({
          token_id: tokenId,
          pool_id: poolDetail.data.id,
          from: periodParams.from,
          to: periodParams.to,
          resolution,
          count_back: periodParams.countBack,
          for_update: false,
          currency: 'token',
        })

        onHistoryCallback(
          data?.data?.data.map((item: any) => ({
            time: new Date(item.dt).getTime(),
            open: item.o,
            high: Math.min(item.h, item.c * 1.1),
            close: item.c,
            low: Math.max(item.l, item.c / 1.1),
            volume: item.v,
          })) || [],
          {
            noData: data?.data?.meta?.noData === true,
          },
        )
      },
      searchSymbols: () => {
        // TODO(viet-nv): check no empty function rule
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
            token_id: tokenId,
            pool_id: poolDetail.data.id,
            from: Math.floor(Date.now() / 1000) - +resolution * 60,
            to: Math.floor(Date.now() / 1000),
            resolution,
            for_update: true,
            currency: 'token',
          })

          onTick(
            (data?.data?.data || []).map((item: any) => ({
              time: new Date(item.dt).getTime(),
              open: item.o,
              high: item.h,
              close: item.c,
              low: item.l,
              volume: item.v,
            }))[0],
          )
        }
        if (intervalRef.current) clearInterval(intervalRef.current)
        intervalRef.current = setInterval(getData, 30000)
        getData()
      },
      unsubscribeBars: () => {
        //
      },
    }
  }, [getCandles, isLoading, poolDetail.data.id, label, tokenId])
}
