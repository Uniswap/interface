import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'
import { useWeb3Context } from 'web3-react'

import { safeAccess, isAddress, getEtherBalance, getTokenBalance, amountFormatter, getTokenDecimals } from '../utils'
import { useAllTokenDetails } from './Tokens'

const UPDATE = 'UPDATE'

const AllBalancesContext = createContext()

function useAllBalancesContext() {
  return useContext(AllBalancesContext)
}

function reducer(state, { type, payload }) {
  switch (type) {
    case UPDATE: {
      const { networkId, address,  allBalanceData } = payload
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

  const update = useCallback((networkId, address, allBalanceData ) => {
    dispatch({ type: UPDATE, payload: { networkId, address, allBalanceData } })
  }, [])

  return (
    <AllBalancesContext.Provider value={useMemo(() => [state, { update }], [state, update])}>
      {children}
    </AllBalancesContext.Provider>
  )
}

export function useFetchAllBalances(account){
  
  const allTokens = useAllTokenDetails()
  
  const { library, networkId } = useWeb3Context()
  
  const [state, { update }] = useAllBalancesContext()
  const {allBalanceData} = safeAccess(state, [networkId, account]) || {}

  useEffect(() => {
    /**
     * how do setup this check to only run once or on change?
     */

    if (allBalanceData === undefined){
      console.log('updating')
      let mounted = true
      ;(async () => {
        const newBalances = {}
        await Promise.all(
          Object.keys(allTokens).map(async k => {
            let balanceFormatted = 0
            if (isAddress(k) || k === 'ETH') {
              let balance = 0
              if (k === 'ETH') {
                balance = await getEtherBalance(account, library)
                let balanceFormatted = amountFormatter(balance)
                return (newBalances[k] = balanceFormatted)
              } else {
                balance = await getTokenBalance(k, account, library).catch(() => null)
                let decimal = await getTokenDecimals(k, library).catch(() => null)
                balanceFormatted = !!(balance && Number.isInteger(decimal))
                  ? amountFormatter(balance, decimal, Math.min(4, decimal))
                  : 0
                return (newBalances[k] = balanceFormatted)
              }
            }
          })
        )
        if (mounted) update(networkId, account, newBalances)
      })()
      const cleanup = () => {
        mounted = false
      }
      return cleanup
    }
  }, [account, allBalanceData, allTokens, library, networkId, update])

  return allBalanceData
}