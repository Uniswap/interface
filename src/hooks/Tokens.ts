import { parseBytes32String } from '@ethersproject/strings'
import { Currency, NativeCurrency, Token } from '@kyberswap/ks-sdk-core'
import { arrayify } from 'ethers/lib/utils'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import ERC20_INTERFACE, { ERC20_BYTES32_INTERFACE } from 'constants/abis/erc20'
import { ZERO_ADDRESS } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks/index'
import { useBytes32TokenContract, useTokenContract } from 'hooks/useContract'
import { AppState } from 'state'
import { TokenAddressMap } from 'state/lists/reducer'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { NEVER_RELOAD, useMultipleContractSingleData, useSingleCallResult } from 'state/multicall/hooks'
import { useUserAddedTokens } from 'state/user/hooks'
import { isAddress } from 'utils'

import useDebounce from './useDebounce'

// reduce token map into standard address <-> Token mapping
function useTokensFromMap(tokenMap: TokenAddressMap, lowercaseAddress?: boolean): TokenMap {
  const { chainId } = useActiveWeb3React()
  const userAddedTokens = useUserAddedTokens()

  return useMemo(() => {
    if (!chainId) return {}

    // reduce to just tokens
    const mapWithoutUrls = lowercaseAddress
      ? Object.keys(tokenMap[chainId]).reduce<TokenMap>((newMap, address) => {
          const key = address.toLowerCase()
          newMap[key] = tokenMap[chainId][address]
          return newMap
        }, {})
      : tokenMap[chainId]

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
  const { mapWhitelistTokens } = useSelector((state: AppState) => state.lists)
  const allTokens = useDebounce(mapWhitelistTokens, 300)
  return useTokensFromMap(allTokens, lowercaseAddress)
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

        if (!symbol || !decimals || !chainId) return null

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
    if (!chainId || !address) return undefined
    if (decimals.loading || symbol.loading || tokenName.loading) return null
    if (decimalsResult) {
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

export function useCurrency(currencyId: string | undefined): Currency | null | undefined {
  const { chainId } = useActiveWeb3React()
  const isETH = useMemo(
    () => chainId && currencyId?.toUpperCase() === NativeCurrencies[chainId].symbol?.toUpperCase(),
    [chainId, currencyId],
  )
  const token = useToken(isETH ? undefined : currencyId)
  return useMemo(() => (isETH ? NativeCurrencies[chainId] : token), [chainId, isETH, token])
}
