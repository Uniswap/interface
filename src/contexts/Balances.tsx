import React, { createContext, useContext, useReducer, useRef, useMemo, useCallback, useEffect, ReactNode } from 'react'
import { TokenAmount, Token, JSBI, WETH } from '@uniswap/sdk'
import { useBlockNumber } from '../state/application/hooks'

import { useAllTokens } from './Tokens'
import { useWeb3React, useDebounce } from '../hooks'

import { getEtherBalance, getTokenBalance, isAddress } from '../utils'
import { useAllDummyPairs } from '../state/user/hooks'

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
      const { chainId, pairAddresses, tokenAddresses, values, blockNumber } = payload

      return {
        ...state,
        [chainId]: {
          ...state?.[chainId],
          ...pairAddresses.reduce((accumulator: any, pairAddress: string, i: number) => {
            const tokenAddress = tokenAddresses[i]
            const value = values[i]
            accumulator[pairAddress] = {
              ...state?.[chainId]?.[pairAddress],
              ...accumulator?.[pairAddress],
              [tokenAddress]: {
                ...state?.[chainId]?.[pairAddress]?.[tokenAddress],
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

  const startListening = useCallback(
    (chainId, address, tokenAddress) => {
      dispatch({ type: Action.START_LISTENING, payload: { chainId, address, tokenAddress } })
    },
    [dispatch]
  )

  const stopListening = useCallback(
    (chainId, address, tokenAddress) => {
      dispatch({ type: Action.STOP_LISTENING, payload: { chainId, address, tokenAddress } })
    },
    [dispatch]
  )

  const update = useCallback(
    (chainId, address, tokenAddress, value, blockNumber) => {
      dispatch({ type: Action.UPDATE, payload: { chainId, address, tokenAddress, value, blockNumber } })
    },
    [dispatch]
  )

  const batchUpdateAccount = useCallback(
    (chainId, address, tokenAddresses, values, blockNumber) => {
      dispatch({
        type: Action.BATCH_UPDATE_ACCOUNT,
        payload: { chainId, address, tokenAddresses, values, blockNumber }
      })
    },
    [dispatch]
  )

  const batchUpdateExchanges = useCallback(
    (chainId, pairAddresses, tokenAddresses, values, blockNumber) => {
      dispatch({
        type: Action.BATCH_UPDATE_EXCHANGES,
        payload: { chainId, pairAddresses, tokenAddresses, values, blockNumber }
      })
    },
    [dispatch]
  )

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
    (address: string, tokenAddress: string) => {
      return (tokenAddress === 'ETH'
        ? getEtherBalance(address, library)
        : address === account && tokenAddress === WETH[chainId].address
        ? getEtherBalance(address, library)
        : getTokenBalance(tokenAddress, address, library)
      )
        .then(value => {
          return value.toString()
        })
        .catch(() => {
          return null
        })
    },
    [account, chainId, library]
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
  const allTokenDetails = useAllTokens()

  // ensure that we have the user balances for all tokens
  const allTokens = useMemo(() => Object.keys(allTokenDetails), [allTokenDetails])
  useEffect(() => {
    if (typeof chainId === 'number' && typeof account === 'string' && typeof blockNumber === 'number') {
      Promise.all(
        allTokens
          .filter(tokenAddress => {
            const hasValue = !!stateRef.current?.[chainId]?.[account]?.[tokenAddress]?.value
            const cachedFetchedAsOf = fetchedAsOfCache.current?.[chainId]?.[account]?.[tokenAddress]
            const fetchedAsOf = stateRef.current?.[chainId]?.[account]?.[tokenAddress]?.blockNumber ?? cachedFetchedAsOf

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

  // ensure token balances for all exchanges
  const allPairs = useAllDummyPairs()
  useEffect(() => {
    if (typeof chainId === 'number' && typeof blockNumber === 'number') {
      Promise.all(
        allPairs
          .filter(pair => {
            const token0Address = pair.token0.address
            const token1Address = pair.token1.address
            const pairAddress = pair.liquidityToken.address

            const hasValueToken0 = !!stateRef.current?.[chainId]?.[pairAddress]?.[token0Address]?.value
            const hasValueToken1 = !!stateRef.current?.[chainId]?.[pairAddress]?.[token1Address]?.value

            const cachedFetchedAsOfToken0 = fetchedAsOfCache.current?.[chainId]?.[pairAddress]?.token0
            const cachedFetchedAsOfToken1 = fetchedAsOfCache.current?.[chainId]?.[pairAddress]?.token1

            const fetchedAsOfToken0 =
              stateRef.current?.[chainId]?.[pairAddress]?.[token0Address]?.blockNumber ?? cachedFetchedAsOfToken0
            const fetchedAsOfToken1 =
              stateRef.current?.[chainId]?.[pairAddress]?.[token1Address]?.blockNumber ?? cachedFetchedAsOfToken1

            // if there's no values, and they're not being fetched, we need to fetch!
            if (
              (!hasValueToken0 || !hasValueToken1) &&
              (typeof cachedFetchedAsOfToken0 !== 'number' || typeof cachedFetchedAsOfToken1 !== 'number')
            ) {
              return true
              // else, if there are values, check if they's stale
            } else if (hasValueToken0 && hasValueToken0) {
              const blocksElapsedSinceLastCheckToken0 = blockNumber - fetchedAsOfToken0
              const blocksElapsedSinceLastCheckToken1 = blockNumber - fetchedAsOfToken1

              const stale =
                fetchedAsOfToken0 !== fetchedAsOfToken1 ||
                blocksElapsedSinceLastCheckToken0 >= EXCHANGES_BLOCK_TIMEOUT ||
                blocksElapsedSinceLastCheckToken1 >= EXCHANGES_BLOCK_TIMEOUT

              return stale
            } else {
              return false
            }
          })
          .map(async pair => {
            const token0Address = pair.token0.address
            const token1Address = pair.token1.address
            const pairAddress = pair.liquidityToken.address

            fetchedAsOfCache.current = {
              ...fetchedAsOfCache.current,
              [chainId]: {
                ...fetchedAsOfCache.current?.[chainId],
                [pairAddress]: {
                  ...fetchedAsOfCache.current?.[chainId]?.[pairAddress],
                  [token0Address]: blockNumber,
                  [token1Address]: blockNumber
                }
              }
            }
            return Promise.all([
              fetchBalance(pairAddress, token0Address),
              fetchBalance(pairAddress, token1Address)
            ]).then(([valueToken0, valueToken1]) => ({
              pairAddress,
              token0Address,
              token1Address,
              valueToken0,
              valueToken1
            }))
          })
      ).then(results => {
        batchUpdateExchanges(
          chainId,
          results.flatMap(result => [result.pairAddress, result.pairAddress]),
          results.flatMap(result => [result.token0Address, result.token1Address]),
          results.flatMap(result => [result.valueToken0, result.valueToken1]),
          blockNumber
        )
      })
    }
  }, [chainId, account, blockNumber, allPairs, fetchBalance, batchUpdateExchanges])

  return null
}

export function useAllBalances(): { [ownerAddress: string]: { [tokenAddress: string]: TokenAmount } } {
  const { chainId } = useWeb3React()
  const [state] = useBalancesContext()

  const allTokens = useAllTokens()

  const formattedBalances = useMemo(() => {
    if (!state || !state[chainId]) {
      return {}
    } else {
      const newBalances = {}
      Object.keys(state[chainId]).map(address => {
        return Object.keys(state[chainId][address]).map(tokenAddress => {
          if (state[chainId][address][tokenAddress].value) {
            // fix if ETH found in local storage from old storage
            if (tokenAddress === 'ETH') {
              tokenAddress = WETH[chainId]?.address
            }
            newBalances[chainId] = {
              ...newBalances[chainId],
              [address]: {
                ...newBalances[chainId]?.[address],
                [tokenAddress]: new TokenAmount(
                  allTokens[tokenAddress] ? allTokens[tokenAddress] : new Token(chainId, tokenAddress, 18),
                  JSBI.BigInt(
                    state?.[chainId][address][tokenAddress]?.value ? state?.[chainId][address][tokenAddress]?.value : 0
                  )
                )
              }
            }
          }
          return true
        })
      })
      return newBalances
    }
  }, [allTokens, chainId, state])

  return useMemo(() => (typeof chainId === 'number' ? formattedBalances?.[chainId] ?? {} : {}), [
    chainId,
    formattedBalances
  ])
}

export function useAddressBalance(address: string, token: Token): TokenAmount | undefined | null {
  const { chainId } = useWeb3React()
  const [state, { startListening, stopListening }] = useBalancesContext()

  const value = typeof chainId === 'number' ? state?.[chainId]?.[address]?.[token?.address]?.value : undefined
  const formattedValue = value && token && new TokenAmount(token, value)

  useEffect(() => {
    if (typeof chainId === 'number' && isAddress(address) && isAddress(token?.address)) {
      startListening(chainId, address, token.address)
      return () => {
        stopListening(chainId, address, token.address)
      }
    }
  }, [chainId, address, startListening, stopListening, token])

  return useMemo(() => formattedValue, [formattedValue])
}

export function useAccountLPBalances(account: string) {
  const { chainId } = useWeb3React()
  const [, { startListening, stopListening }] = useBalancesContext()
  const pairs = useAllDummyPairs()

  useEffect(() => {
    if (typeof chainId === 'number' && isAddress(account)) {
      const cleanupFunctions = []
      pairs.forEach(pair => {
        startListening(chainId, account, pair.liquidityToken.address)
        cleanupFunctions.push(() => stopListening(chainId, account, pair.liquidityToken.address))
      })

      return () => {
        cleanupFunctions.forEach(cleanupFunction => cleanupFunction())
      }
    }
  }, [chainId, account, pairs, startListening, stopListening])
}
