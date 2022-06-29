import {
  ResolveCallback,
  ErrorCallback,
  LibrarySymbolInfo,
  ResolutionString,
  PeriodParams,
  HistoryCallback,
  Timezone,
  SubscribeBarsCallback,
} from './charting_library'
import { useState, useEffect, useRef } from 'react'
import { useActiveWeb3React } from 'hooks'
import { ChainId, Currency, Token } from '@kyberswap/ks-sdk-core'
import { USDC, USDT, DAI } from 'constants/index'
import { Field } from 'state/swap/actions'
import { Bar } from './charting_library'
import { NETWORKS_INFO } from 'constants/networks'
const configurationData = {
  supported_resolutions: ['1', '3', '5', '15', '30', '1H', '2H', '4H', '1D', '1W', '1M'],
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
    case ChainId.OPTIMISM:
      return 'chain-optimism'
    default:
      return ''
  }
}

const DEXTOOLS_API = 'https://pancake-subgraph-proxy.kyberswap.com/dextools'
const monthTs = 2592000000
const weekTs = 604800000
const dayTs = 86400000
const TOKEN_PAIRS_ADDRESS_MAPPING: {
  [key: string]: string
} = {
  '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9': '0xd75ea151a61d06868e31f8988d28dfe5e9df57b4',
  '0x6b175474e89094c44da98b954eedeac495271d0f': '0x74c99f3f5331676f6aec2756e1f39b4fc029a83e',
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': '0x74c99f3f5331676f6aec2756e1f39b4fc029a83e',
  '0x1c954e8fe737f99f68fa1ccda3e51ebdb291948c': 'nodata',
  '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063': '0xa374094527e1673a86de625aa59517c5de346d32',
  '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3': '0xd99c7f6c65857ac913a8f880a4cb84032ab2fc5b',
  '0xd586e7f844cea2f87f50152665bcbc2c279d8d70': '0xa389f9430876455c36478deea9769b7ca4e3ddb1',
  '0xc7198437980c041c805a1edcba50c1ce5db95118': '0xa389f9430876455c36478deea9769b7ca4e3ddb1',
  '0x19860ccb0a68fd4213ab9d8266f7bbf05a8dde98': '0xa389f9430876455c36478deea9769b7ca4e3ddb1',
  '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e': '0xadc8ad9d3d62b1af72e5ce0ec767465f313513dd',
  '0x049d68029688eabf473097a2fc38ef61633a3c7a': '0xadc8ad9d3d62b1af72e5ce0ec767465f313513dd',
  '0x41e3df7f716ab5af28c1497b354d79342923196a': '0xadc8ad9d3d62b1af72e5ce0ec767465f313513dd',
  '0xf2001b145b43032aaf5ee2884e456ccd805f677d': '0xa68466208f1a3eb21650320d2520ee8eba5ba623',
  '0x66e428c3f67a68878562e79a0234c1f83c208770': '0xa68466208f1a3eb21650320d2520ee8eba5ba623',
  '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1': '0xc31e54c7a869b9fcbecc14363cf510d1c41fa443',
  '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9': '0xc31e54c7a869b9fcbecc14363cf510d1c41fa443',
  '0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab': '0x0f0fc5a5029e3d155708356b422d22cc29f8b3d4',
  '0xd501281565bf7789224523144fe5d98e8b28f267': '0x64ed9711667c9e8923bee32260a55a9b8dbc99d3',
  '0x63a72806098Bd3D9520cC43356dD78afe5D386D9': '0x5944f135e4f1e3fa2e5550d4b5170783868cc4fe',
}
const LOCALSTORAGE_CHECKED_PAIRS = 'proChartCheckedPairs'

const fetcherDextools = (url: string) => {
  return fetch(`${DEXTOOLS_API}/${url}`)
    .then(res => res.json())
    .catch(error => console.log(error))
}

export const searchTokenPair = (address: string, chainId: ChainId | undefined) => {
  if (TOKEN_PAIRS_ADDRESS_MAPPING[address.toLowerCase()]) {
    return new Promise((resolve, reject) => {
      resolve([{ id: TOKEN_PAIRS_ADDRESS_MAPPING[address.toLowerCase()] }])
    })
  }
  return fetcherDextools(`${getNetworkString(chainId)}/api/pair/search?s=${address}`)
}
export const getHistoryCandleStatus = (pairAddress: string, chainId: ChainId | undefined) => {
  return fetcherDextools(`${getNetworkString(chainId)}/api/Uniswap/1/history-candle-status?pair=${pairAddress}`)
}
export const getCandlesApi = (
  chainId: ChainId | undefined,
  pairAddress: string,
  apiVersion: string,
  ts: number,
  span = 'month',
  res = '15m',
  sym = 'eth',
) => {
  return fetcherDextools(
    `${getNetworkString(
      chainId,
    )}/api/Pancakeswap/history/candles?sym=${sym}&span=${span}&pair=${pairAddress}&ts=${ts}&v=${apiVersion}${res &&
      '&res=' + res}`,
  )
}
const checkIsUSDToken = (chainId: ChainId | undefined, currency: Currency | undefined) => {
  if (currency?.isNative || !chainId) {
    return false
  }
  const usdTokenAddresses = [
    USDT[chainId].address.toLowerCase(),
    USDC[chainId].address.toLowerCase(),
    DAI[chainId].address.toLowerCase(),
    '0xe9e7cea3dedca5984780bafc599bd69add087d56', //BUSD
    '0xcd7509b76281223f5b7d3ad5d47f8d7aa5c2b9bf', //USDV Velas
    '0xdb28719f7f938507dbfe4f0eae55668903d34a15', //USDT_t BTTC
    '0xe887512ab8bc60bcc9224e1c3b5be68e26048b8b', //USDT_e BTTC
    '0x19860ccb0a68fd4213ab9d8266f7bbf05a8dde98', //BUSD.e
  ]
  if (currency?.address && usdTokenAddresses.includes(currency.address.toLowerCase())) {
    return true
  }
  return false
}

const updateLocalstorageCheckedPair = (key: string, res: { ver: number; pairAddress: string }) => {
  const cPstr = localStorage.getItem(LOCALSTORAGE_CHECKED_PAIRS)
  const checkedPairs: { [key: string]: { ver: number; pairAddress: string; time: number } } = cPstr
    ? JSON.parse(cPstr)
    : {}
  checkedPairs[key] = { ...res, time: new Date().getTime() }
  localStorage.setItem(LOCALSTORAGE_CHECKED_PAIRS, JSON.stringify(checkedPairs))
}

export const checkPairHasDextoolsData = async (
  currencies: { [field in Field]?: Currency },
  chainId: ChainId | undefined,
): Promise<{ ver: number; pairAddress: string }> => {
  const [currencyA, currencyB] = Object.values(currencies)
  const res = { ver: 0, pairAddress: '' }
  if (!currencyA || !currencyB) return Promise.resolve(res)
  if (
    (currencyA.isNative && currencyB.isNative) ||
    (checkIsUSDToken(chainId, currencyA) && checkIsUSDToken(chainId, currencyB))
  ) {
    return Promise.resolve(res)
  }
  const cPstr = localStorage.getItem(LOCALSTORAGE_CHECKED_PAIRS)
  const checkedPairs: { [key: string]: { ver: number; pairAddress: string; time: number } } = cPstr
    ? JSON.parse(cPstr)
    : {}
  const symbolA = currencyA.isNative ? NETWORKS_INFO[chainId || ChainId.MAINNET].nativeToken.name : currencyA.symbol
  const symbolB = currencyB.isNative ? NETWORKS_INFO[chainId || ChainId.MAINNET].nativeToken.name : currencyB.symbol
  const key: string = [symbolA, symbolB, chainId].sort().join('')
  const checkedPair = checkedPairs[key]
  if (
    checkedPair &&
    checkedPair.ver &&
    checkedPair.pairAddress &&
    checkedPair.time > new Date().getTime() - dayTs * 3
  ) {
    return Promise.resolve({ ver: checkedPair.ver, pairAddress: checkedPair.pairAddress })
  }
  /// ETH pair
  if (currencyA.isNative || currencyB.isNative) {
    const token = (currencyA.isToken ? currencyA : currencyB) as Token
    if (token?.address) {
      const data1 = await searchTokenPair(token.address, chainId)
      if (data1.length > 0 && data1[0].id) {
        const ver = (await getHistoryCandleStatus(data1[0].id, chainId)) || 0

        const ts = Math.floor(new Date().getTime() / weekTs) * weekTs
        const { data } = await getCandlesApi(chainId, data1[0].id, ver, ts, 'week')
        if (data?.candles?.length) {
          res.ver = ver
          res.pairAddress = data1[0].id
          updateLocalstorageCheckedPair(key, res)
          return Promise.resolve(res)
        }
      }
    }
  } else {
    /// USD pair
    if (checkIsUSDToken(chainId, currencyA) || checkIsUSDToken(chainId, currencyB)) {
      const token = (checkIsUSDToken(chainId, currencyA) ? currencyB : currencyA) as Token
      if (token?.address) {
        const data1 = await searchTokenPair(token.address, chainId)
        if (data1.length > 0 && data1[0].id) {
          const ver = await getHistoryCandleStatus(data1[0].id, chainId)
          if (ver) {
            const ts = Math.floor(new Date().getTime() / weekTs) * weekTs
            const { data } = await getCandlesApi(chainId, data1[0].id, ver, ts, 'week', '15m', 'usd')
            if (data?.candles?.length) {
              res.ver = ver
              res.pairAddress = data1[0].id
              updateLocalstorageCheckedPair(key, res)
              return Promise.resolve(res)
            }
          }
        }
      }
    }
  }
  updateLocalstorageCheckedPair(key, res)
  return Promise.resolve(res)
}

export const useDatafeed = (currencies: Array<Currency | undefined>, pairAddress: string, apiVersion: string) => {
  const { chainId } = useActiveWeb3React()
  const isTokenUSD =
    (checkIsUSDToken(chainId, currencies[0]) && currencies[1]?.isToken) ||
    (checkIsUSDToken(chainId, currencies[1]) && currencies[0]?.isToken)
  const isEtherUSD =
    (checkIsUSDToken(chainId, currencies[0]) && currencies[1]?.isNative) ||
    (checkIsUSDToken(chainId, currencies[1]) && currencies[0]?.isNative)
  const sym = isTokenUSD || isEtherUSD ? 'usd' : 'eth'
  const [data, setData] = useState<Bar[]>([])
  const [oldestTs, setOldestTs] = useState(0)

  const stateRef = useRef<{ data: Bar[]; oldestTs: number }>({ data, oldestTs })
  const fetchingRef = useRef<boolean>(false)
  const intervalRef = useRef<any>()

  const isReverse =
    (!isEtherUSD && (currencies[0]?.isNative || checkIsUSDToken(chainId, currencies[0]))) ||
    (isEtherUSD && currencies[1]?.isNative)

  useEffect(() => {
    stateRef.current = { data, oldestTs }
  }, [data, oldestTs])

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    setData([])
  }, [currencies])

  const getCandles = async (ts: number, span = 'month', res = '15m') => {
    const response = await getCandlesApi(chainId, pairAddress, apiVersion, ts, span, res, sym)
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
        const label1 = currencies[0]?.isNative
          ? NETWORKS_INFO[chainId || ChainId.MAINNET].nativeToken.name
          : currencies[0]?.symbol
        const label2 = currencies[1]?.isNative
          ? NETWORKS_INFO[chainId || ChainId.MAINNET].nativeToken.name
          : currencies[1]?.symbol

        const label = `${label1}/${label2}`

        const ts = Math.floor(new Date().getTime() / weekTs) * weekTs
        const { candles } = await getCandles(ts, 'week')

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
          pricescale:
            candles.length > 0
              ? Math.pow(10, Math.ceil(Math.log10(isReverse ? candles[0].open : 1 / candles[0].open)) + 5)
              : 100,
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
      symbolInfo: LibrarySymbolInfo,
      resolution: ResolutionString,
      periodParams: PeriodParams,
      onHistoryCallback: HistoryCallback,
      onErrorCallback: ErrorCallback,
    ) => {
      if (fetchingRef.current) return
      try {
        const from = periodParams.from * 1000
        const to = periodParams.to * 1000
        let candlesTemp = stateRef.current.data
        let noData = false
        const minTime = candlesTemp[0]?.time || new Date().getTime()
        if (minTime > from) {
          const lastTimePoint = Math.floor(minTime / monthTs) + (periodParams.firstDataRequest ? 1 : 0)
          const fromTimePoint = Math.floor(from / monthTs)

          fetchingRef.current = true
          const promisesArray = []
          for (let i = lastTimePoint - 1; i >= fromTimePoint; i--) {
            const ts = i * monthTs
            promisesArray.push(getCandles(ts))
            if (ts < stateRef.current.oldestTs) {
              noData = true
              break
            }
          }
          const datas = await Promise.all(promisesArray)
          setOldestTs(parseFloat(datas[0]?.oldestTs))
          const candles = datas.map(data => {
            return data.candles
          })
          candlesTemp = [...(candles.length ? candles.reduce((p, c) => p.concat(c)) : []), ...candlesTemp].sort(
            (a, b) => a.time - b.time,
          )
          setData(candlesTemp)

          fetchingRef.current = false
        }
        // }
        let formatedCandles = candlesTemp
          .filter((c: Bar) => c.time > from && c.time < to)
          .map((c: Bar, i: number, arr: Bar[]) => {
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
          formatedCandles = formatedCandles.map((c: Bar) => {
            return { ...c, open: 1 / c.open, close: 1 / c.close, high: 1 / c.low, low: 1 / c.high }
          })
        }
        if (resolution === '1D' || resolution === '1W' || resolution === '1M') {
          const dayCandles: { [key: number]: Bar } = {}
          let timeTs = 0
          switch (resolution) {
            case '1D':
              timeTs = dayTs
              break
            case '1W':
              timeTs = weekTs
              break
            case '1M':
              timeTs = monthTs
              break
            default:
              timeTs = dayTs
          }
          formatedCandles.forEach((c: Bar) => {
            const ts = Math.floor(c.time / timeTs)
            if (!dayCandles[ts]) {
              dayCandles[ts] = {
                ...c,
                time: ts * timeTs,
              }
            } else {
              dayCandles[ts].volume = (c.volume || 0) + (dayCandles[ts].volume || 0)
              dayCandles[ts].close = c.close
              if (dayCandles[ts].high < c.high) {
                dayCandles[ts].high = c.high
              }
              if (dayCandles[ts].low > c.low) {
                dayCandles[ts].low = c.low
              }
            }
          })
          onHistoryCallback(Object.values(dayCandles), { noData: noData })
        } else {
          onHistoryCallback(formatedCandles, { noData: noData })
        }
      } catch (error) {
        console.log('[getBars]: Get error', error)
        onErrorCallback(error as string)
      }
    },
    searchSymbols: () => {},
    subscribeBars: (
      symbolInfo: LibrarySymbolInfo,
      resolution: ResolutionString,
      onTick: SubscribeBarsCallback,
      listenerGuid: string,
      onResetCacheNeededCallback: () => void,
    ) => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      const getLivePrice = async () => {
        const ts =
          resolution === '1M'
            ? Math.floor(new Date().getTime() / monthTs) * monthTs
            : Math.floor(new Date().getTime() / weekTs) * weekTs
        const data = await getCandles(ts, resolution === '1M' ? 'month' : 'week', '15m')
        if (!data || !data.candles) return
        const { candles } = data
        let lastCandle: any = {}
        let timeTs = 0

        if (resolution === '1D' || resolution === '1W' || resolution === '1M') {
          switch (resolution) {
            case '1D':
              timeTs = Math.floor(new Date().getTime() / dayTs) * dayTs
              break
            case '1W':
              timeTs = Math.floor(new Date().getTime() / weekTs) * weekTs
              break
            case '1M':
              timeTs = timeTs = Math.floor(new Date().getTime() / monthTs) * monthTs
              break
            default:
              timeTs = Math.floor(new Date().getTime() / dayTs) * dayTs
          }
          const closestTs = candles
            .map((c: any) => c.time)
            .reduce((prev: any, curr: any) => {
              return Math.abs(curr - timeTs) < Math.abs(prev - timeTs) ? curr : prev
            })
          const inRangeCandles = candles.filter((c: any) => c.time >= closestTs)

          if (inRangeCandles.length > 0) {
            lastCandle.time = timeTs
            lastCandle.open = inRangeCandles[0].open
            lastCandle.close = inRangeCandles[inRangeCandles.length - 1].close
            lastCandle.high = Math.max(...inRangeCandles.map((c: any) => c.high))
            lastCandle.low = Math.min(...inRangeCandles.map((c: any) => c.low))
            lastCandle.volume = inRangeCandles
              .map((c: any) => c.volume)
              .reduce((prev: any, c: any) => {
                return prev + c
              })
          }
        } else {
          lastCandle = candles[candles.length - 1]
        }
        if (!lastCandle) return
        if (isReverse) {
          lastCandle = {
            ...lastCandle,
            open: 1 / lastCandle.open,
            close: 1 / lastCandle.close,
            high: 1 / lastCandle.low,
            low: 1 / lastCandle.high,
          }
        }
        onTick(lastCandle)
      }
      intervalRef.current = setInterval(getLivePrice, 30000)
      getLivePrice()
    },
    unsubscribeBars: () => {},
  }
}
