import { BigintIsh, Token, TokenAmount, WETH } from '@uniswap/sdk'
import { BigNumber } from 'ethers/utils'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'

import { useWeb3React } from '../hooks'
import { getTokenAllowance, isAddress } from '../utils'
import { useBlockNumber } from './Application'

const UPDATE = 'UPDATE'

interface AllowancesState {
  [chainId: number]: {
    [address: string]: {
      [tokenAddress: string]: {
        [spenderAddress: string]: {
          value: BigintIsh
          blockNumber: BigNumber
        }
      }
    }
  }
}

const AllowancesContext = createContext<[AllowancesState, any]>([{}, {}])

function useAllowancesContext() {
  return useContext(AllowancesContext)
}

function reducer(state, { type, payload }) {
  switch (type) {
    case UPDATE: {
      const { networkId, address, tokenAddress, spenderAddress, value, blockNumber } = payload
      return {
        ...state,
        [networkId]: {
          ...state?.[networkId],
          [address]: {
            ...state?.[networkId]?.[address],
            [tokenAddress]: {
              ...state?.[networkId]?.[address]?.[tokenAddress],
              [spenderAddress]: {
                value,
                blockNumber
              }
            }
          }
        }
      }
    }
    default:
      throw Error(`Unexpected action type in AllowancesContext reducer: '${type}'.`)
  }
}

export default function Provider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {})

  const update = useCallback((networkId, address, tokenAddress, spenderAddress, value, blockNumber) => {
    dispatch({ type: UPDATE, payload: { networkId, address, tokenAddress, spenderAddress, value, blockNumber } })
  }, [])

  return (
    <AllowancesContext.Provider value={useMemo(() => [state, { update }], [state, update])}>
      {children}
    </AllowancesContext.Provider>
  )
}

export function useAddressAllowance(address: string, token: Token, spenderAddress: string): TokenAmount {
  const { library, chainId } = useWeb3React()

  const globalBlockNumber = useBlockNumber()

  const [state, { update }] = useAllowancesContext()
  const { value, blockNumber } = state?.[chainId]?.[address]?.[token?.address]?.[spenderAddress] ?? {}

  useEffect(() => {
    if (
      isAddress(address) &&
      isAddress(token?.address) &&
      isAddress(token?.address) !== WETH[chainId].address &&
      isAddress(spenderAddress) &&
      (value === undefined || blockNumber !== globalBlockNumber) &&
      (chainId || chainId === 0) &&
      library
    ) {
      let stale = false

      getTokenAllowance(address, token?.address, spenderAddress, library)
        .then(value => {
          if (!stale) {
            update(chainId, address, token?.address, spenderAddress, value, globalBlockNumber)
          }
        })
        .catch(() => {
          if (!stale) {
            update(chainId, address, token?.address, spenderAddress, null, globalBlockNumber)
          }
        })

      return () => {
        stale = true
      }
    }
  }, [address, token, spenderAddress, value, blockNumber, globalBlockNumber, chainId, library, update])

  return value ? new TokenAmount(token, value) : null
}
