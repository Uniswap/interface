import { ChainId, Currency, Token, WETH } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { DAI, STABLE_COINS_ADDRESS, USDC, USDT } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { Field } from 'state/swap/actions'

import {
  Bar,
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
  supported_resolutions: ['1', '3', '5', '15', '30', '1H', '2H', '4H', '1D', '1W', '1M'],
}

const NetworkString: { [chain in ChainId]: string } = {
  [ChainId.MAINNET]: 'chain-ethereum',
  [ChainId.BSCMAINNET]: 'chain-bsc',
  [ChainId.MATIC]: 'chain-polygon',
  [ChainId.CRONOS]: 'chain-cronos',
  [ChainId.AVAXMAINNET]: 'chain-avalanche',
  [ChainId.FANTOM]: 'chain-fantom',
  [ChainId.ARBITRUM]: 'chain-arbitrum',
  [ChainId.VELAS]: 'chain-velas',
  [ChainId.AURORA]: 'chain-aurora',
  [ChainId.OASIS]: 'chain-oasis',
  [ChainId.OPTIMISM]: 'chain-optimism',
  [ChainId.ETHW]: 'chain-ethw',
  [ChainId.SOLANA]: 'chain-solana',

  [ChainId.BTTC]: '',
  [ChainId.ROPSTEN]: '',
  [ChainId.RINKEBY]: '',
  [ChainId.GÖRLI]: '',
  [ChainId.KOVAN]: '',
  [ChainId.BSCTESTNET]: '',
  [ChainId.MUMBAI]: '',
  [ChainId.AVAXTESTNET]: '',
  [ChainId.CRONOSTESTNET]: '',
  [ChainId.ARBITRUM_TESTNET]: '',
}

const DextoolSearchV2ChainId: { [chain in ChainId]: string } = {
  [ChainId.MAINNET]: 'ether',
  [ChainId.BSCMAINNET]: 'bsc',
  [ChainId.MATIC]: 'polygon',
  [ChainId.CRONOS]: 'cronos',
  [ChainId.AVAXMAINNET]: 'avalanche',
  [ChainId.FANTOM]: 'fantom',
  [ChainId.ARBITRUM]: 'arbitrum',
  [ChainId.VELAS]: 'velas',
  [ChainId.AURORA]: 'aurora',
  [ChainId.OASIS]: 'oasis',
  [ChainId.OPTIMISM]: 'optimism',
  [ChainId.ETHW]: 'ethw',
  [ChainId.SOLANA]: 'solana',

  [ChainId.BTTC]: '',
  [ChainId.ROPSTEN]: '',
  [ChainId.RINKEBY]: '',
  [ChainId.GÖRLI]: '',
  [ChainId.KOVAN]: '',
  [ChainId.BSCTESTNET]: '',
  [ChainId.MUMBAI]: '',
  [ChainId.AVAXTESTNET]: '',
  [ChainId.CRONOSTESTNET]: '',
  [ChainId.ARBITRUM_TESTNET]: '',
}

const DEXTOOLS_API = 'https://pancake-subgraph-proxy.kyberswap.com/dextools'
const monthTs = 2592000000
const weekTs = 604800000
const dayTs = 86400000
// Hard code token address to specific pair address to use in dextool api.
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
  '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': '0xd99c7f6c65857ac913a8f880a4cb84032ab2fc5b',
  '0xdac17f958d2ee523a2206206994597c13d831ec7': '0x4e68ccd3e89f51c3074ca5072bbac773960dfa36', // BNB_USD
  '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619': '0xce1923d2242bba540f1d56c8e23b1fbeae2596dc', // ETH_USD on polygon
  '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8': '0x905dfcd5649217c42684f23958568e533c711aa3', // ETH_USD Arbitrum
  '0x7f5c764cbc14f9669b88837ca1490cca17c31607': '0x1a981daa7967c66c3356ad044979bc82e4a478b9', // ETH_USD Optimism
  '0xe9e7cea3dedca5984780bafc599bd69add087d56': '0x58f876857a02d6762e0101bb5c46a8c1ed44dc16', // BNB_BUSD
  '0x853ea32391aaa14c112c645fd20ba389ab25c5e0': '0x5d79a43e6b9d8e3ecca26f91afe34634248773c8', // USX on AVAX
  '0x261c94f2d3cccae76f86f6c8f2c93785dd6ce022': 'nodata', // ATH on BSC
  '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58': '0xc858a329bf053be78d6239c4a4343b8fbd21472b', // USDT on Optimism
  epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v: 'EGZ7tiLeH62TPV1gL8WwbXGzEPa9zmcpVnnkPKKnrE2U', // USDC on SOLANA
}
const LOCALSTORAGE_CHECKED_PAIRS = 'proChartCheckedPairs'

const fetcherDextools = (url: string) => {
  return fetch(`${DEXTOOLS_API}/${url}`)
    .then(res => res.json())
    .catch(error => console.warn(`fetch ${`${DEXTOOLS_API}/${url}`} failed:\n`, error))
}

const searchTokenPair = (address: string, chainId: ChainId): any => {
  if (TOKEN_PAIRS_ADDRESS_MAPPING[address.toLowerCase()]) {
    return new Promise((resolve, reject) => {
      resolve([{ id: { pair: TOKEN_PAIRS_ADDRESS_MAPPING[address.toLowerCase()] } }])
    })
  }
  return fetcherDextools(`shared/search/v2?chains=${DextoolSearchV2ChainId[chainId]}&query=${address}`).then(res =>
    res.results
      .filter((token: any) => token.id.token === address.toLowerCase() && !!token.volume)
      .sort((tokenA: any, tokenB: any) => tokenB.volume - tokenA.volume),
  )
}
const getHistoryCandleStatus = (pairAddress: string, chainId: ChainId) =>
  fetcherDextools(`${NetworkString[chainId]}/api/Uniswap/1/history-candle-status?pair=${pairAddress}`)

const getCandlesApi = (
  chainId: ChainId,
  pairAddress: string,
  apiVersion: string,
  ts: number,
  span = 'month',
  res = '15m',
  sym = 'eth',
) => {
  return fetcherDextools(
    `${
      NetworkString[chainId]
    }/api/Pancakeswap/history/candles?sym=${sym}&span=${span}&pair=${pairAddress}&ts=${ts}&v=${apiVersion}${
      res && '&res=' + res
    }`,
  )
}

const isNativeToken = (chainId: ChainId | undefined, currency: Currency | undefined) => {
  if (!currency || !chainId) {
    return false
  }
  return currency.isNative || WETH[chainId].address.toLowerCase() === currency.address.toLowerCase()
}

const isUSDToken = (chainId: ChainId | undefined, currency: Currency | undefined) => {
  if (isNativeToken(chainId, currency) || !chainId || currency?.isNative) {
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
    '0x4fbf0429599460d327bd5f55625e30e4fc066095', //TDS on AVAX
    ...STABLE_COINS_ADDRESS[chainId].map(a => a.toLowerCase()),
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
  chainId: ChainId,
): Promise<{ ver: number; pairAddress: string }> => {
  const [currencyA, currencyB] = Object.values(currencies)
  const res = { ver: 0, pairAddress: '' }
  if (!currencyA || !currencyB) return Promise.resolve(res)
  if (
    (isNativeToken(chainId, currencyA) && isNativeToken(chainId, currencyB)) ||
    (isUSDToken(chainId, currencyA) && isUSDToken(chainId, currencyB))
  ) {
    return Promise.resolve(res)
  }
  const cPstr = localStorage.getItem(LOCALSTORAGE_CHECKED_PAIRS)
  const checkedPairs: { [key: string]: { ver: number; pairAddress: string; time: number } } = cPstr
    ? JSON.parse(cPstr)
    : {}
  const symbolA = currencyA.isNative ? WETH[chainId].name : currencyA.symbol
  const symbolB = currencyB.isNative ? WETH[chainId].name : currencyB.symbol
  const key: string = [symbolA, symbolB, chainId].sort().join('')
  const checkedPair = checkedPairs[key]
  if (
    checkedPair &&
    checkedPair.ver &&
    checkedPair.pairAddress &&
    checkedPair.time > new Date().getTime() - dayTs // Cache expire after 1 day
  ) {
    return Promise.resolve({ ver: checkedPair.ver, pairAddress: checkedPair.pairAddress })
  }
  /// ETH pair
  if (isNativeToken(chainId, currencyA) || isNativeToken(chainId, currencyB)) {
    const token = (isNativeToken(chainId, currencyA) ? currencyB : currencyA) as Token
    if (token?.address) {
      const searchResults: { id: { pair: string } }[] = await searchTokenPair(token.address, chainId)
      const pairAddress = searchResults[0]?.id?.pair
      if (searchResults && searchResults.length > 0 && pairAddress) {
        const ver = (await getHistoryCandleStatus(pairAddress, chainId)) || 0

        const ts = Math.floor(new Date().getTime() / monthTs) * monthTs
        const { data } = await getCandlesApi(chainId, pairAddress, ver, ts, 'month')
        if (data?.candles?.length) {
          res.ver = ver
          res.pairAddress = pairAddress
          updateLocalstorageCheckedPair(key, res)
          return Promise.resolve(res)
        }
      }
    }
  } else {
    /// USD pair
    if (isUSDToken(chainId, currencyA) || isUSDToken(chainId, currencyB)) {
      const token = (isUSDToken(chainId, currencyA) ? currencyB : currencyA) as Token
      if (token?.address) {
        const searchResults = await searchTokenPair(token.address, chainId)
        const pairAddress = searchResults[0]?.id?.pair
        if (searchResults.length > 0 && pairAddress) {
          const ver = await getHistoryCandleStatus(pairAddress, chainId)
          if (ver) {
            const ts = Math.floor(new Date().getTime() / monthTs) * monthTs
            const { data } = await getCandlesApi(chainId, pairAddress, ver, ts, 'month', '15m', 'usd')
            if (data?.candles?.length) {
              res.ver = ver
              res.pairAddress = pairAddress
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
  const isATokenEther = isNativeToken(chainId, currencies[0])
  const isBTokenEther = isNativeToken(chainId, currencies[1])
  const isTokenUSD =
    (isUSDToken(chainId, currencies[0]) && currencies[1]?.isToken) ||
    (isUSDToken(chainId, currencies[1]) && currencies[0]?.isToken)
  const isEtherUSD =
    (isUSDToken(chainId, currencies[0]) && isBTokenEther) || (isUSDToken(chainId, currencies[1]) && isATokenEther)
  const sym = isTokenUSD || isEtherUSD ? 'usd' : 'eth'
  const [data, setData] = useState<Bar[]>([])
  const [oldestTs, setOldestTs] = useState(0)

  const stateRef = useRef<{ data: Bar[]; oldestTs: number }>({ data, oldestTs })
  const fetchingRef = useRef<boolean>(false)
  const intervalRef = useRef<any>()

  const isReverse =
    (!isEtherUSD && (isATokenEther || isUSDToken(chainId, currencies[0]))) || (isEtherUSD && isBTokenEther)

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

  const getCandles = useCallback(
    async (ts: number, span = 'month', res = '15m') => {
      const response = await getCandlesApi(chainId, pairAddress, apiVersion, ts, span, res, sym)
      return response?.data
    },
    [chainId, pairAddress, apiVersion, sym],
  )

  return useMemo(() => {
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
          const label1 = currencies[0]?.isNative ? WETH[chainId].name : currencies[0]?.symbol
          const label2 = currencies[1]?.isNative ? WETH[chainId].name : currencies[1]?.symbol

          const label = `${label1}/${label2}`

          const ts = Math.floor(new Date().getTime() / monthTs) * monthTs
          const { candles } = await getCandles(ts, 'month')

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
                : 10000,
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
              if (c.high > 1.1 * Math.max(c.open, c.close)) {
                c.high = Math.max(c.open, c.close)
              }
              if (c.low < Math.min(c.open, c.close) / 1.1) {
                c.low = Math.min(c.open, c.close)
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
      searchSymbols: () => {
        // TODO(viet-nv): check no empty function rule
      },
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
      unsubscribeBars: () => {
        // TODO(viet-nv): check no empty function rule
      },
    }
  }, [chainId, getCandles, isReverse, currencies])
}
