import { parseBytes32String } from '@ethersproject/strings'
import { ChainId, Currency, NativeCurrency, Token } from '@kyberswap/ks-sdk-core'
import axios from 'axios'
import { arrayify } from 'ethers/lib/utils'
import { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import useSWR from 'swr'

import ERC20_INTERFACE, { ERC20_BYTES32_INTERFACE } from 'constants/abis/erc20'
import { KS_SETTING_API } from 'constants/env'
import { ZERO_ADDRESS } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks/index'
import { useBytes32TokenContract, useMulticallContract, useTokenContract } from 'hooks/useContract'
import { AppState } from 'state'
import { TokenAddressMap } from 'state/lists/reducer'
import { TokenInfo, WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { NEVER_RELOAD, useMultipleContractSingleData, useSingleCallResult } from 'state/multicall/hooks'
import { useUserAddedTokens } from 'state/user/hooks'
import { filterTruthy, isAddress } from 'utils'

import useDebounce from './useDebounce'

// reduce token map into standard address <-> Token mapping
function useTokensFromMap(tokenMap: TokenAddressMap, lowercaseAddress?: boolean): TokenMap {
  const { chainId } = useActiveWeb3React()
  const userAddedTokens = useUserAddedTokens()

  return useMemo(() => {
    if (!chainId) return {}

    const map = tokenMap[chainId] ?? {}

    // reduce to just tokens
    const mapWithoutUrls = lowercaseAddress
      ? Object.keys(map).reduce<TokenMap>((newMap, address) => {
          const key = address.toLowerCase()
          newMap[key] = map[address]
          return newMap
        }, {})
      : map

    if (userAddedTokens.length)
      return (
        (userAddedTokens as WrappedTokenInfo[])
          // reduce into all ALL_TOKENS filtered by the current chain
          .reduce<TokenMap>(
            (tokenMap, token) => {
              const key = lowercaseAddress ? token.address.toLowerCase() : token.address
              tokenMap[key] = token
              return tokenMap
            },
            // must make a copy because reduce modifies the map, and we do not
            // want to make a copy in every iteration
            { ...mapWithoutUrls },
          )
      )
    return mapWithoutUrls
  }, [chainId, userAddedTokens, tokenMap, lowercaseAddress])
}

export type TokenMap = { [address: string]: WrappedTokenInfo }

export function useAllTokens(lowercaseAddress = false): TokenMap {
  const mapWhitelistTokens = useSelector((state: AppState) => state.lists.mapWhitelistTokens)
  const allTokens = useDebounce(mapWhitelistTokens, 300)
  return useTokensFromMap(allTokens, lowercaseAddress)
}

export function useIsLoadedTokenDefault() {
  const defaultTokens = useAllTokens()
  const tokenImports: Token[] = useUserAddedTokens()
  return Object.keys(defaultTokens).length > tokenImports.length
}

// parse a name or symbol from a token response
const BYTES32_REGEX = /^0x[a-fA-F0-9]{64}$/

function parseStringOrBytes32(str: string | undefined, bytes32: string | undefined, defaultValue: string): string {
  return str && str.length > 0
    ? str
    : // need to check for proper bytes string and valid terminator
    bytes32 && BYTES32_REGEX.test(bytes32) && arrayify(bytes32)[31] === 0
    ? parseBytes32String(bytes32)
    : defaultValue
}

export const useTokens = (addresses: string[]): TokenMap => {
  const { chainId } = useActiveWeb3React()
  const tokens = useAllTokens()

  const knownTokens = useMemo(() => {
    return addresses
      .filter(address => address === ZERO_ADDRESS || tokens[address])
      .map(address => (address === ZERO_ADDRESS ? NativeCurrencies[chainId] : tokens[address]))
    // eslint-disable-next-line
  }, [JSON.stringify(addresses), tokens, chainId])

  const unKnowAddresses = useMemo(
    () => addresses.filter(address => address !== ZERO_ADDRESS && !tokens[address]),
    // eslint-disable-next-line
    [JSON.stringify(addresses), tokens],
  )

  const nameResult = useMultipleContractSingleData(unKnowAddresses, ERC20_INTERFACE, 'name', undefined, NEVER_RELOAD)

  const name32Result = useMultipleContractSingleData(
    unKnowAddresses,
    ERC20_BYTES32_INTERFACE,
    'name',
    undefined,
    NEVER_RELOAD,
  )

  const symbolResult = useMultipleContractSingleData(
    unKnowAddresses,
    ERC20_INTERFACE,
    'symbol',
    undefined,
    NEVER_RELOAD,
  )

  const symbol32Result = useMultipleContractSingleData(
    unKnowAddresses,
    ERC20_BYTES32_INTERFACE,
    'symbol',
    undefined,
    NEVER_RELOAD,
  )

  const decimalResult = useMultipleContractSingleData(
    unKnowAddresses,
    ERC20_INTERFACE,
    'decimals',
    undefined,
    NEVER_RELOAD,
  )

  return useMemo(() => {
    const unknownTokens = unKnowAddresses.map((address, index) => {
      try {
        const name = nameResult?.[0].result?.[index]
        const name32 = name32Result?.[0].result?.[index]
        const symbol = symbolResult?.[0].result?.[index]
        const symbol32 = symbol32Result?.[0].result?.[index]
        const decimals = decimalResult?.[0].result?.[index]

        if (!symbol || !decimals) return null

        return new Token(
          chainId,
          address,
          decimals,
          parseStringOrBytes32(symbol, symbol32, 'UNKNOWN'),
          parseStringOrBytes32(name, name32, 'Unknown Token'),
        )
      } catch (e) {
        return null
      }
    })

    return [...unknownTokens, ...knownTokens].reduce((acc, cur) => {
      if (!cur) return acc
      return {
        ...acc,
        [cur.isNative ? ZERO_ADDRESS : cur.address]: cur,
      }
    }, {})
  }, [unKnowAddresses, name32Result, nameResult, symbol32Result, symbolResult, decimalResult, knownTokens, chainId])
}

// undefined if invalid or does not exist
// null if loading
// otherwise returns the token
export function useToken(tokenAddress?: string): Token | NativeCurrency | undefined | null {
  const { chainId } = useActiveWeb3React()
  const tokens = useAllTokens()

  const address = isAddress(chainId, tokenAddress)

  const tokenContract = useTokenContract(address && tokenAddress !== ZERO_ADDRESS ? address : undefined, false)
  const tokenContractBytes32 = useBytes32TokenContract(address ? address : undefined, false)
  const token = tokenAddress === ZERO_ADDRESS ? NativeCurrencies[chainId] : address ? tokens[address] : undefined

  const tokenName = useSingleCallResult(token ? undefined : tokenContract, 'name', undefined, NEVER_RELOAD)
  const tokenNameBytes32 = useSingleCallResult(
    token ? undefined : tokenContractBytes32,
    'name',
    undefined,
    NEVER_RELOAD,
  )
  const symbol = useSingleCallResult(token ? undefined : tokenContract, 'symbol', undefined, NEVER_RELOAD)
  const symbolBytes32 = useSingleCallResult(token ? undefined : tokenContractBytes32, 'symbol', undefined, NEVER_RELOAD)
  const decimals = useSingleCallResult(token ? undefined : tokenContract, 'decimals', undefined, NEVER_RELOAD)
  const decimalsResult = decimals.result?.[0]
  const symbolResult = symbol.result?.[0]
  const symbolBytes32Result = symbolBytes32.result?.[0]
  const tokenNameResult = tokenName.result?.[0]
  const tokenNameBytes32Result = tokenNameBytes32.result?.[0]

  return useMemo(() => {
    if (token) return token
    if (!address) return undefined
    if (decimals.loading || symbol.loading || tokenName.loading) return null
    if (typeof decimalsResult === 'number') {
      return new Token(
        chainId,
        address,
        decimalsResult,
        parseStringOrBytes32(symbolResult, symbolBytes32Result, 'UNKNOWN'),
        parseStringOrBytes32(tokenNameResult, tokenNameBytes32Result, 'Unknown Token'),
      )
    }
    return undefined
  }, [
    address,
    chainId,
    decimals.loading,
    decimalsResult,
    symbol.loading,
    symbolResult,
    symbolBytes32Result,
    token,
    tokenName.loading,
    tokenNameResult,
    tokenNameBytes32Result,
  ])
}

// This function is intended to use for EVM chains only
export function useFetchERC20TokenFromRPC() {
  const { chainId } = useActiveWeb3React()
  const multicallContract = useMulticallContract()

  const fetcher = useCallback(
    async (tokenAddress: string) => {
      try {
        const address = isAddress(chainId, tokenAddress)

        if (!multicallContract) {
          console.error('No multicall contract found')
          return undefined
        }

        if (!address) {
          console.error('Invalid token address')
          return undefined
        }

        const returnData = await multicallContract.callStatic
          .tryBlockAndAggregate(false, [
            {
              target: address,
              callData: ERC20_INTERFACE.encodeFunctionData('name'),
            },
            {
              target: address,
              callData: ERC20_INTERFACE.encodeFunctionData('symbol'),
            },
            {
              target: address,
              callData: ERC20_INTERFACE.encodeFunctionData('decimals'),
            },
          ])
          .then(resp => resp.returnData.map((item: [boolean, string]) => item[1]))

        const name = ERC20_INTERFACE.decodeFunctionResult('name', returnData[0])[0]
        const symbol = ERC20_INTERFACE.decodeFunctionResult('symbol', returnData[1])[0]
        const decimals = ERC20_INTERFACE.decodeFunctionResult('decimals', returnData[2])[0]

        return new Token(chainId, address, decimals, symbol, name)
      } catch (e) {
        console.error(e)
        return undefined
      }
    },
    [chainId, multicallContract],
  )

  return fetcher
}

const cacheTokens: TokenMap = {}
export const findCacheToken = (address: string) => {
  if (!address) return
  return cacheTokens[address] || cacheTokens[address.toLowerCase()]
}

export const fetchTokenByAddress = async (address: string, chainId: ChainId) => {
  if (address === ZERO_ADDRESS) return NativeCurrencies[chainId]
  const findToken = findCacheToken(address)
  if (findToken && findToken.chainId === chainId) return findToken
  const response = await axios.get(`${KS_SETTING_API}/v1/tokens?query=${address}&chainIds=${chainId}`)
  const token = response?.data?.data?.tokens?.[0]
  return token ? formatAndCacheToken(token) : undefined
}

export const fetchListTokenByAddresses = async (address: string[], chainId: ChainId) => {
  const response = await axios.get(`${KS_SETTING_API}/v1/tokens?addresses=${address}&chainIds=${chainId}`)
  const tokens = response?.data?.data?.tokens ?? []
  return filterTruthy(tokens.map(formatAndCacheToken)) as WrappedTokenInfo[]
}

export const formatAndCacheToken = (tokenResponse: TokenInfo) => {
  try {
    const tokenInfo = new WrappedTokenInfo(tokenResponse)
    if (!tokenInfo.decimals && !tokenInfo.symbol && !tokenInfo.name) {
      return
    }
    cacheTokens[tokenResponse.address] = tokenInfo
    return tokenInfo
  } catch (e) {
    return
  }
}

function useTokenV2(tokenAddress?: string): WrappedTokenInfo | Token | NativeCurrency | undefined | null {
  const { chainId } = useActiveWeb3React()
  const address = isAddress(chainId, tokenAddress)
  const { data, isValidating } = useSWR(
    address.toString() + chainId?.toString(),
    async () => {
      try {
        if (chainId && address) return await fetchTokenByAddress(address, chainId)
      } catch (error) {}
      return undefined
    },
    { revalidateOnFocus: false, shouldRetryOnError: false, revalidateIfStale: false },
  )
  return isValidating ? null : data
}

// todo: danh update use useCurrencyV2 and remove useCurrency
export function useCurrency(currencyId: string | undefined): Currency | null | undefined {
  const { chainId } = useActiveWeb3React()
  const isETH = useMemo(
    () => chainId && currencyId?.toUpperCase() === NativeCurrencies[chainId].symbol?.toUpperCase(),
    [chainId, currencyId],
  )
  const token = useToken(isETH ? undefined : currencyId)
  return useMemo(() => (isETH ? NativeCurrencies[chainId] : token), [chainId, isETH, token])
}

// not use data from contract, in the future we will remove useCurrency
export function useCurrencyV2(currencyId: string | undefined): Currency | null | undefined {
  const { chainId } = useActiveWeb3React()
  const isETH = useMemo(
    () =>
      chainId &&
      (currencyId?.toUpperCase() === NativeCurrencies[chainId].symbol?.toUpperCase() ||
        currencyId?.toLowerCase() === 'eth'),
    [chainId, currencyId],
  )
  const whitelistTokens = useAllTokens()
  const tokenInWhitelist = currencyId
    ? whitelistTokens[currencyId] || whitelistTokens[currencyId?.toLowerCase()]
    : undefined
  const token = useTokenV2(isETH || tokenInWhitelist ? undefined : currencyId)

  return useMemo(() => {
    if (!currencyId) return
    if (isETH) return NativeCurrencies[chainId]
    return tokenInWhitelist || token
  }, [chainId, isETH, token, currencyId, tokenInWhitelist])
}
