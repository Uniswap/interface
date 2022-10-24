import { arrayify } from '@ethersproject/bytes'
import { parseBytes32String } from '@ethersproject/strings'
import { Currency, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import ERC20_ABI from 'abis/erc20.json'
import { Erc20 } from 'abis/types'
import { isSupportedChain, SupportedChainId } from 'constants/chains'
import { RPC_PROVIDERS } from 'constants/providers'
import { useBytes32TokenContract, useTokenContract } from 'hooks/useContract'
import { NEVER_RELOAD, useSingleCallResult } from 'lib/hooks/multicall'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { useEffect, useMemo, useState } from 'react'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

import { TOKEN_SHORTHANDS } from '../../constants/tokens'
import { getContract, isAddress } from '../../utils'
import { supportedChainId } from '../../utils/supportedChainId'

/**
 * Returns a Token from query data.
 * Data should already include all fields except decimals, or it will be considered invalid.
 * Returns null if the token is loading or null was passed.
 * Returns undefined if invalid or the token does not exist.
 */
export function useTokenFromQuery({
  address: tokenAddress,
  chainId,
  symbol,
  name,
  project,
}: {
  address?: string
  chainId?: SupportedChainId
  symbol?: string | null
  name?: string | null
  project?: { logoUrl?: string | null } | null
} = {}): Token | null | undefined {
  const { chainId: activeChainId } = useWeb3React()
  const address = isAddress(tokenAddress)
  const [decimals, setDecimals] = useState<number | null | undefined>(null)

  const tokenContract = useTokenContract(chainId === activeChainId ? (address ? address : undefined) : undefined, false)
  const { loading, result: [decimalsResult] = [] } = useSingleCallResult(
    tokenContract,
    'decimals',
    undefined,
    NEVER_RELOAD
  )

  useEffect(() => {
    if (loading) {
      setDecimals(null)
    } else if (decimalsResult) {
      setDecimals(decimalsResult)
    } else if (!address || !chainId || chainId === activeChainId) {
      setDecimals(undefined)
    } else {
      setDecimals(null)

      // Load decimals from a cross-chain RPC provider.
      const provider = RPC_PROVIDERS[chainId]
      const contract = getContract(address, ERC20_ABI, provider) as Erc20
      contract
        .decimals()
        .then((value) => {
          if (!stale) setDecimals(value)
        })
        .catch(() => undefined)
    }

    let stale = false
    return () => {
      stale = true
    }
  }, [activeChainId, address, chainId, decimalsResult, loading])

  return useMemo(() => {
    if (!chainId || !address) return undefined
    if (decimals === null || decimals === undefined) return decimals
    if (!symbol || !name) {
      return new Token(chainId, address, decimals, symbol ?? undefined, name ?? undefined)
    } else {
      const logoURI = project?.logoUrl ?? undefined
      return new WrappedTokenInfo({ chainId, address, decimals, symbol, name, logoURI })
    }
  }, [address, chainId, decimals, name, project?.logoUrl, symbol])
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

/**
 * Returns a Token from the tokenAddress.
 * Returns null if token is loading or null was passed.
 * Returns undefined if tokenAddress is invalid or token does not exist.
 */
export function useTokenFromActiveNetwork(tokenAddress: string | undefined): Token | null | undefined {
  const { chainId } = useWeb3React()

  const formattedAddress = isAddress(tokenAddress)
  const tokenContract = useTokenContract(formattedAddress ? formattedAddress : undefined, false)
  const tokenContractBytes32 = useBytes32TokenContract(formattedAddress ? formattedAddress : undefined, false)

  // TODO: Fix redux-multicall so that these values do not reload.
  const tokenName = useSingleCallResult(tokenContract, 'name', undefined, NEVER_RELOAD)
  const tokenNameBytes32 = useSingleCallResult(tokenContractBytes32, 'name', undefined, NEVER_RELOAD)
  const symbol = useSingleCallResult(tokenContract, 'symbol', undefined, NEVER_RELOAD)
  const symbolBytes32 = useSingleCallResult(tokenContractBytes32, 'symbol', undefined, NEVER_RELOAD)
  const decimals = useSingleCallResult(tokenContract, 'decimals', undefined, NEVER_RELOAD)

  const isLoading = useMemo(
    () => decimals.loading || symbol.loading || tokenName.loading,
    [decimals.loading, symbol.loading, tokenName.loading]
  )
  const parsedDecimals = useMemo(() => decimals.result?.[0], [decimals.result])
  const parsedSymbol = useMemo(
    () => parseStringOrBytes32(symbol.result?.[0], symbolBytes32.result?.[0], 'UNKNOWN'),
    [symbol.result, symbolBytes32.result]
  )
  const parsedName = useMemo(
    () => parseStringOrBytes32(tokenName.result?.[0], tokenNameBytes32.result?.[0], 'Unknown Token'),
    [tokenName.result, tokenNameBytes32.result]
  )

  return useMemo(() => {
    // If the token is on another chain, we cannot fetch it on-chain, and it is invalid.
    if (typeof tokenAddress !== 'string' || !isSupportedChain(chainId) || !formattedAddress) return undefined

    if (isLoading || !chainId) return null
    if (!parsedDecimals) return undefined

    return new Token(chainId, formattedAddress, parsedDecimals, parsedSymbol, parsedName)
  }, [chainId, tokenAddress, formattedAddress, isLoading, parsedDecimals, parsedSymbol, parsedName])
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

  const tokenFromNetwork = useTokenFromActiveNetwork(token ? undefined : address ? address : undefined)

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

  if (currencyId === null || currencyId === undefined || !isSupportedChain(chainId)) return null

  // this case so we use our builtin wrapped token instead of wrapped tokens on token lists
  const wrappedNative = nativeCurrency?.wrapped
  if (wrappedNative?.address?.toUpperCase() === currencyId?.toUpperCase()) return wrappedNative

  return isNative ? nativeCurrency : token
}
