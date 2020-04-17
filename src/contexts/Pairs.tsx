import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect, useState } from 'react'
import { useAddressBalance } from './Balances'
import { useWeb3React, usePairContract } from '../hooks'
import { INITIAL_TOKENS_CONTEXT } from './Tokens'
import { ChainId, WETH, Token, TokenAmount, Pair, JSBI } from '@uniswap/sdk'

const ADDRESSES_KEY = 'ADDRESSES_KEY'
const ENTITIES_KEY = 'ENTITIES_KEY'

const UPDATE = 'UPDATE'
const UPDATE_PAIR_ENTITY = 'UPDATE_PAIR_ENTITY'

const ALL_PAIRS: [Token, Token][] = [
  [
    INITIAL_TOKENS_CONTEXT[ChainId.RINKEBY][WETH[ChainId.RINKEBY].address],
    INITIAL_TOKENS_CONTEXT[ChainId.RINKEBY]['0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735'] //dai
  ],
  [
    INITIAL_TOKENS_CONTEXT[ChainId.RINKEBY]['0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735'], // dai
    INITIAL_TOKENS_CONTEXT[ChainId.RINKEBY]['0x8ab15C890E5C03B5F240f2D146e3DF54bEf3Df44'] // mkr
  ]
]

const PAIR_MAP: {
  [chainId: number]: { [token0Address: string]: { [token1Address: string]: string } }
} = ALL_PAIRS.reduce((pairMap, [tokenA, tokenB]) => {
  const tokens: [Token, Token] = tokenA?.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
  // ensure exchanges are unique
  if (pairMap?.[tokens[0].chainId]?.[tokens[0].address]?.[tokens[1].address]?.address !== undefined)
    throw Error(`Duplicate exchange: ${tokenA} ${tokenB}`)
  return {
    ...pairMap,
    [tokens[0].chainId]: {
      ...pairMap?.[tokens[0].chainId],
      [ADDRESSES_KEY]: {
        ...pairMap?.[tokens[0].chainId]?.[ADDRESSES_KEY],
        [tokens[0].address]: {
          ...pairMap?.[tokens[0].chainId]?.[ADDRESSES_KEY]?.[tokens[0].address],
          [tokens[1].address]: Pair.getAddress(...tokens)
        }
      },
      [ENTITIES_KEY]: {}
    }
  }
}, {})

const PairContext = createContext([])

function usePairContext() {
  return useContext(PairContext)
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
          [ADDRESSES_KEY]: {
            ...state?.[tokensSorted[0].chainId]?.[ADDRESSES_KEY],
            [tokensSorted[0].address]: {
              ...state?.[tokensSorted[0].chainId]?.[ADDRESSES_KEY]?.[tokensSorted[0].address],
              [tokensSorted[1].address]: Pair.getAddress(tokensSorted[0], tokensSorted[1])
            }
          }
        }
      }
    }
    case UPDATE_PAIR_ENTITY: {
      const { pairAddress, pair, chainId } = payload
      return {
        ...state,
        [chainId]: {
          ...state?.[chainId],
          [ENTITIES_KEY]: {
            ...state?.[chainId]?.[ENTITIES_KEY],
            [pairAddress]: pair
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
  const [state, dispatch] = useReducer(reducer, PAIR_MAP)

  const update = useCallback((chainId, tokens) => {
    dispatch({ type: UPDATE, payload: { chainId, tokens } })
  }, [])

  const updatePairEntity = useCallback((pairAddress, pair, chainId) => {
    dispatch({ type: UPDATE_PAIR_ENTITY, payload: { pairAddress, pair, chainId } })
  }, [])

  return (
    <PairContext.Provider
      value={useMemo(() => [state, { update, updatePairEntity }], [state, update, updatePairEntity])}
    >
      {children}
    </PairContext.Provider>
  )
}

export function usePairAddress(tokenA?: Token, tokenB?: Token): string | undefined {
  const { chainId } = useWeb3React()
  const [state, { update }] = usePairContext()

  const tokens: [Token, Token] = tokenA && tokenB && tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]

  const address = state?.[chainId]?.[ADDRESSES_KEY]?.[tokens[0]?.address]?.[tokens[1]?.address]

  useEffect(() => {
    if (address === undefined && tokenA && tokenB) {
      const pairAddress = Pair.getAddress(...tokens)
      pairAddress && update(chainId, tokens)
    }
  }, [chainId, address, tokenA, tokenB, tokens, update])

  return address
}

export function usePair(tokenA?: Token, tokenB?: Token): Pair | undefined {
  const { chainId } = useWeb3React()
  const [state, { updatePairEntity }] = usePairContext()

  const address = usePairAddress(tokenA, tokenB)
  const pair = state?.[chainId]?.[ENTITIES_KEY]?.[address]

  const tokenAmountA = useAddressBalance(address, tokenA)
  const tokenAmountB = useAddressBalance(address, tokenB)

  useEffect(() => {
    if (!pair && tokenAmountA && tokenAmountB) {
      updatePairEntity(address, new Pair(tokenAmountA, tokenAmountB), chainId)
    }
  }, [pair, tokenAmountA, tokenAmountB, address, updatePairEntity, chainId])

  return pair
}

export function useAllPairs() {
  const { chainId } = useWeb3React()
  const [state] = usePairContext()

  const allPairDetails = state?.[chainId]?.[ADDRESSES_KEY]

  const allPairs = useMemo(() => {
    if (!allPairDetails) {
      return {}
    }
    const formattedExchanges = {}
    Object.keys(allPairDetails).map(token0Address => {
      return Object.keys(allPairDetails[token0Address]).map(token1Address => {
        const pairAddress = allPairDetails[token0Address][token1Address]
        if (pairAddress) {
          return (formattedExchanges[pairAddress] = {
            token0: token0Address,
            token1: token1Address
          })
        } else {
          return null
        }
      })
    })
    return formattedExchanges
  }, [allPairDetails])

  return useMemo(() => {
    return allPairs || {}
  }, [allPairs])
}

export function useTotalSupply(tokenA?: Token, tokenB?: Token) {
  const { library } = useWeb3React()

  const pair = usePair(tokenA, tokenB)

  const [totalPoolTokens, setTotalPoolTokens] = useState<TokenAmount>()

  const pairContract = usePairContract(pair?.liquidityToken.address)

  const fetchPoolTokens = useCallback(async () => {
    !!pairContract &&
      pairContract
        .deployed()
        .then(() => {
          if (pairContract) {
            pairContract.totalSupply().then(totalSupply => {
              if (totalSupply !== undefined && pair?.liquidityToken?.decimals) {
                const supplyFormatted = JSBI.BigInt(totalSupply)
                const tokenSupplyFormatted = new TokenAmount(pair?.liquidityToken, supplyFormatted)
                setTotalPoolTokens(tokenSupplyFormatted)
              }
            })
          }
        })
        .catch(() => {})
  }, [pairContract, pair])

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
