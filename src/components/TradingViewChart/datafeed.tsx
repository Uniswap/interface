import { LiveDataTimeframeEnum } from 'hooks/useLiveChartData'
import {
  ResolveCallback,
  ErrorCallback,
  LibrarySymbolInfo,
  ResolutionString,
  PeriodParams,
  HistoryCallback,
} from './charting_library'
import { useState, useEffect, useRef } from 'react'
import { useActiveWeb3React } from 'hooks'
import { ChainId, Currency, Token } from '@dynamic-amm/sdk'
import { nativeNameFromETH } from 'hooks/useMixpanel'
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
  supported_resolutions: ['5', '15', '1H', '4H'],
}

const getNetworkString = (chainId: ChainId | undefined) => {
  switch (chainId) {
    case ChainId.MAINNET:
      return 'chain-ethereum'
    case ChainId.BSCMAINNET:
      return 'chain-bsc'
    case ChainId.MATIC:
      return 'chain-polygon'
    case ChainId.CRONOS:
      return 'chain-cronos'
    case ChainId.AVAXMAINNET:
      return 'chain-avalanche'
    case ChainId.FANTOM:
      return 'chain-fantom'
    case ChainId.ARBITRUM:
      return 'chain-arbitrum'
    case ChainId.VELAS:
      return 'chain-velas'
    case ChainId.AURORA:
      return 'chain-aurora'
    case ChainId.OASIS:
      return 'chain-oasis'
    default:
      return ''
  }
}

const getResolutionString = (res: string) => {
  switch (res) {
    case '15':
      return '15m'
    default:
      return '15m'
  }
}

const DEXTOOLS_API = 'https://pancake-subgraph-proxy.kyberswap.com/dextools'
const monthTs = 2592000000
const weekTs = 604800000

export const searchTokenPair = (address: string, chainId: ChainId | undefined) => {
  return fetch(`${DEXTOOLS_API}/${getNetworkString(chainId)}/api/pair/search?s=${address}`)
    .then(res => res.json())
    .catch(error => console.log(error))
}
export const getHistoryCandleStatus = (address: string, chainId: ChainId | undefined) => {
  return fetch(`${DEXTOOLS_API}/${getNetworkString(chainId)}/api/Uniswap/1/history-candle-status?pair=${address}`)
    .then(res => res.json())
    .catch(error => console.log(error))
}

export const useDatafeed = (currencies: any, pairAddress: string, apiVersion: string) => {
  const { chainId } = useActiveWeb3React()
  const [data, setData] = useState<any[]>([])
  const [oldestTs, setOldestTs] = useState(0)
  const stateRef = useRef<any>({ data, oldestTs })
  const fetchingRef = useRef<boolean>(false)
  const isReverse = currencies[0] === Currency.ETHER

  useEffect(() => {
    stateRef.current = { data, oldestTs }
  }, [data, oldestTs])

  const getCandles = async (ts: number, res: string, span: string = 'month') => {
    const resStr = getResolutionString(res)
    const response = await fetch(
      `${DEXTOOLS_API}/${getNetworkString(
        chainId,
      )}/api/Pancakeswap/history/candles?sym=eth&span=${span}&pair=${pairAddress}&ts=${ts}&v=${apiVersion}${resStr &&
        '&res=' + resStr}`,
    )
      .then(res => res.json())
      .catch(error => console.log(error))
    return response?.data
  }
  return {
    onReady: (callback: any) => {
      setTimeout(() => callback(configurationData))
    },
    resolveSymbol: async (
      symbolName: string,
      onSymbolResolvedCallback: ResolveCallback,
      onResolveErrorCallback: ErrorCallback,
    ) => {
      try {
        const token = isReverse ? currencies[1] : currencies[0]
        const ethSymbol = nativeNameFromETH(chainId)
        const label = isReverse ? `${ethSymbol}/${token?.symbol}` : `${token?.symbol}/${ethSymbol}`

        const ts = Math.floor(new Date().getTime() / weekTs) * weekTs
        const { candles } = await getCandles(ts, '15', 'week')

        const symbolInfo: LibrarySymbolInfo = {
          ticker: label,
          name: label,
          full_name: label,
          listed_exchange: '',
          format: 'price',
          description: label,
          type: 'crypto',
          session: '24x7',
          timezone: 'Etc/UTC',
          exchange: '',
          minmov: 1,
          pricescale: Math.pow(10, Math.ceil(Math.log10(isReverse ? candles[0].open : 1 / candles[0].open)) + 5),
          has_intraday: true,
          //has_empty_bars: true,
          has_weekly_and_monthly: true,
          supported_resolutions: configurationData.supported_resolutions as ResolutionString[],
          data_status: 'streaming',
        }
        onSymbolResolvedCallback(symbolInfo)
      } catch (error) {
        console.log(error)
      }
    },
    getBars: async (
      symbolInfo: LibrarySymbolInfo,
      resolution: ResolutionString,
      periodParams: PeriodParams,
      onHistoryCallback: HistoryCallback,
      onErrorCallback: ErrorCallback,
    ) => {
      if (fetchingRef.current) return
      try {
        let from = periodParams.from * 1000
        let to = periodParams.to * 1000
        let noData = false
        let candlesTemp = stateRef.current.data
        if (!candlesTemp || candlesTemp.length === 0) {
          const ts = Math.floor(new Date().getTime() / monthTs) * monthTs
          const { candles, oldestTs } = await getCandles(ts, resolution)
          candlesTemp = candles
          setOldestTs(parseFloat(oldestTs))
          setData(candlesTemp)
        } else {
          const minTime = candlesTemp[0].time
          if (minTime > from) {
            const lastTimePoint = Math.floor(minTime / monthTs)
            const fromTimePoint = Math.floor(from / monthTs)
            fetchingRef.current = true
            for (let i = lastTimePoint; i >= fromTimePoint; i--) {
              const ts = i * monthTs
              const { candles } = await getCandles(ts, resolution)
              candlesTemp = [...candles, ...candlesTemp].sort((a, b) => a.time - b.time)
              if (ts < stateRef.current.oldestTs) {
                noData = true
                break
              }
            }
            setData(candlesTemp)
            fetchingRef.current = false
          }
        }
        let formatedCandles = candlesTemp
          .filter((c: any) => c.time > from && c.time < to)
          .map((c: any, i: number, arr: any[]) => {
            if (arr[i + 1] && c.close !== arr[i + 1].open) {
              c.close = arr[i + 1].open
              if (c.close > c.high) {
                c.high = c.close
              }
              if (c.close < c.low) {
                c.low = c.close
              }
            }
            return c
          })

        if (isReverse) {
          formatedCandles = formatedCandles.map((c: any) => {
            return { ...c, open: 1 / c.open, close: 1 / c.close, high: 1 / c.low, low: 1 / c.high }
          })
        }

        onHistoryCallback(formatedCandles, { noData: noData })
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
