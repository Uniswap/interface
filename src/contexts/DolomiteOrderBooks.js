import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react'

import { useWeb3React } from '../hooks'
import { exchange } from '../connectors/index'
import { DMG_ADDRESS, INITIAL_TOKENS_CONTEXT } from './Tokens'

export const START_LISTENING = 'START_LISTENING'
export const STOP_LISTENING = 'STOP_LISTENING'
export const GET_BOOKS = 'GET_BOOKS'

// interface OrderBookState {
//   [chainId: number]: {
//     [market: string]: {
//       value?: any | null
//       listenerCount: number
//     }
//   }
// }

const DolomiteOrderBooksContext = createContext({})

function useDolomiteOrderBooksContext() {
  return useContext(DolomiteOrderBooksContext)
}

export function useDolomiteOrderBooks(primarySymbol, secondarySymbol) {
  // const [state] = useDolomiteOrderBooksContext()
  // return useMemo(() => undefined, undefined)
  const { chainId } = useWeb3React()
  const [state, { startListening, stopListening }] = useDolomiteOrderBooksContext()

  useEffect(() => {
    if (typeof chainId === 'number' && typeof primarySymbol === 'string' && typeof secondarySymbol === 'string') {
      startListening(chainId, primarySymbol, secondarySymbol)
      return () => {
        stopListening(chainId, primarySymbol, secondarySymbol)
      }
    }
  }, [chainId, primarySymbol, secondarySymbol, startListening, stopListening])

  const market = `${primarySymbol}-${secondarySymbol}`
  const books = typeof chainId === 'number' ? state?.[chainId]?.[market]?.value : undefined

  return useMemo(() => books, [books])
}

function reducer(state, { type, payload }) {
  switch (type) {
    case START_LISTENING: {
      const { chainId, primarySymbol, secondarySymbol } = payload
      const market = `${primarySymbol}-${secondarySymbol}`
      const uninitialized = !state?.[chainId]?.[market]
      return {
        ...state,
        [chainId]: {
          ...state?.[chainId],
          [market]: uninitialized
            ? {
              listenerCount: 1
            }
            : {
              ...state[chainId][market],
              listenerCount: state[chainId][market].listenerCount + 1
            }
        }
      }
    }

    case STOP_LISTENING: {
      const { chainId, primarySymbol, secondarySymbol } = payload
      const market = `${primarySymbol}-${secondarySymbol}`
      return {
        ...state,
        [chainId]: {
          ...state?.[chainId],
          [market]: {
            ...state?.[chainId]?.[market],
            listenerCount: state[chainId][market].listenerCount - 1
          }
        }
      }
    }

    case GET_BOOKS: {
      const { chainId, primarySymbol, secondarySymbol, value } = payload
      const market = `${primarySymbol}-${secondarySymbol}`
      return {
        ...state,
        [chainId]: {
          ...state?.[chainId],
          [market]: {
            ...state?.[chainId]?.[market],
            primarySymbol,
            secondarySymbol,
            value
          }
        }
      }
    }
    default: {
      console.error(`Unexpected action type in DolomiteOrderBooksContext reducer: '${type}'.`)
      throw Error(`Unexpected action type in DolomiteOrderBooksContext reducer: '${type}'.`)
    }
  }
}

export default function Provider({ children }) {
  const { chainId } = useWeb3React()

  const [state, dispatch] = useReducer(reducer, {})

  const startListening = useCallback((chainId, primarySymbol, secondarySymbol) => {
    dispatch({ type: START_LISTENING, payload: { chainId, primarySymbol, secondarySymbol } })
  }, [])

  const stopListening = useCallback((chainId, primarySymbol, secondarySymbol) => {
    dispatch({ type: STOP_LISTENING, payload: { chainId, primarySymbol, secondarySymbol } })
  }, [])

  useEffect(() => {
    getAllBooksAndDispatch(dispatch, chainId)
  }, [chainId])

  const update = useInterval(() => {
    getAllBooksAndDispatch(dispatch, chainId)
  }, 10000)

  return (
    <DolomiteOrderBooksContext.Provider value={useMemo(
      () => [state, { startListening, stopListening, update }],
      [state, startListening, stopListening, update]
    )}>
      {children}
    </DolomiteOrderBooksContext.Provider>
  )
}

async function getAllBooksAndDispatch(dispatch, chainId) {
  const primarySymbol = INITIAL_TOKENS_CONTEXT['1'][DMG_ADDRESS].symbol
  const secondarySymbols = Object.keys(INITIAL_TOKENS_CONTEXT['1'])
    .filter(tokenAddress => INITIAL_TOKENS_CONTEXT['1'][tokenAddress].symbol !== primarySymbol)
    .map(tokenAddress => INITIAL_TOKENS_CONTEXT['1'][tokenAddress].symbol)

  const booksPromises = secondarySymbols.map(secondarySymbol => {
    const market = `${primarySymbol}-${secondarySymbol}`
    return exchange.orders.getDepthChart(primarySymbol, secondarySymbol)
      .then(books => {
        dispatch({ type: GET_BOOKS, payload: { chainId, primarySymbol, secondarySymbol, value: books } })
      })
      .catch(error => {
        console.error(`Could not get books for ${market} due to error: `, error)
        dispatch({ type: GET_BOOKS, payload: { chainId, primarySymbol, secondarySymbol, value: undefined } })
      })
  })
  await Promise.all(booksPromises)
}

function useInterval(callback, delay) {
  const savedCallback = useRef()

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current()
    }

    if (delay !== null) {
      let id = setInterval(tick, delay)
      return () => clearInterval(id)
    }
  }, [delay])
}