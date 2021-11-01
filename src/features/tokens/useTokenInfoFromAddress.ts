// Mostly copied from https://github.com/Uniswap/interface/blob/main/src/hooks/Tokens.ts#L129
// But renamed useToken to useTokenInfoFromAddress for clarity

import { Token } from '@uniswap/sdk-core'
import { utils } from 'ethers'
import { NEVER_RELOAD } from 'multicall-query'
import { useMemo } from 'react'
import { ChainId } from 'src/constants/chains'
import { useBytes32TokenContract, useTokenContract } from 'src/features/contracts/useContract'
import { useSingleCallResult } from 'src/features/multicall'
import { useAllTokens } from 'src/features/tokens/useTokens'
import { isValidAddress, normalizeAddress } from 'src/utils/addresses'

// Uses an Ethers contract for the token address to retrieve info directly from the chain
// undefined if invalid or does not exist, null if loading, otherwise returns token
export function useTokenInfoFromAddress(
  chainId: ChainId,
  tokenAddress?: string | null
): Token | undefined | null {
  const address = isValidAddress(tokenAddress) ? normalizeAddress(tokenAddress) : null

  const tokenContract = useTokenContract(chainId, address ? address : undefined)
  const tokenContractBytes32 = useBytes32TokenContract(chainId, address ? address : undefined)

  const chainIdToTokens = useAllTokens()
  const tokens = chainIdToTokens[chainId] ?? {}
  const token: Token | undefined = address ? tokens[address] : undefined

  const tokenName = useSingleCallResult(
    chainId,
    token ? undefined : tokenContract,
    'name',
    undefined,
    NEVER_RELOAD
  )
  const tokenNameBytes32 = useSingleCallResult(
    chainId,
    token ? undefined : tokenContractBytes32,
    'name',
    undefined,
    NEVER_RELOAD
  )
  const symbol = useSingleCallResult(
    chainId,
    token ? undefined : tokenContract,
    'symbol',
    undefined,
    NEVER_RELOAD
  )
  const symbolBytes32 = useSingleCallResult(
    chainId,
    token ? undefined : tokenContractBytes32,
    'symbol',
    undefined,
    NEVER_RELOAD
  )
  const decimals = useSingleCallResult(
    chainId,
    token ? undefined : tokenContract,
    'decimals',
    undefined,
    NEVER_RELOAD
  )

  return useMemo(() => {
    if (token) return token
    if (tokenAddress === null) return null
    if (!chainId || !address) return undefined
    if (decimals.loading || symbol.loading || tokenName.loading) return null
    if (decimals.result) {
      return new Token(
        chainId,
        address,
        decimals.result[0],
        parseStringOrBytes32(symbol.result?.[0], symbolBytes32.result?.[0], 'UNKNOWN'),
        parseStringOrBytes32(tokenName.result?.[0], tokenNameBytes32.result?.[0], 'Unknown Token')
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
    tokenAddress,
    tokenName.loading,
    tokenName.result,
    tokenNameBytes32.result,
  ])
}

// parse a name or symbol from a token response
const BYTES32_REGEX = /^0x[a-fA-F0-9]{64}$/

function parseStringOrBytes32(
  str: string | undefined,
  bytes32: string | undefined,
  defaultValue: string
): string {
  return str && str.length > 0
    ? str
    : // need to check for proper bytes string and valid terminator
    bytes32 && BYTES32_REGEX.test(bytes32) && utils.arrayify(bytes32)[31] === 0
    ? utils.parseBytes32String(bytes32)
    : defaultValue
}
