import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import React from 'react'
import BigNumber from 'bignumber.js'
import { useWeb3React } from '@web3-react/core'
import bep20Abi from './bep20abi.json';
import { BIG_INT_ZERO } from 'constants/misc';
import { useActiveWeb3React } from 'hooks/web3'
import {  Currency, CurrencyAmount,  Token, WETH9 } from '@uniswap/sdk-core'
import { Price } from '@uniswap/sdk-core'
import { binanceTokens } from './binance.tokens'
import IuniswapV2PairABI from './pairInterface.json'
import _ from 'lodash';
import { useMultipleContractSingleData } from 'state/multicall/hooks'
import { Interface } from '@ethersproject/abi'
import { Pair } from '@uniswap/v2-sdk'
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
          new Pair( CurrencyAmount.fromRawAmount(token0, reserve0.toString()),  CurrencyAmount.fromRawAmount(token1, reserve1.toString())),
        ]
      })
    }, [results, tokens])
  }

/**
 * Returns the price in BUSD of the input currency
 * @param currency currency to compute the BUSD price of
 */
 export default function useBUSDPrice(currency?: Currency): Price<any, any> | undefined {
    const { chainId } = useActiveWeb3React()
    const wrapped = wrappedCurrency(currency, chainId)
    const tokenPairs: [Currency | undefined, Currency | undefined][] = React.useMemo(
      () => [
        [chainId && wrapped && _.isEqual(WBNB, wrapped) ? undefined : currency, chainId ? WBNB : undefined],
        [wrapped?.equals(BUSD_MAINNET) ? undefined : wrapped, chainId === 56 ? BUSD_MAINNET : undefined],
        [chainId ? WBNB : undefined, chainId === 56 ? BUSD_MAINNET : undefined],
      ],
      [chainId, currency, wrapped],
    )
    const [[ethPairState, ethPair], [busdPairState, busdPair], [busdEthPairState, busdEthPair]] = usePairs(tokenPairs)
  
    return React.useMemo(() => {
      if (!currency || !wrapped || !chainId) {
        return undefined
      }
      // handle weth/eth
      if (wrapped.equals(WBNB)) {
        if (busdPair) {
          const price = busdPair.priceOf(WBNB)
          return new Price(currency, BUSD_MAINNET, price.denominator, price.numerator)
        }
        return undefined
      }
      // handle busd
      if (wrapped.equals(BUSD_MAINNET)) {
        return new Price(BUSD_MAINNET, BUSD_MAINNET, '1', '1')
      }
  
      const ethPairETHAmount = ethPair?.reserveOf(WBNB)
      const ethPairETHBUSDValue: any =
        ethPairETHAmount && busdEthPair ? busdEthPair.priceOf(WBNB).quote(ethPairETHAmount).toFixed(0) : BigInt(0)
  
      // all other tokens
      // first try the busd pair
      if (
        busdPairState === PairState.EXISTS &&
        busdPair &&
        busdPair.reserveOf(BUSD_MAINNET).greaterThan(ethPairETHBUSDValue)
      ) {
        const price = busdPair.priceOf(wrapped)
        return new Price(currency, BUSD_MAINNET, price.denominator, price.numerator)
      }
      if (ethPairState === PairState.EXISTS && ethPair && busdEthPairState === PairState.EXISTS && busdEthPair) {
        if (busdEthPair.reserveOf(BUSD_MAINNET).greaterThan('0') && ethPair.reserveOf(WBNB).greaterThan('0')) {
          const ethBusdPrice = busdEthPair.priceOf(BUSD_MAINNET)
          const currencyEthPrice = ethPair.priceOf(WBNB)
          const busdPrice = ethBusdPrice.multiply(currencyEthPrice).invert()
          return new Price(currency, BUSD_MAINNET, busdPrice.denominator, busdPrice.numerator)
        }
      }
  
      return undefined
    }, [chainId, currency, ethPair, ethPairState, busdEthPair, busdEthPairState, busdPair, busdPairState, wrapped])
  }
export const useBinanceTokenBalance = (tokenAddress: string) => {
    let interval:any = null;
    const { NOT_FETCHED, SUCCESS, FAILED } = FetchStatus
    const [balanceState, setBalanceState] = React.useState<UseTokenBalanceState>({
      balance: BigInt('0') as any,
      fetchStatus: NOT_FETCHED,
    })
    const { account, chainId } = useWeb3React()
  
    React.useEffect(() => {
      const fetchBalance = async () => {
        const contract = getBep20Contract(tokenAddress)
        try {
          const res = await contract.balanceOf(account)
          setBalanceState({ balance: +new BigNumber(res.toString()).toFixed(0) / 10 ** 9, fetchStatus: SUCCESS })
        } catch (e) {
          console.error(e)
          setBalanceState((prev) => ({
            ...prev,
            fetchStatus: FAILED,
          }))
        }
      }
  
      if (account && chainId && chainId === 56) {
        fetchBalance()
        if (null === interval) {
          interval = setInterval(() => fetchBalance(), 60000)
        }
      } 
      return () => {
        interval = null;
      }
    }, [account, chainId, tokenAddress])
    return balanceState
  }
  