import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect, useRef } from 'react'

import { useWeb3React } from '../hooks'
import { safeAccess, isAddress, getEtherBalance, getTokenBalance } from '../utils'
import { useBlockNumber } from './Application'
import { useTokenDetails, useAllTokenDetails } from './Tokens'
import { getUSDPrice } from '../utils/price'
import { BigNumber } from '@uniswap/sdk'

const UPDATE = 'UPDATE'
const UPDATE_ALL_FOR_ACCOUNT = 'UPDATE_ALL_FOR_ACCOUNT'
const UPDATE_ALL_FOR_EXCHANGES = 'UPDATE_ALL_FOR_EXCHANGES'
const UPDATE_USD_PRICE = 'UPDATE_USD_PRICE'
const USD_PRICE = 'USD_PRICE'

const BalancesContext = createContext()

function useBalancesContext() {
  return useContext(BalancesContext)
}

function reducer(state, { type, payload }) {
  switch (type) {
    case UPDATE: {
      const { networkId, address, tokenAddress, value, blockNumber } = payload
      return {
        ...state,
        [networkId]: {
          ...(safeAccess(state, [networkId]) || {}),
          [address]: {
            ...(safeAccess(state, [networkId, address]) || {}),
            [tokenAddress]: {
              value,
              blockNumber
            }
          }
        }
      }
    }
    case UPDATE_ALL_FOR_ACCOUNT: {
      const { networkId, address, tokenAddresses, values } = payload
      return {
        ...state,
        [networkId]: {
          ...(safeAccess(state, [networkId]) || {}),
          [address]: {
            ...tokenAddresses.reduce((accumulator, currentValue, i) => {
              accumulator[currentValue] = { value: values[i] }
              return accumulator
            }, {}),
            ...(safeAccess(state, [networkId, address]) || {})
          }
        }
      }
    }
    case UPDATE_ALL_FOR_EXCHANGES: {
      const { networkId, exchangeAddresses, tokenAddresses, values } = payload
      return {
        ...state,
        [networkId]: {
          ...(safeAccess(state, [networkId]) || {}),
          ...exchangeAddresses.reduce((accumulator, currentValue, i) => {
            accumulator[currentValue] = {
              ...safeAccess(state, [networkId, currentValue]),
              [tokenAddresses[i]]: {
                value: values[i]
              }
            }
            return accumulator
          }, {})
        }
      }
    }
    case UPDATE_USD_PRICE: {
      const { networkId, USDPrice } = payload
      return {
        ...state,
        [USD_PRICE]: {
          ...(safeAccess(state, [USD_PRICE]) || {}),
          [networkId]: USDPrice
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

  const update = useCallback((networkId, address, tokenAddress, value, blockNumber) => {
    dispatch({ type: UPDATE, payload: { networkId, address, tokenAddress, value, blockNumber } })
  }, [])

  const updateAllForAccount = useCallback((networkId, address, tokenAddresses, values) => {
    dispatch({ type: UPDATE_ALL_FOR_ACCOUNT, payload: { networkId, address, tokenAddresses, values } })
  }, [])

  const updateAllForExchanges = useCallback((networkId, exchangeAddresses, tokenAddresses, values) => {
    dispatch({ type: UPDATE_ALL_FOR_EXCHANGES, payload: { networkId, exchangeAddresses, tokenAddresses, values } })
  }, [])

  const updateUSDPrice = useCallback((networkId, USDPrice) => {
    dispatch({ type: UPDATE_USD_PRICE, payload: { networkId, USDPrice } })
  }, [])

  return (
    <BalancesContext.Provider
      value={useMemo(() => [state, { update, updateAllForAccount, updateAllForExchanges, updateUSDPrice }], [
        state,
        update,
        updateAllForAccount,
        updateAllForExchanges,
        updateUSDPrice
      ])}
    >
      {children}
    </BalancesContext.Provider>
  )
}

export function Updater() {
  const { library, chainId, account } = useWeb3React()

  const allTokens = useAllTokenDetails()

  const [state, { updateAllForAccount, updateAllForExchanges }] = useBalancesContext()
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    const getData = async () => {
      if (chainId && library && account) {
        // get 1 eth + all token balances for the account
        Promise.all(
          Object.keys(allTokens).map(async tokenAddress => {
            await new Promise(resolve => {
              setTimeout(resolve, 5000 * Math.random())
            })

            const { value: existingValue } = safeAccess(stateRef.current, [chainId, account, tokenAddress]) || {}

            return await (existingValue ||
              (tokenAddress === 'ETH'
                ? getEtherBalance(account, library).catch(() => null)
                : getTokenBalance(tokenAddress, account, library).catch(() => null)))
          })
        ).then(balances => {
          updateAllForAccount(chainId, account, Object.keys(allTokens), balances)
        })

        const allTokensWithAnExchange = Object.keys(allTokens).filter(tokenAddress => tokenAddress !== 'ETH')
        // get all eth balances for all exchanges
        Promise.all(
          allTokensWithAnExchange.map(async tokenAddress => {
            const exchangeAddress = allTokens[tokenAddress].exchangeAddress
            await new Promise(resolve => {
              setTimeout(resolve, 5000 * Math.random())
            })

            const { value: existingValue } = safeAccess(stateRef.current, [chainId, exchangeAddress, 'ETH']) || {}
            return await (existingValue || getEtherBalance(exchangeAddress, library).catch(() => null))
          })
        ).then(ethBalances => {
          updateAllForExchanges(
            chainId,
            allTokensWithAnExchange.map(tokenAddress => allTokens[tokenAddress].exchangeAddress),
            Array(allTokensWithAnExchange.length).fill('ETH'),
            ethBalances
          )
        })

        // get all token balances for all exchanges
        Promise.all(
          allTokensWithAnExchange.map(async tokenAddress => {
            const exchangeAddress = allTokens[tokenAddress].exchangeAddress
            await new Promise(resolve => {
              setTimeout(resolve, 5000 * Math.random())
            })

            const { value: existingValue } =
              safeAccess(stateRef.current, [chainId, exchangeAddress, tokenAddress]) || {}
            return await (existingValue || getTokenBalance(tokenAddress, exchangeAddress, library).catch(() => null))
          })
        ).then(tokenBalances => {
          updateAllForExchanges(
            chainId,
            allTokensWithAnExchange.map(tokenAddress => allTokens[tokenAddress].exchangeAddress),
            allTokensWithAnExchange.map(tokenAddress => tokenAddress),
            tokenBalances
          )
        })
      }
    }
    getData()
  }, [chainId, library, account, allTokens, updateAllForAccount, updateAllForExchanges])

  return null
}

export function useAllBalances() {
  const { chainId } = useWeb3React()
  const [state] = useBalancesContext()
  const balances = safeAccess(state, [chainId]) || {}
  return balances
}

export function useAddressBalance(address, tokenAddress) {
  const { library, chainId } = useWeb3React()

  const globalBlockNumber = useBlockNumber()

  const [state, { update }] = useBalancesContext()
  const { value, blockNumber } = safeAccess(state, [chainId, address, tokenAddress]) || {}

  useEffect(() => {
    if (
      isAddress(address) &&
      (tokenAddress === 'ETH' || isAddress(tokenAddress)) &&
      (value === undefined || blockNumber !== globalBlockNumber) &&
      (chainId || chainId === 0) &&
      library
    ) {
      let stale = false
      ;(tokenAddress === 'ETH' ? getEtherBalance(address, library) : getTokenBalance(tokenAddress, address, library))
        .then(value => {
          if (!stale) {
            update(chainId, address, tokenAddress, value, globalBlockNumber)
          }
        })
        .catch(() => {
          if (!stale) {
            update(chainId, address, tokenAddress, null, globalBlockNumber)
          }
        })
      return () => {
        stale = true
      }
    }
  }, [address, tokenAddress, value, blockNumber, globalBlockNumber, chainId, library, update])

  return value
}

export function useExchangeReserves(tokenAddress) {
  const { exchangeAddress } = useTokenDetails(tokenAddress)

  const reserveETH = useAddressBalance(exchangeAddress, 'ETH')
  const reserveToken = useAddressBalance(exchangeAddress, tokenAddress)

  return { reserveETH, reserveToken }
}

const buildReserveObject = (chainId, tokenAddress, exchangeAddress, ethReserveAmount, tokenReserveAmount, decimals) => {
  return {
    token: {
      chainId: chainId,
      address: tokenAddress,
      decimals: decimals
    },
    exchange: {
      chainId: chainId,
      address: exchangeAddress,
      decimals: decimals
    },
    ethReserve: {
      token: {
        chainId: chainId,
        address: 'ETH',
        decimals: 18
      },
      amount: ethReserveAmount
    },
    tokenReserve: {
      token: {
        chainId: chainId,
        address: tokenAddress,
        decimals: decimals
      },
      amount: tokenReserveAmount
    }
  }
}

export function useETHPriceInUSD() {
  const { chainId } = useWeb3React()

  const [, { updateUSDPrice }] = useBalancesContext()

  const daiTokenAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
  const daiExchangeAddress = '0x2a1530C4C41db0B0b2bB646CB5Eb1A67b7158667'
  let daiReserveETH = useAddressBalance(daiExchangeAddress, 'ETH')
  let daiReserveToken = useAddressBalance(daiExchangeAddress, daiTokenAddress)

  const usdcTokenAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  const usdcExchangeAddress = '0x97deC872013f6B5fB443861090ad931542878126'
  let usdcReserveETH = useAddressBalance(usdcExchangeAddress, 'ETH')
  let usdcReserveToken = useAddressBalance(usdcExchangeAddress, usdcTokenAddress)

  const tusdTokenAddress = '0x0000000000085d4780B73119b644AE5ecd22b376'
  const tusdExchangeAddress = '0x5048b9d01097498Fd72F3F14bC9Bc74A5aAc8fA7'
  let tusdReserveETH = useAddressBalance(tusdExchangeAddress, 'ETH')
  let tusdReserveToken = useAddressBalance(tusdExchangeAddress, tusdTokenAddress)

  useEffect(() => {
    if (daiReserveToken && daiReserveETH && usdcReserveToken && usdcReserveETH && tusdReserveToken && tusdReserveETH) {
      // // convert to js BigNumber
      let daiReserveETHFormatted = new BigNumber(daiReserveETH)
      let daiReserveTokenFormatted = new BigNumber(daiReserveToken)

      const daiReservesObject = buildReserveObject(
        chainId,
        daiTokenAddress,
        daiExchangeAddress,
        daiReserveETHFormatted,
        daiReserveTokenFormatted,
        18
      )

      // convert to js BigNumber
      let tusdReserveETHFormatted = new BigNumber(tusdReserveETH)
      let tusdReserveTokenFormatted = new BigNumber(tusdReserveToken)

      const tusdReservesObject = buildReserveObject(
        chainId,
        tusdTokenAddress,
        tusdExchangeAddress,
        tusdReserveETHFormatted,
        tusdReserveTokenFormatted,
        18
      )

      // convert to js BigNumber
      let usdcReserveETHFormatted = new BigNumber(usdcReserveETH)
      let usdcReserveTokenFormatted = new BigNumber(usdcReserveToken)

      const usdcReservesObject = buildReserveObject(
        chainId,
        usdcTokenAddress,
        usdcExchangeAddress,
        usdcReserveETHFormatted,
        usdcReserveTokenFormatted,
        6
      )

      const stablecoinReserves = [daiReservesObject, usdcReservesObject, tusdReservesObject]

      getUSDPrice(stablecoinReserves).then(([price]) => {
        updateUSDPrice(chainId, price[0])
      })
    }
  }, [
    daiReserveToken,
    daiReserveETH,
    usdcReserveToken,
    usdcReserveETH,
    tusdReserveToken,
    tusdReserveETH,
    updateUSDPrice,
    chainId
  ])

  const [state] = useBalancesContext()

  return safeAccess(state, [USD_PRICE, chainId])
}
