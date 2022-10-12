import { arrayify } from '@ethersproject/bytes'
import { parseBytes32String } from '@ethersproject/strings'
import { Currency, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { isSupportedChain } from 'constants/chains'
import { useBytes32TokenContract, useTokenContract } from 'hooks/useContract'
import { NEVER_RELOAD, useSingleCallResult } from 'lib/hooks/multicall'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { useMemo } from 'react'

import { TOKEN_SHORTHANDS } from '../../constants/tokens'
import { isAddress } from '../../utils'
import { supportedChainId } from '../../utils/supportedChainId'

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

const tokenCache: { [addr: string]: Token } = {}

function keyForChainIdAndAddress(tokenAddress: string, chainId: number): string {
  return tokenAddress + chainId.toString()
}

interface TokenParams {
  tokenAddress: string
  chainId: number
  decimals: number
  symbol?: string
  name?: string
}

function getOrCreateToken({ tokenAddress, chainId, decimals, symbol, name }: TokenParams) {
  const key = keyForChainIdAndAddress(tokenAddress, chainId)
  if (tokenCache[key]) {
    return tokenCache[key]
  } else {
    tokenCache[key] = new Token(chainId, tokenAddress, decimals, symbol, name)
    return tokenCache[key]
  }
}

/**
 * Returns a Token from the tokenAddress.
 * Returns null if token is loading or null was passed.
 * Returns undefined if tokenAddress is invalid or token does not exist.
 */
export function useTokenFromNetwork(
  tokenAddress: string | null | undefined,
  chainId?: number
): Token | null | undefined {
  const web3ReactChainId = useWeb3React().chainId
  const supportedChain = isSupportedChain(chainId)

  const formattedAddress = isAddress(tokenAddress)

  const tokenContract = useTokenContract(formattedAddress ? formattedAddress : undefined, false)
  const tokenContractBytes32 = useBytes32TokenContract(formattedAddress ? formattedAddress : undefined, false)

  const tokenName = useSingleCallResult(tokenContract, 'name', undefined, NEVER_RELOAD)
  const tokenNameBytes32 = useSingleCallResult(tokenContractBytes32, 'name', undefined, NEVER_RELOAD)
  const symbol = useSingleCallResult(tokenContract, 'symbol', undefined, NEVER_RELOAD)
  const symbolBytes32 = useSingleCallResult(tokenContractBytes32, 'symbol', undefined, NEVER_RELOAD)
  const decimals = useSingleCallResult(tokenContract, 'decimals', undefined, NEVER_RELOAD)

  if (
    typeof tokenAddress !== 'string' ||
    !supportedChain ||
    !formattedAddress ||
    (chainId && chainId !== web3ReactChainId) ||
    !web3ReactChainId
  )
    return undefined
  if (decimals.loading || symbol.loading || tokenName.loading || !chainId) return null
  if (decimals.result) {
    return getOrCreateToken({
      chainId: web3ReactChainId,
      tokenAddress: formattedAddress,
      decimals: decimals.result[0],
      symbol: parseStringOrBytes32(symbol.result?.[0], symbolBytes32.result?.[0], 'UNKNOWN'),
      name: parseStringOrBytes32(tokenName.result?.[0], tokenNameBytes32.result?.[0], 'Unknown Token'),
    })
  }
  return undefined
}

type TokenMap = { [address: string]: Token }

/**
 * Returns a Token from the tokenAddress.
 * Returns null if token is loading or null was passed.
 * Returns undefined if tokenAddress is invalid or token does not exist.
 */
export function useTokenFromMapOrNetwork(tokens: TokenMap, tokenAddress?: string | null): Token | null | undefined {
  const address = isAddress(tokenAddress)
  const token: Token | undefined = address ? tokens[address] : undefined

  const tokenFromNetwork = useTokenFromNetwork(token ? undefined : address ? address : undefined)

  return tokenFromNetwork ?? token
}

/**
 * Returns a Currency from the currencyId.
 * Returns null if currency is loading or null was passed.
 * Returns undefined if currencyId is invalid or token does not exist.
 */
export function useCurrencyFromMap(tokens: TokenMap, currencyId?: string | null): Currency | null | undefined {
  const nativeCurrency = useNativeCurrency()
  const { chainId } = useWeb3React()
  const isNative = Boolean(nativeCurrency && currencyId?.toUpperCase() === 'ETH')
  const shorthandMatchAddress = useMemo(() => {
    const chain = supportedChainId(chainId)
    return chain && currencyId ? TOKEN_SHORTHANDS[currencyId.toUpperCase()]?.[chain] : undefined
  }, [chainId, currencyId])

  const token = useTokenFromMapOrNetwork(tokens, isNative ? undefined : shorthandMatchAddress ?? currencyId)

  const supportedChain = isSupportedChain(chainId)
  if (currencyId === null || currencyId === undefined || !supportedChain) return null

  // this case so we use our builtin wrapped token instead of wrapped tokens on token lists
  const wrappedNative = nativeCurrency?.wrapped
  if (wrappedNative?.address?.toUpperCase() === currencyId?.toUpperCase()) return wrappedNative

  return isNative ? nativeCurrency : token
}
