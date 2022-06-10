import { parseBytes32String } from '@ethersproject/strings'
import { Currency, Token, ChainId, NativeCurrency } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import { TokenAddressMap, useAllLists, useCombinedActiveList, useInactiveListUrls } from 'state/lists/hooks'
import { NEVER_RELOAD, useSingleCallResult, useMultipleContractSingleData } from 'state/multicall/hooks'
import { useUserAddedTokens } from 'state/user/hooks'
import { isAddress } from 'utils'
import { createTokenFilterFunction } from 'components/SearchModal/filtering'
import { useActiveWeb3React } from 'hooks/index'
import { useBytes32TokenContract, useTokenContract } from 'hooks/useContract'
import { arrayify } from 'ethers/lib/utils'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { nativeOnChain } from 'constants/tokens'
import { ERC20_ABI, ERC20_BYTES32_ABI } from 'constants/abis/erc20'
import { Interface } from '@ethersproject/abi'
import { ZERO_ADDRESS } from 'constants/index'

// reduce token map into standard address <-> Token mapping, optionally include user added tokens
function useTokensFromMap(tokenMap: TokenAddressMap, includeUserAdded: boolean): { [address: string]: Token } {
  const { chainId } = useActiveWeb3React()
  const userAddedTokens = useUserAddedTokens()

  return useMemo(() => {
    if (!chainId) return {}

    // reduce to just tokens
    const mapWithoutUrls = Object.keys(tokenMap[chainId]).reduce<{ [address: string]: Token }>((newMap, address) => {
      newMap[address] = tokenMap[chainId][address].token
      return newMap
    }, {})

    if (includeUserAdded) {
      return (
        userAddedTokens
          // reduce into all ALL_TOKENS filtered by the current chain
          .reduce<{ [address: string]: Token }>(
            (tokenMap, token) => {
              tokenMap[token.address] = token
              return tokenMap
            },
            // must make a copy because reduce modifies the map, and we do not
            // want to make a copy in every iteration
            { ...mapWithoutUrls },
          )
      )
    }

    return mapWithoutUrls
  }, [chainId, userAddedTokens, tokenMap, includeUserAdded])
}

export function useAllTokens(): { [address: string]: Token } {
  const allTokens = useCombinedActiveList()
  return useTokensFromMap(allTokens, true)
}

export function useIsTokenActive(token: Token | undefined | null): boolean {
  const activeTokens = useAllTokens()

  if (!activeTokens || !token) {
    return false
  }

  return !!activeTokens[token.address]
}

// Check if currency is included in custom list from user storage
export function useIsUserAddedToken(currency: Currency | undefined | null): boolean {
  const userAddedTokens = useUserAddedTokens()

  if (!currency) {
    return false
  }

  return !!userAddedTokens.find(token => currency.equals(token))
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

export const useTokens = (addresses: string[]): { [address: string]: Token } => {
  const { chainId } = useActiveWeb3React()
  const tokens = useAllTokens()

  const knownTokens = useMemo(() => {
    return addresses
      .filter(address => address === ZERO_ADDRESS || tokens[address])
      .map(address => (address === ZERO_ADDRESS ? nativeOnChain(chainId as ChainId) : tokens[address]))
    // eslint-disable-next-line
  }, [JSON.stringify(addresses), tokens, chainId])

  const unKnowAddresses = useMemo(
    () => addresses.filter(address => address !== ZERO_ADDRESS && !tokens[address]),
    // eslint-disable-next-line
    [JSON.stringify(addresses), tokens],
  )

  const erc20Abi = useMemo(() => new Interface(ERC20_ABI), [])
  const erc20Byte32Abi = useMemo(() => new Interface(ERC20_BYTES32_ABI), [])
  const nameResult = useMultipleContractSingleData(unKnowAddresses, erc20Abi, 'name', undefined, NEVER_RELOAD)

  const name32Result = useMultipleContractSingleData(unKnowAddresses, erc20Byte32Abi, 'name', undefined, NEVER_RELOAD)

  const symbolResult = useMultipleContractSingleData(unKnowAddresses, erc20Abi, 'symbol', undefined, NEVER_RELOAD)

  const symbol32Result = useMultipleContractSingleData(
    unKnowAddresses,
    erc20Byte32Abi,
    'symbol',
    undefined,
    NEVER_RELOAD,
  )

  const decimalResult = useMultipleContractSingleData(unKnowAddresses, erc20Abi, 'decimals', undefined, NEVER_RELOAD)

  return useMemo(() => {
    const unknownTokens = unKnowAddresses.map((address, index) => {
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

  const address = isAddress(tokenAddress)

  const tokenContract = useTokenContract(address && tokenAddress !== ZERO_ADDRESS ? address : undefined, false)
  const tokenContractBytes32 = useBytes32TokenContract(address ? address : undefined, false)
  const token =
    tokenAddress === ZERO_ADDRESS ? nativeOnChain(chainId as ChainId) : address ? tokens[address] : undefined

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

  return useMemo(() => {
    if (token) return token
    if (!chainId || !address) return undefined
    if (decimals.loading || symbol.loading || tokenName.loading) return null
    if (decimals.result) {
      return new Token(
        chainId,
        address,
        decimals.result[0],
        parseStringOrBytes32(symbol.result?.[0], symbolBytes32.result?.[0], 'UNKNOWN'),
        parseStringOrBytes32(tokenName.result?.[0], tokenNameBytes32.result?.[0], 'Unknown Token'),
      )
    }
    return undefined
  }, [
    address,
    chainId,
    decimals.loading,
    decimals.result,
    symbol.loading,
    symbol.result,
    symbolBytes32.result,
    token,
    tokenName.loading,
    tokenName.result,
    tokenNameBytes32.result,
  ])
}

export function useCurrency(currencyId: string | undefined): Currency | null | undefined {
  const { chainId } = useActiveWeb3React()
  const isETH = chainId && currencyId?.toUpperCase() === nativeOnChain(chainId).symbol
  const token = useToken(isETH ? undefined : currencyId)
  return isETH ? nativeOnChain(chainId as ChainId) : token
}

export function useSearchInactiveTokenLists(search: string | undefined, minResults = 10): WrappedTokenInfo[] {
  const lists = useAllLists()
  const inactiveUrls = useInactiveListUrls()
  const { chainId } = useActiveWeb3React()
  const activeTokens = useAllTokens()

  return useMemo(() => {
    if (!search || search.trim().length === 0) return []
    const tokenFilter = createTokenFilterFunction(search)
    const result: WrappedTokenInfo[] = []
    const addressSet: { [address: string]: true } = {}
    for (const url of inactiveUrls) {
      const list = lists[url].current
      if (!list) continue
      for (const tokenInfo of list.tokens) {
        if (tokenInfo.chainId === chainId && tokenFilter(tokenInfo)) {
          const wrapped: WrappedTokenInfo = new WrappedTokenInfo(tokenInfo, list)
          if (!activeTokens[wrapped.address] && !addressSet[wrapped.address]) {
            addressSet[wrapped.address] = true
            result.push(wrapped)
            if (result.length >= minResults) return result
          }
        }
      }
    }
    return result
  }, [activeTokens, chainId, inactiveUrls, lists, minResults, search])
}
