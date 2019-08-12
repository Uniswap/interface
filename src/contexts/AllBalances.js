import React, { createContext, useContext, useReducer, useMemo, useCallback } from 'react'
import { getTokenReserves, getMarketDetails } from '@uniswap/sdk'
import { useWeb3Context } from 'web3-react'

import { safeAccess, isAddress, getEtherBalance, getTokenBalance, getTokenDecimals } from '../utils'
import { useAllTokenDetails } from './Tokens'
import { useUSDPrice } from './Application'

const UPDATE = 'UPDATE'

const AllBalancesContext = createContext()

function useAllBalancesContext() {
  return useContext(AllBalancesContext)
}

function reducer(state, { type, payload }) {
  switch (type) {
    case UPDATE: {
      const { allBalanceData, networkId, address } = payload
      return {
        ...state,
        [networkId]: {
          ...(safeAccess(state, [networkId]) || {}),
          [address]: {
            ...(safeAccess(state, [networkId, address]) || {}),
            allBalanceData
          }
        }
      }
    }
    default: {
      throw Error(`Unexpected action type in BalancesContext reducer: '${type}'.`)
    }
  }
}

export default function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, {})

  const update = useCallback((allBalanceData, networkId, address) => {
    dispatch({ type: UPDATE, payload: { allBalanceData, networkId, address } })
  }, [])

  return (
    <AllBalancesContext.Provider value={useMemo(() => [state, { update }], [state, update])}>
      {children}
    </AllBalancesContext.Provider>
  )
}

export function useFetchAllBalances() {
  const { account, networkId, library } = useWeb3Context()

  const ethPrice = useUSDPrice()

  const allTokens = useAllTokenDetails()

  const [state, { update }] = useAllBalancesContext()

  const { allBalanceData } = safeAccess(state, [networkId, account]) || {}

  const getData = async () => {
    if (!!account && !!ethPrice && library) {
      let mounted = true
      const newBalances = {}
      await Promise.all(
        Object.keys(allTokens).map(async k => {
          if (isAddress(k) || k === 'ETH') {
            let balance = 0
            let usdPrice = 0
            let decimal = 2 // default for ETH
            if (k === 'ETH') {
              balance = await getEtherBalance(account, library)
              usdPrice = ethPrice
            } else {
              balance = await getTokenBalance(k, account, library).catch(() => undefined)
              //get decimal now so we don't have to again for every format
              decimal = await getTokenDecimals(k, library).catch(() => undefined)
              //only get values for tokens with positive balances
              if (balance !== '0x00' && !!balance) {
                let tokenReserves = await getTokenReserves(k, library).catch(() => undefined)
                if (tokenReserves) {
                  let marketDetails = await getMarketDetails(tokenReserves)
                  if (marketDetails) {
                    //check for rate because some return invalid
                    let rate = marketDetails.marketRate.rate
                    if (!isNaN(rate)) {
                      usdPrice = rate.multipliedBy(ethPrice)
                    }
                  }
                }
              }
            }
            return (newBalances[k] = {
              balance: balance,
              decimal: decimal,
              usdPrice: usdPrice
            })
          }
        })
      )
      if (mounted) {
        update(newBalances, networkId, account)
      }
      const cleanup = () => {
        mounted = false
      }
      return cleanup
    }
  }

  useMemo(getData, [ethPrice, account])

  return allBalanceData
}
