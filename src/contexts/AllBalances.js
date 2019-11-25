import React, { createContext, useContext, useReducer, useMemo, useCallback } from 'react'
import { ethers } from 'ethers'
import { getTokenReserves, getMarketDetails, BigNumber } from '@uniswap/sdk'

import { useWeb3React } from '../hooks'
import { safeAccess, isAddress, getEtherBalance, getTokenBalance } from '../utils'
import { useAllTokenDetails } from './Tokens'

const ZERO = ethers.utils.bigNumberify(0)
const ONE = new BigNumber(1)

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
      throw Error(`Unexpected action type in AllBalancesContext reducer: '${type}'.`)
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
  const { library, chainId, account } = useWeb3React()

  const allTokens = useAllTokenDetails()

  const [state, { update }] = useAllBalancesContext()

  const { allBalanceData } = safeAccess(state, [chainId, account]) || {}

  const getData = async () => {
    if (!!library && !!account) {
      const newBalances = {}
      await Promise.all(
        Object.keys(allTokens).map(async k => {
          let balance = null
          let ethRate = null
          if (isAddress(k) || k === 'ETH') {
            if (k === 'ETH') {
              balance = await getEtherBalance(account, library).catch(() => null)
              ethRate = ONE
            } else {
              balance = await getTokenBalance(k, account, library).catch(() => null)
              // only get values for tokens with positive balances
              if (!!balance && balance.gt(ZERO)) {
                const tokenReserves = await getTokenReserves(k, library).catch(() => null)
                if (!!tokenReserves) {
                  const marketDetails = getMarketDetails(tokenReserves)
                  if (marketDetails.marketRate && marketDetails.marketRate.rate) {
                    ethRate = marketDetails.marketRate.rate
                  }
                }
              }
            }

            return (newBalances[k] = { balance, ethRate })
          }
        })
      )
      update(newBalances, chainId, account)
    }
  }

  useMemo(getData, [account])

  return allBalanceData
}
