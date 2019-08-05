import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'
import { ethers } from 'ethers'
import { getTokenReserves, getMarketDetails, formatFixed } from '@uniswap/sdk'
import { useWeb3Context } from 'web3-react'

import { useUSDPrice } from '../hooks/price'
import { safeAccess, isAddress, getEtherBalance, getTokenBalance, amountFormatter, getTokenDecimals } from '../utils'
import { useAllTokenDetails } from './Tokens'

const UPDATE = 'UPDATE'

const AllBalancesContext = createContext()

const format = { decimalSeparator: '.', groupSeparator: ',', groupSize: 3 }

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

export function useFetchAllBalances(account) {
  const allTokens = useAllTokenDetails()

  const { library, networkId } = useWeb3Context()

  const [state, { update }] = useAllBalancesContext()

  const { allBalanceData } = safeAccess(state, [networkId, account]) || {}

  const provider = ethers.getDefaultProvider()

  const [ethPrice] = useUSDPrice(provider)

  const getData = () => {}

  useMemo(() => {
    if (account !== undefined && ethPrice !== undefined) {
      console.log('updating')
      let mounted = true
      ;(async () => {
        const newBalances = {}
        await Promise.all(
          Object.keys(allTokens).map(async k => {
            let balanceFormatted = 0
            let usdPriceOfToken = 0
            if (isAddress(k) || k === 'ETH') {
              let balance = 0
              if (k === 'ETH') {
                balance = await getEtherBalance(account, library)
                balanceFormatted = amountFormatter(balance)
                usdPriceOfToken =
                  ethPrice &&
                  formatFixed(ethPrice, {
                    decimalPlaces: 2,
                    dropTrailingZeros: false,
                    format
                  })
              } else {
                balance = await getTokenBalance(k, account, library).catch(() => null)
                let decimal = await getTokenDecimals(k, library).catch(() => null)
                balanceFormatted = !!(balance && Number.isInteger(decimal))
                  ? amountFormatter(balance, decimal, Math.min(4, decimal))
                  : 0
                if (provider && balanceFormatted > 0) {
                  let tokenReserves = await getTokenReserves(k, provider).catch(() => undefined)
                  if (tokenReserves) {
                    let marketDetails = await getMarketDetails(tokenReserves)
                    if (marketDetails && ethPrice) {
                      try {
                        usdPriceOfToken = formatFixed(marketDetails.marketRate.rate.multipliedBy(ethPrice), {
                          decimalPlaces: 2,
                          dropTrailingZeros: false,
                          format
                        })
                      } catch (error) {}
                    }
                  }
                }
              }
              return (newBalances[k] = {
                balance: balanceFormatted,
                usd: usdPriceOfToken
              })
            }
          })
        )
        if (mounted) {
          update(newBalances, networkId, account)
        }
      })()
      const cleanup = () => {
        mounted = false
      }
      return cleanup
    }
  }, [account, allTokens, ethPrice, library, networkId, provider, update])

  return allBalanceData
}
