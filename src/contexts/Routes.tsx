import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'
import { WETH, Token, Route, JSBI } from '@uniswap/sdk'
import { useWeb3React } from '../hooks'
import { usePair } from '../contexts/Pairs'

const UPDATE = 'UPDATE'

interface RouteState {
  [chainId: number]: {
    [tokenAddress: string]: {
      [tokenAddress: string]: {
        route: Route
      }
    }
  }
}

const RouteContext = createContext<[RouteState, { [k: string]: (...args: any) => void }]>([{}, {}])

function useRouteContext() {
  return useContext(RouteContext)
}

function reducer(state: RouteState, { type, payload }) {
  switch (type) {
    case UPDATE: {
      const { tokens, route, chainId } = payload
      return {
        ...state,
        [chainId]: {
          ...state[chainId],
          [tokens[0]]: {
            ...state[chainId]?.[tokens[0]],
            [tokens[1]]: {
              route
            }
          }
        }
      }
    }
    default: {
      throw Error(`Unexpected action type in ExchangesContext reducer: '${type}'.`)
    }
  }
}

export default function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, {})

  const update = useCallback((tokens, route, chainId) => {
    dispatch({ type: UPDATE, payload: { tokens, route, chainId } })
  }, [])

  return (
    <RouteContext.Provider value={useMemo(() => [state, { update }], [state, update])}>
      {children}
    </RouteContext.Provider>
  )
}

/**
 * @param tokenA input to token to be sold
 * @param tokenB output token to be bought
 *
 * This hook finds either a direct pair between tokenA and tokenB or,
 * a one-hop route that goes through token<->WETH pairs
 *
 * if neither exists returns null
 */
export function useRoute(tokenA: Token, tokenB: Token) {
  const [state, { update }] = useRouteContext()
  const { chainId } = useWeb3React()

  let route: Route = state?.[chainId]?.[tokenA?.address]?.[tokenB?.address]?.route

  // check for direct pair between tokens
  const defaultPair = usePair(tokenA, tokenB)

  // get token<->WETH pairs
  const aToETH = usePair(tokenA && !tokenA.equals(WETH[chainId]) ? tokenA : null, WETH[chainId])
  const bToETH = usePair(tokenB && !tokenB.equals(WETH[chainId]) ? tokenB : null, WETH[chainId])

  // needs to route through WETH
  const requiresHop =
    defaultPair &&
    JSBI.equal(defaultPair?.reserve0?.raw, JSBI.BigInt(0)) &&
    JSBI.equal(defaultPair?.reserve1?.raw, JSBI.BigInt(0))

  useEffect(() => {
    if (!route && tokenA && tokenB) {
      if (!requiresHop && defaultPair) {
        update([tokenA.address, tokenB.address], new Route([defaultPair], tokenA), chainId)
      }
      if (
        requiresHop &&
        aToETH &&
        bToETH &&
        // check there is liquidity in both token<->ETH pairs
        JSBI.notEqual(JSBI.BigInt(0), aToETH.reserve0.raw) &&
        JSBI.notEqual(JSBI.BigInt(0), bToETH.reserve0.raw)
      ) {
        const routeThroughETH = new Route([aToETH, bToETH], tokenA)
        update([tokenA.address, tokenB.address], routeThroughETH, chainId)
      }
    }
  }, [route, requiresHop, update, chainId, tokenA, tokenB, defaultPair, aToETH, bToETH])

  return useMemo(() => route, [route])
}
