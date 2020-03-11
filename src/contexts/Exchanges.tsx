import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect, useState } from 'react'

import { useAddressBalance } from './Balances'
import { useWeb3React, useExchangeContract } from '../hooks'

import { INITIAL_TOKENS_CONTEXT } from './Tokens'
import { ChainId, WETH, Token, TokenAmount, Exchange, JSBI } from '@uniswap/sdk'

const UPDATE = 'UPDATE'

const ALL_EXCHANGES: [Token, Token][] = [
  // [
  //   INITIAL_TOKENS_CONTEXT[ChainId.RINKEBY][WETH[ChainId.RINKEBY].address],
  //   INITIAL_TOKENS_CONTEXT[ChainId.RINKEBY]['0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735']
  // ]
  // [
  //   INITIAL_TOKENS_CONTEXT[ChainId.RINKEBY]['0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735'],
  //   INITIAL_TOKENS_CONTEXT[ChainId.RINKEBY]['0x8ab15C890E5C03B5F240f2D146e3DF54bEf3Df44']
  // ]
]

const EXCHANGE_MAP: {
  [chainId: number]: { [token0Address: string]: { [token1Address: string]: string } }
} = ALL_EXCHANGES.reduce((exchangeMap, [tokenA, tokenB]) => {
  const tokens: [Token, Token] = tokenA?.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
  // ensure exchanges are unique
  if (exchangeMap?.[tokens[0].chainId]?.[tokens[0].address]?.[tokens[1].address] !== undefined)
    throw Error(`Duplicate exchange: ${tokenA} ${tokenB}`)

  return {
    ...exchangeMap,
    [tokens[0].chainId]: {
      ...exchangeMap?.[tokens[0].chainId],
      [tokens[0].address]: {
        ...exchangeMap?.[tokens[0].chainId]?.[tokens[0].address],
        [tokens[1].address]: Exchange.getAddress(...tokens)
      }
    }
  }
}, {})

const ExchangeContext = createContext([])

function useExchangesContext() {
  return useContext(ExchangeContext)
}

function reducer(state, { type, payload }) {
  switch (type) {
    case UPDATE: {
      const { tokens } = payload
      const tokensSorted: [Token, Token] = tokens[0].sortsBefore(tokens[1])
        ? [tokens[0], tokens[1]]
        : [tokens[1], tokens[0]]
      return {
        ...state,
        [tokensSorted[0].chainId]: {
          ...state?.[tokensSorted[0].chainId],
          [tokensSorted[0].address]: {
            ...state?.[tokensSorted[0].chainId]?.[tokensSorted[0].address],
            [tokensSorted[1].address]: Exchange.getAddress(tokensSorted[0], tokensSorted[1])
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
  const [state, dispatch] = useReducer(reducer, EXCHANGE_MAP)

  const update = useCallback((chainId, tokens) => {
    dispatch({ type: UPDATE, payload: { chainId, tokens } })
  }, [])

  return (
    <ExchangeContext.Provider value={useMemo(() => [state, { update }], [state, update])}>
      {children}
    </ExchangeContext.Provider>
  )
}

export function useExchangeAddress(tokenA?: Token, tokenB?: Token): string | undefined {
  const { chainId } = useWeb3React()
  const [state, { update }] = useExchangesContext()

  const tokens: [Token, Token] = tokenA && tokenB && tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]

  const address = state?.[chainId]?.[tokens[0]?.address]?.[tokens[1]?.address]

  useEffect(() => {
    if (address === undefined && tokenA && tokenB) {
      const exchangeAddress = Exchange.getAddress(...tokens)
      exchangeAddress && update(chainId, tokens)
    }
  }, [chainId, address, tokenA, tokenB, tokens, update])

  return address
}

export function useExchange(tokenA?: Token, tokenB?: Token): Exchange | undefined {
  const address = useExchangeAddress(tokenA, tokenB)

  const tokenAmountA = useAddressBalance(address, tokenA)
  const tokenAmountB = useAddressBalance(address, tokenB)

  const exchange = tokenAmountA && tokenAmountB && new Exchange(tokenAmountA, tokenAmountB)

  return exchange
}

export function useAllExchangesRaw() {
  const { chainId } = useWeb3React()
  const [state] = useExchangesContext()

  const allExchangeDetails = state?.[chainId]

  return allExchangeDetails
}

export function useAllExchanges() {
  const { chainId } = useWeb3React()
  const [state] = useExchangesContext()

  const allExchangeDetails = state?.[chainId]

  const allExchanges = useMemo(() => {
    if (!allExchangeDetails) {
      return {}
    }
    const formattedExchanges = {}
    Object.keys(allExchangeDetails).map(token0Address => {
      return Object.keys(allExchangeDetails[token0Address]).map(token1Address => {
        const exchangeAddress = allExchangeDetails[token0Address][token1Address]
        return (formattedExchanges[exchangeAddress] = {
          token0: token0Address,
          token1: token1Address
        })
      })
    })
    return formattedExchanges
  }, [allExchangeDetails])

  return useMemo(() => {
    return allExchanges || {}
  }, [allExchanges])
}

export function useTotalSupply(exchange: Exchange) {
  const { library } = useWeb3React()

  const [totalPoolTokens, setTotalPoolTokens] = useState<TokenAmount>()

  const exchangeContract = useExchangeContract(exchange?.liquidityToken.address)

  const fetchPoolTokens = useCallback(async () => {
    !!exchangeContract &&
      exchangeContract
        .deployed()
        .then(() => {
          if (exchangeContract) {
            exchangeContract.totalSupply().then(totalSupply => {
              if (totalSupply !== undefined && exchange?.liquidityToken?.decimals) {
                const supplyFormatted = JSBI.BigInt(totalSupply)
                const tokenSupplyFormatted = new TokenAmount(exchange?.liquidityToken, supplyFormatted)
                setTotalPoolTokens(tokenSupplyFormatted)
              }
            })
          }
        })
        .catch(e => {
          console.log(e)
        })
    /**
     * @todo
     * fix this
     */
  }, [exchangeContract])

  // on the block make sure we're updated
  useEffect(() => {
    fetchPoolTokens()
    library.on('block', fetchPoolTokens)
    return () => {
      library.removeListener('block', fetchPoolTokens)
    }
  }, [fetchPoolTokens, library])

  return totalPoolTokens
}
