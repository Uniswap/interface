import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'

import { useWeb3React } from '../hooks'
import {
  getTokenDecimals,
  getTokenExchangeAddressFromFactory,
  getTokenName,
  getTokenSymbol,
  isAddress,
  safeAccess
} from '../utils'

import { BigNumber } from 'ethers/utils'

export const NAME = 'name'
export const SYMBOL = 'symbol'
export const DECIMALS = 'decimals'
export const PRICE_DECIMALS = 'priceDecimals'
export const EXCHANGE_ADDRESS = 'exchangeAddress'
export const MIN_ORDER = 'minOrder' // in the native currency
export const PRIMARY = 'primary'
export const PRIMARY_DECIMALS = 'primaryDecimals'
export const SECONDARY = 'secondary'
export const SECONDARY_DECIMALS = 'secondaryDecimals'

const UPDATE = 'UPDATE'

export const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
export const ETH_ADDRESS = 'ETH'
export const DMG_ADDRESS = '0xEd91879919B71bB6905f23af0A68d231EcF87b14'
export const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
export const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'

const _0 = new BigNumber(0)

const ETH = {
  ETH: {
    [NAME]: 'Ethereum',
    [SYMBOL]: 'ETH',
    [DECIMALS]: 18,
    [EXCHANGE_ADDRESS]: null,
  }
}

export const DELEGATE_ADDRESS = '0xE2466deB9536A69BF8131Ecd0c267EE41dd1cdA0'

export const INITIAL_TOKENS_CONTEXT = {
  1: {
    [DAI_ADDRESS]: {
      [NAME]: 'Dai Stablecoin',
      [SYMBOL]: 'DAI',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x2a1530C4C41db0B0b2bB646CB5Eb1A67b7158667',
      [MIN_ORDER]: new BigNumber('100000000000000000000'),
      // [MIN_ORDER]: _0,
    },
    [USDC_ADDRESS]: {
      [NAME]: 'USD//C',
      [SYMBOL]: 'USDC',
      [DECIMALS]: 6,
      [EXCHANGE_ADDRESS]: '0x97deC872013f6B5fB443861090ad931542878126',
      [MIN_ORDER]: new BigNumber('100000000'),
      // [MIN_ORDER]: _0,
    },
    [WETH_ADDRESS]: {
      [NAME]: 'Wrapped Ether',
      [SYMBOL]: 'WETH',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xA2881A90Bf33F03E7a3f803765Cd2ED5c8928dFb',
      [MIN_ORDER]: new BigNumber('500000000000000000'),
      // [MIN_ORDER]: _0,
    },
    [DMG_ADDRESS]: {
      [NAME]: 'DMM Governance',
      [SYMBOL]: 'DMG',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xA539BAaa3aCA455c986bB1E25301CEF936CE1B65',
      [MIN_ORDER]: new BigNumber('10000000000000000000'),
      // [MIN_ORDER]: _0,
    }
  }
}

export const MARKETS = {
  1: {
    [`${DMG_ADDRESS}-${DAI_ADDRESS}`]: {
      [PRIMARY]: DMG_ADDRESS,
      [SECONDARY]: DAI_ADDRESS,
      [PRIMARY_DECIMALS]: 2,
      [SECONDARY_DECIMALS]: 8
    },
    [`${DMG_ADDRESS}-${USDC_ADDRESS}`]: {
      [PRIMARY]: DMG_ADDRESS,
      [SECONDARY]: USDC_ADDRESS,
      [PRIMARY_DECIMALS]: 2,
      [SECONDARY_DECIMALS]: 6
    },
    [`${DMG_ADDRESS}-${WETH_ADDRESS}`]: {
      [PRIMARY]: DMG_ADDRESS,
      [SECONDARY]: WETH_ADDRESS,
      [PRIMARY_DECIMALS]: 1,
      [SECONDARY_DECIMALS]: 8
    }
  }
}

const TokensContext = createContext()

function useTokensContext() {
  return useContext(TokensContext)
}

function reducer(state, { type, payload }) {
  switch (type) {
    case UPDATE: {
      const { networkId, tokenAddress, name, symbol, decimals, exchangeAddress } = payload
      return {
        ...state,
        [networkId]: {
          ...(safeAccess(state, [networkId]) || {}),
          [tokenAddress]: {
            [NAME]: name,
            [SYMBOL]: symbol,
            [DECIMALS]: decimals,
            [EXCHANGE_ADDRESS]: exchangeAddress
          }
        }
      }
    }
    default: {
      throw Error(`Unexpected action type in TokensContext reducer: '${type}'.`)
    }
  }
}

export default function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_TOKENS_CONTEXT)

  const update = useCallback((networkId, tokenAddress, name, symbol, decimals, exchangeAddress) => {
    dispatch({ type: UPDATE, payload: { networkId, tokenAddress, name, symbol, decimals, exchangeAddress } })
  }, [])

  return (
    <TokensContext.Provider value={useMemo(() => [state, { update }], [state, update])}>
      {children}
    </TokensContext.Provider>
  )
}

export function useTokenDetails(tokenAddress) {
  const { library, chainId } = useWeb3React()

  const [state, { update }] = useTokensContext()
  const allTokensInNetwork = { ...ETH, ...(safeAccess(state, [chainId]) || {}) }
  const { [NAME]: name, [SYMBOL]: symbol, [DECIMALS]: decimals, [EXCHANGE_ADDRESS]: exchangeAddress } =
    safeAccess(allTokensInNetwork, [tokenAddress]) || {}

  useEffect(() => {
    if (
      isAddress(tokenAddress) &&
      (name === undefined || symbol === undefined || decimals === undefined || exchangeAddress === undefined) &&
      (chainId || chainId === 0) &&
      library
    ) {
      let stale = false
      const namePromise = getTokenName(tokenAddress, library).catch(() => null)
      const symbolPromise = getTokenSymbol(tokenAddress, library).catch(() => null)
      const decimalsPromise = getTokenDecimals(tokenAddress, library).catch(() => null)
      const exchangeAddressPromise = getTokenExchangeAddressFromFactory(tokenAddress, chainId, library).catch(
        () => null
      )

      Promise.all([namePromise, symbolPromise, decimalsPromise, exchangeAddressPromise]).then(
        ([resolvedName, resolvedSymbol, resolvedDecimals, resolvedExchangeAddress]) => {
          if (!stale) {
            update(chainId, tokenAddress, resolvedName, resolvedSymbol, resolvedDecimals, resolvedExchangeAddress)
          }
        }
      )
      return () => {
        stale = true
      }
    }
  }, [tokenAddress, name, symbol, decimals, exchangeAddress, chainId, library, update])

  return { name, symbol, decimals, exchangeAddress }
}

export function useAllTokenDetails() {
  const { chainId } = useWeb3React()

  const [state] = useTokensContext()

  return useMemo(() => ({ ...ETH, ...(safeAccess(state, [chainId]) || {}) }), [state, chainId])
}
