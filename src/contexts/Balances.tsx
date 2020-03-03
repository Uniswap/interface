import React, {
  createContext,
  useContext,
  useReducer,
  useState,
  useRef,
  useMemo,
  useCallback,
  useEffect,
  ReactNode
} from 'react'
import { BigNumber } from '@uniswap/sdk'
import { ethers } from 'ethers'

import { useWeb3React, useDebounce } from '../hooks'
import { getEtherBalance, getTokenBalance, isAddress } from '../utils'
import { useBlockNumber } from './Application'
import { useTokenDetails, useAllTokenDetails } from './Tokens'
import { getUSDPrice } from '../utils/price'

const LOCAL_STORAGE_KEY = 'BALANCES'
const SHORT_BLOCK_TIMEOUT = (60 * 2) / 15 // in seconds, represented as a block number delta
const LONG_BLOCK_TIMEOUT = (60 * 15) / 15 // in seconds, represented as a block number delta

const EXCHANGES_BLOCK_TIMEOUT = (60 * 5) / 15 // in seconds, represented as a block number delta

interface BalancesState {
  [chainId: number]: {
    [address: string]: {
      [tokenAddress: string]: {
        value?: string | null
        blockNumber?: number
        listenerCount: number
      }
    }
  }
}

function initialize(): BalancesState {
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY) as string)
  } catch {
    return {}
  }
}

enum Action {
  START_LISTENING,
  STOP_LISTENING,
  UPDATE,
  BATCH_UPDATE_ACCOUNT,
  BATCH_UPDATE_EXCHANGES
}

function reducer(state: BalancesState, { type, payload }: { type: Action; payload: any }) {
  switch (type) {
    case Action.START_LISTENING: {
      const { chainId, address, tokenAddress } = payload
      const uninitialized = !!!state?.[chainId]?.[address]?.[tokenAddress]
      return {
        ...state,
        [chainId]: {
          ...state?.[chainId],
          [address]: {
            ...state?.[chainId]?.[address],
            [tokenAddress]: uninitialized
              ? {
                  listenerCount: 1
                }
              : {
                  ...state[chainId][address][tokenAddress],
                  listenerCount: state[chainId][address][tokenAddress].listenerCount + 1
                }
          }
        }
      }
    }
    case Action.STOP_LISTENING: {
      const { chainId, address, tokenAddress } = payload
      return {
        ...state,
        [chainId]: {
          ...state?.[chainId],
          [address]: {
            ...state?.[chainId]?.[address],
            [tokenAddress]: {
              ...state?.[chainId]?.[address]?.[tokenAddress],
              listenerCount: state[chainId][address][tokenAddress].listenerCount - 1
            }
          }
        }
      }
    }
    case Action.UPDATE: {
      const { chainId, address, tokenAddress, value, blockNumber } = payload
      return {
        ...state,
        [chainId]: {
          ...state?.[chainId],
          [address]: {
            ...state?.[chainId]?.[address],
            [tokenAddress]: {
              ...state?.[chainId]?.[address]?.[tokenAddress],
              value,
              blockNumber
            }
          }
        }
      }
    }
    case Action.BATCH_UPDATE_ACCOUNT: {
      const { chainId, address, tokenAddresses, values, blockNumber } = payload
      return {
        ...state,
        [chainId]: {
          ...state?.[chainId],
          [address]: {
            ...state?.[chainId]?.[address],
            ...tokenAddresses.reduce((accumulator: any, tokenAddress: string, i: number) => {
              const value = values[i]
              accumulator[tokenAddress] = {
                ...state?.[chainId]?.[address]?.[tokenAddress],
                value,
                blockNumber
              }
              return accumulator
            }, {})
          }
        }
      }
    }
    case Action.BATCH_UPDATE_EXCHANGES: {
      const { chainId, exchangeAddresses, tokenAddresses, values, blockNumber } = payload

      return {
        ...state,
        [chainId]: {
          ...state?.[chainId],
          ...exchangeAddresses.reduce((accumulator: any, exchangeAddress: string, i: number) => {
            const tokenAddress = tokenAddresses[i]
            const value = values[i]
            accumulator[exchangeAddress] = {
              ...state?.[chainId]?.[exchangeAddress],
              ...accumulator?.[exchangeAddress],
              [tokenAddress]: {
                ...state?.[chainId]?.[exchangeAddress]?.[tokenAddress],
                value,
                blockNumber
              }
            }
            return accumulator
          }, {})
        }
      }
    }
    default: {
      throw Error(`Unexpected action type in BalancesContext reducer: '${type}'.`)
    }
  }
}

const BalancesContext = createContext<[BalancesState, { [k: string]: (...args: any) => void }]>([{}, {}])

function useBalancesContext() {
  return useContext(BalancesContext)
}

export default function Provider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialize)

  const startListening = useCallback((chainId, address, tokenAddress) => {
    dispatch({ type: Action.START_LISTENING, payload: { chainId, address, tokenAddress } })
  }, [])

  const stopListening = useCallback((chainId, address, tokenAddress) => {
    dispatch({ type: Action.STOP_LISTENING, payload: { chainId, address, tokenAddress } })
  }, [])

  const update = useCallback((chainId, address, tokenAddress, value, blockNumber) => {
    dispatch({ type: Action.UPDATE, payload: { chainId, address, tokenAddress, value, blockNumber } })
  }, [])

  const batchUpdateAccount = useCallback((chainId, address, tokenAddresses, values, blockNumber) => {
    dispatch({ type: Action.BATCH_UPDATE_ACCOUNT, payload: { chainId, address, tokenAddresses, values, blockNumber } })
  }, [])

  const batchUpdateExchanges = useCallback((chainId, exchangeAddresses, tokenAddresses, values, blockNumber) => {
    dispatch({
      type: Action.BATCH_UPDATE_EXCHANGES,
      payload: { chainId, exchangeAddresses, tokenAddresses, values, blockNumber }
    })
  }, [])

  return (
    <BalancesContext.Provider
      value={useMemo(
        () => [state, { startListening, stopListening, update, batchUpdateAccount, batchUpdateExchanges }],
        [state, startListening, stopListening, update, batchUpdateAccount, batchUpdateExchanges]
      )}
    >
      {children}
    </BalancesContext.Provider>
  )
}

export function Updater() {
  const { chainId, account, library } = useWeb3React()
  const blockNumber = useBlockNumber()
  const [state, { update, batchUpdateAccount, batchUpdateExchanges }] = useBalancesContext()

  // debounce state a little bit to prevent useEffect craziness
  const debouncedState = useDebounce(state, 1000)
  // cache this debounced state in localstorage
  useEffect(() => {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(debouncedState))
  }, [debouncedState])

  // (slightly janky) balances-wide cache to prevent double/triple/etc. fetching
  const fetchedAsOfCache = useRef<{
    [chainId: number]: {
      [address: string]: {
        [tokenAddress: string]: number
      }
    }
  }>({})

  // generic balances fetcher abstracting away difference between fetching ETH + token balances
  const fetchBalance = useCallback(
    (address: string, tokenAddress: string) =>
      (tokenAddress === 'ETH' ? getEtherBalance(address, library) : getTokenBalance(tokenAddress, address, library))
        .then(value => {
          return value.toString()
        })
        .catch(() => {
          return null
        }),
    [library]
  )

  // ensure that all balances with >=1 listeners are updated every block
  useEffect(() => {
    if (typeof chainId === 'number' && typeof blockNumber === 'number') {
      for (const address of Object.keys(debouncedState?.[chainId] ?? {})) {
        for (const tokenAddress of Object.keys(debouncedState?.[chainId][address])) {
          const active = debouncedState[chainId][address][tokenAddress].listenerCount > 0
          if (active) {
            const cachedFetchedAsOf = fetchedAsOfCache.current?.[chainId]?.[address]?.[tokenAddress]
            const fetchedAsOf = debouncedState[chainId][address][tokenAddress]?.blockNumber ?? cachedFetchedAsOf
            if (fetchedAsOf !== blockNumber) {
              // fetch the balance...
              fetchBalance(address, tokenAddress).then(value => {
                update(chainId, address, tokenAddress, value, blockNumber)
              })
              // ...and cache the fetch
              fetchedAsOfCache.current = {
                ...fetchedAsOfCache.current,
                [chainId]: {
                  ...fetchedAsOfCache.current?.[chainId],
                  [address]: {
                    ...fetchedAsOfCache.current?.[chainId]?.[address],
                    [tokenAddress]: blockNumber
                  }
                }
              }
            }
          }
        }
      }
    }
  }, [chainId, blockNumber, debouncedState, fetchBalance, update])

  // get a state ref for batch updates
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])
  const allTokenDetails = useAllTokenDetails()

  // ensure that we have the user balances for all tokens
  const allTokens = useMemo(() => Object.keys(allTokenDetails), [allTokenDetails])
  useEffect(() => {
    if (typeof chainId === 'number' && typeof account === 'string' && typeof blockNumber === 'number') {
      Promise.all(
        allTokens
          .filter(tokenAddress => {
            const hasValue = !!stateRef.current?.[chainId]?.[account]?.[tokenAddress]?.value
            const cachedFetchedAsOf = fetchedAsOfCache.current?.[chainId]?.[account]?.[tokenAddress]
            const fetchedAsOf = stateRef.current?.[chainId]?.[account][tokenAddress]?.blockNumber ?? cachedFetchedAsOf

            // if there's no value, and it's not being fetched, we need to fetch!
            if (!hasValue && typeof cachedFetchedAsOf !== 'number') {
              return true
              // else, if there's a value, check if it's stale
            } else if (hasValue) {
              const blocksElapsedSinceLastCheck = blockNumber - fetchedAsOf
              const stale =
                blocksElapsedSinceLastCheck >=
                (stateRef.current[chainId][account][tokenAddress].value === '0'
                  ? LONG_BLOCK_TIMEOUT
                  : SHORT_BLOCK_TIMEOUT)
              return stale
            } else {
              return false
            }
          })
          .map(async tokenAddress => {
            fetchedAsOfCache.current = {
              ...fetchedAsOfCache.current,
              [chainId]: {
                ...fetchedAsOfCache.current?.[chainId],
                [account]: {
                  ...fetchedAsOfCache.current?.[chainId]?.[account],
                  [tokenAddress]: blockNumber
                }
              }
            }
            return fetchBalance(account, tokenAddress).then(value => ({ tokenAddress, value }))
          })
      ).then(results => {
        batchUpdateAccount(
          chainId,
          account,
          results.map(result => result.tokenAddress),
          results.map(result => result.value),
          blockNumber
        )
      })
    }
  }, [chainId, account, blockNumber, allTokens, fetchBalance, batchUpdateAccount])

  // ensure that we have the eth and token balances for all exchanges
  const allExchanges = useMemo(
    () =>
      Object.keys(allTokenDetails)
        .filter(tokenAddress => tokenAddress !== 'ETH')
        .map(tokenAddress => ({
          tokenAddress,
          exchangeAddress: allTokenDetails[tokenAddress].exchangeAddress
        })),
    [allTokenDetails]
  )
  useEffect(() => {
    if (typeof chainId === 'number' && typeof blockNumber === 'number') {
      Promise.all(
        allExchanges
          .filter(({ exchangeAddress, tokenAddress }) => {
            const hasValueToken = !!stateRef.current?.[chainId]?.[exchangeAddress]?.[tokenAddress]?.value
            const hasValueETH = !!stateRef.current?.[chainId]?.[exchangeAddress]?.['ETH']?.value

            const cachedFetchedAsOfToken = fetchedAsOfCache.current?.[chainId]?.[exchangeAddress]?.[tokenAddress]
            const cachedFetchedAsOfETH = fetchedAsOfCache.current?.[chainId]?.[exchangeAddress]?.['ETH']

            const fetchedAsOfToken =
              stateRef.current?.[chainId]?.[exchangeAddress][tokenAddress]?.blockNumber ?? cachedFetchedAsOfToken
            const fetchedAsOfETH =
              stateRef.current?.[chainId]?.[exchangeAddress]['ETH']?.blockNumber ?? cachedFetchedAsOfETH

            // if there's no values, and they're not being fetched, we need to fetch!
            if (
              (!hasValueToken || !hasValueETH) &&
              (typeof cachedFetchedAsOfToken !== 'number' || typeof cachedFetchedAsOfETH !== 'number')
            ) {
              return true
              // else, if there are values, check if they's stale
            } else if (hasValueToken && hasValueETH) {
              const blocksElapsedSinceLastCheckToken = blockNumber - fetchedAsOfToken
              const blocksElapsedSinceLastCheckETH = blockNumber - fetchedAsOfETH

              const stale =
                fetchedAsOfToken !== fetchedAsOfETH ||
                blocksElapsedSinceLastCheckToken >= EXCHANGES_BLOCK_TIMEOUT ||
                blocksElapsedSinceLastCheckETH >= EXCHANGES_BLOCK_TIMEOUT
              return stale
            } else {
              return false
            }
          })
          .map(async ({ exchangeAddress, tokenAddress }) => {
            fetchedAsOfCache.current = {
              ...fetchedAsOfCache.current,
              [chainId]: {
                ...fetchedAsOfCache.current?.[chainId],
                [exchangeAddress]: {
                  ...fetchedAsOfCache.current?.[chainId]?.[exchangeAddress],
                  [tokenAddress]: blockNumber,
                  ETH: blockNumber
                }
              }
            }
            return Promise.all([
              fetchBalance(exchangeAddress, tokenAddress),
              fetchBalance(exchangeAddress, 'ETH')
            ]).then(([valueToken, valueETH]) => ({ exchangeAddress, tokenAddress, valueToken, valueETH }))
          })
      ).then(results => {
        batchUpdateExchanges(
          chainId,
          results.flatMap(result => [result.exchangeAddress, result.exchangeAddress]),
          results.flatMap(result => [result.tokenAddress, 'ETH']),
          results.flatMap(result => [result.valueToken, result.valueETH]),
          blockNumber
        )
      })
    }
  }, [chainId, account, blockNumber, allExchanges, fetchBalance, batchUpdateExchanges])

  return null
}

export function useAllBalances() {
  const { chainId } = useWeb3React()
  const [state] = useBalancesContext()
  return useMemo(() => (typeof chainId === 'number' ? state?.[chainId] ?? {} : {}), [chainId, state])
}

export function useAddressBalance(address: string, tokenAddress: string): ethers.utils.BigNumber | undefined | null {
  const { chainId } = useWeb3React()
  const [state, { startListening, stopListening }] = useBalancesContext()

  useEffect(() => {
    if (typeof chainId === 'number' && isAddress(address) && isAddress(tokenAddress)) {
      startListening(chainId, address, tokenAddress)
      return () => {
        stopListening(chainId, address, tokenAddress)
      }
    }
  }, [chainId, address, tokenAddress, startListening, stopListening])

  const value = typeof chainId === 'number' ? state?.[chainId]?.[address]?.[tokenAddress]?.value : undefined

  return useMemo(() => (typeof value === 'string' ? ethers.utils.bigNumberify(value) : value), [value])
}

export function useExchangeReserves(tokenAddress: string) {
  const { exchangeAddress } = useTokenDetails(tokenAddress)

  const reserveETH = useAddressBalance(exchangeAddress, 'ETH')
  const reserveToken = useAddressBalance(exchangeAddress, tokenAddress)

  return { reserveETH, reserveToken }
}

const buildReserveObject = (
  chainId: number,
  tokenAddress: string,
  ethReserveAmount: any,
  tokenReserveAmount: any,
  decimals: number
) => ({
  token: {
    chainId,
    address: tokenAddress,
    decimals
  },
  ethReserve: {
    token: {
      chainId,
      decimals: 18
    },
    amount: ethReserveAmount
  },
  tokenReserve: {
    token: {
      chainId,
      address: tokenAddress,
      decimals
    },
    amount: tokenReserveAmount
  }
})
const daiTokenAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
const daiExchangeAddress = '0x2a1530C4C41db0B0b2bB646CB5Eb1A67b7158667'
const usdcTokenAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const usdcExchangeAddress = '0x97deC872013f6B5fB443861090ad931542878126'
const tusdTokenAddress = '0x0000000000085d4780B73119b644AE5ecd22b376'
const tusdExchangeAddress = '0x5048b9d01097498Fd72F3F14bC9Bc74A5aAc8fA7'
export function useETHPriceInUSD() {
  const { chainId } = useWeb3React()

  let daiReserveETH = useAddressBalance(daiExchangeAddress, 'ETH')
  let daiReserveToken = useAddressBalance(daiExchangeAddress, daiTokenAddress)
  let usdcReserveETH = useAddressBalance(usdcExchangeAddress, 'ETH')
  let usdcReserveToken = useAddressBalance(usdcExchangeAddress, usdcTokenAddress)
  let tusdReserveETH = useAddressBalance(tusdExchangeAddress, 'ETH')
  let tusdReserveToken = useAddressBalance(tusdExchangeAddress, tusdTokenAddress)

  const [price, setPrice] = useState<undefined | null>()
  useEffect(() => {
    if (
      chainId &&
      daiReserveETH &&
      daiReserveToken &&
      usdcReserveETH &&
      usdcReserveToken &&
      tusdReserveETH &&
      tusdReserveToken
    ) {
      const daiReservesObject = buildReserveObject(
        chainId,
        daiTokenAddress,
        new BigNumber(daiReserveETH.toString()),
        new BigNumber(daiReserveToken.toString()),
        18
      )
      const tusdReservesObject = buildReserveObject(
        chainId,
        tusdTokenAddress,
        new BigNumber(tusdReserveETH.toString()),
        new BigNumber(tusdReserveToken.toString()),
        18
      )
      const usdcReservesObject = buildReserveObject(
        chainId,
        usdcTokenAddress,
        new BigNumber(usdcReserveETH.toString()),
        new BigNumber(usdcReserveToken.toString()),
        6
      )

      const stablecoinReserves = [daiReservesObject, usdcReservesObject, tusdReservesObject]

      try {
        setPrice(getUSDPrice(stablecoinReserves))
      } catch {
        setPrice(null)
      }
    }
  }, [daiReserveETH, daiReserveToken, usdcReserveETH, usdcReserveToken, tusdReserveETH, tusdReserveToken, chainId])

  return price
}
