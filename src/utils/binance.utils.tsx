import { Currency, CurrencyAmount, Token, WETH9 } from '@uniswap/sdk-core'
import { useEffect, useState } from 'react'

import { BIG_INT_ZERO } from 'constants/misc';
import BigNumber from 'bignumber.js'
import { Interface } from '@ethersproject/abi'
import IuniswapV2PairABI from './pairInterface.json'
import { Pair } from '@uniswap/v2-sdk'
import { Price } from '@uniswap/sdk-core'
import React from 'react'
import _ from 'lodash';
import bep20Abi from './bep20abi.json';
import { binanceTokens } from './binance.tokens'
import { ethers } from 'ethers'
import { isEqual } from 'lodash'
import moment from 'moment'
import { useActiveWeb3React } from 'hooks/web3'
import useInterval from 'hooks/useInterval'
import { useMultipleContractSingleData } from 'state/multicall/hooks'
import { useWeb3React } from '@web3-react/core'
const BUSD_MAINNET = binanceTokens.busd
const WBNB = binanceTokens.wbnb;
export function wrappedCurrency(currency: Currency | undefined, chainId: number | undefined): Token | undefined {
  return chainId && currency === WETH9[chainId] ? WETH9[chainId] : currency instanceof Token ? currency : undefined
}
const PAIR_INTERFACE = new Interface(IuniswapV2PairABI.abi)

export function wrappedCurrencyAmount(
  currencyAmount: any | undefined,
  chainId: any | undefined,
): any | undefined {
  const token = currencyAmount && chainId ? wrappedCurrency(currencyAmount.currency, chainId) : undefined
  return token && currencyAmount ? CurrencyAmount.fromRawAmount(token, currencyAmount.raw) : undefined
}

export function unwrappedToken(token: Token): Currency {
  if (token.equals(WETH9[token.chainId])) return WETH9[token.chainId]
  return token
}



export const simpleRpcProvider = new ethers.providers.StaticJsonRpcProvider('https://nodes.pancakeswap.com')

const getContract = (abi: any, address: string, signer?: ethers.Signer | ethers.providers.Provider) => {
  const signerOrProvider = signer ?? simpleRpcProvider
  return new ethers.Contract(address, abi, signerOrProvider)
}

export const getBep20Contract = (address: string, signer?: ethers.Signer | ethers.providers.Provider) => {
  return getContract(bep20Abi, address, signer)
}
type UseTokenBalanceState = {
  balance: number
  fetchStatus: FetchStatus
}

export enum FetchStatus {
  NOT_FETCHED = 'not-fetched',
  SUCCESS = 'success',
  FAILED = 'failed',
}


enum PairState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID,
}

export function usePairs(currencies: [Currency | undefined, Currency | undefined][]): [PairState, Pair | null][] {
  const { chainId } = useActiveWeb3React()

  const tokens = React.useMemo(
    () =>
      currencies.map(([currencyA, currencyB]) => [
        wrappedCurrency(currencyA, chainId),
        wrappedCurrency(currencyB, chainId),
      ]),
    [chainId, currencies],
  )

  const pairAddresses = React.useMemo(
    () =>
      tokens.map(([tokenA, tokenB]) => {
        return tokenA && tokenB && !tokenA.equals(tokenB) ? Pair.getAddress(tokenA, tokenB) : undefined
      }),
    [tokens],
  )

  const results = useMultipleContractSingleData(pairAddresses, PAIR_INTERFACE, 'getReserves')

  return React.useMemo(() => {
    return results.map((result, i) => {
      const { result: reserves, loading } = result
      const tokenA = tokens[i][0]
      const tokenB = tokens[i][1]

      if (loading) return [PairState.LOADING, null]
      if (!tokenA || !tokenB || tokenA.equals(tokenB)) return [PairState.INVALID, null]
      if (!reserves) return [PairState.NOT_EXISTS, null]
      const { reserve0, reserve1 } = reserves
      const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
      return [
        PairState.EXISTS,
        new Pair(CurrencyAmount.fromRawAmount(token0, reserve0.toString()), CurrencyAmount.fromRawAmount(token1, reserve1.toString())),
      ]
    })
  }, [results, tokens])
}


const TokenBalanceContext = React.createContext({ balance: 0, fetchStatus: 'not-fetched', setBalance: (balance: any) => { return } })

export const TokenBalanceContextProvider = ({ children }: { children: any }) => {
  const { NOT_FETCHED, SUCCESS, FAILED } = FetchStatus
  const { chainId } = useWeb3React()

  const [balance, setBalance] = React.useState({ fetchStatus: NOT_FETCHED, balance: BigInt('0') as any })
  return chainId && chainId === 1 ? <>{children}</> : (
    <TokenBalanceContext.Provider value={{ balance: balance.balance, fetchStatus: balance?.fetchStatus, setBalance: (b: any) => setBalance(b) }}>
      {children}
    </TokenBalanceContext.Provider>

  )
}

export const useTokenBalanceContext = () => {
  const context = React.useContext(TokenBalanceContext)
  return context
}

export const useBinanceTokenBalanceRefreshed = (tokenAddress: string, account?: string | null, chainId?: number) => {
  const { NOT_FETCHED, SUCCESS, FAILED } = FetchStatus
  const { balance, fetchStatus, setBalance } = useTokenBalanceContext()
  React.useEffect(() => {
    const fetchBalance = async () => {
      const contract = getBep20Contract(tokenAddress)
      try {
        console.dir(contract)
        const res = await contract.balanceOf(account)
        const decimals = await contract.decimals();
        setBalance({ balance: +new BigNumber(res.toString()).toFixed(0) / 10 ** decimals, fetchStatus: SUCCESS })
      } catch (e) {
        console.error(e)
        setBalance((prev: any) => ({
          ...prev,
          fetchStatus: FAILED,
        }))
      }
    }
    if (account && chainId && chainId === 56) {
      fetchBalance()
    }
  }, [account, chainId, tokenAddress])

  return {
    balance,
    fetchStatus
  }
}


export const useBinanceTokenBalance = (tokenAddress: string, account?: string | null, chainId?: number) => {
  const { NOT_FETCHED, SUCCESS, FAILED } = FetchStatus
  const previousStoredAccountKey = React.useMemo(() => 'previous_binance_' + account, [account])
  const previousBalance = React.useMemo(() => localStorage.getItem(previousStoredAccountKey), [previousStoredAccountKey]);

  const [balanceState, setBalanceState] = React.useState<UseTokenBalanceState>({
    balance: previousBalance ? +previousBalance : BigInt('0') as any,
    fetchStatus: NOT_FETCHED,
  })
  const fetchBalance = React.useCallback(async () => {
      const contract = getBep20Contract(tokenAddress)
      try {
        const res = await contract.balanceOf(account)
        const decimals = await contract.decimals();
        if (!isEqual(+new BigNumber(res.toString()).toFixed(0) / 10 ** decimals, balanceState.balance)) {
          console.log(`Time since last refresh: ${moment(new Date()).diff(lastRefresh, 'seconds')} seconds`);
          setBalanceState({ balance: +new BigNumber(res.toString()).toFixed(0) / 10 ** decimals, fetchStatus: SUCCESS })
          console.log(`updated ${+new BigNumber(res.toString()).toFixed(0) / 10 ** decimals} current ${balanceState.balance}`)
          localStorage.setItem(previousStoredAccountKey, (+new BigNumber(res.toString()).toFixed(0) / 10 ** decimals).toString());
        }
      } catch (e) {
        console.error(e)
        setBalanceState((prev) => ({
          ...prev,
          fetchStatus: FAILED,
        }))
      }
    }, [tokenAddress, chainId, account, balanceState, getBep20Contract(tokenAddress)])

  const [lastRefresh, setLastRefresh ] = React.useState<Date>(new Date())
  useInterval(() => {
    if (account && chainId && chainId === 56) {
      setLastRefresh(new Date())
      fetchBalance()
    }
  }, 10000, true)
  return React.useMemo(() => balanceState, [balanceState])
}