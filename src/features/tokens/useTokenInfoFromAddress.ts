// Mostly copied from https://github.com/Uniswap/interface/blob/main/src/hooks/Tokens.ts#L129
// But renamed useToken to useTokenInfoFromAddress for clarity

import { NEVER_RELOAD } from '@uniswap/redux-multicall'
import { Token } from '@uniswap/sdk-core'
import { utils } from 'ethers'
import { useMemo } from 'react'
import { ChainId } from 'src/constants/chains'
import { useBytes32TokenContract, useTokenContract } from 'src/features/contracts/useContract'
import { useSingleCallResult } from 'src/features/multicall'
import { useAllTokens } from 'src/features/tokens/useTokens'
import { getValidAddress } from 'src/utils/addresses'
import { checksumCurrencyId, currencyIdToAddress } from 'src/utils/currencyId'

// Uses an Ethers contract for the token address to retrieve info directly from the chain
// undefined if invalid or does not exist, null if loading, otherwise returns token
export function useTokenInfoFromAddress(
  chainId: ChainId,
  currencyId?: string | null
): Token | undefined | null {
  const tokenAddress = currencyId ? currencyIdToAddress(currencyId) : null
  const address = getValidAddress(tokenAddress, true)

  const tokenContract = useTokenContract(chainId, address ? address : undefined)
  const tokenContractBytes32 = useBytes32TokenContract(chainId, address ? address : undefined)

  const chainIdToTokens = useAllTokens()
  const tokens = chainIdToTokens[chainId] ?? {}
  // need to checksum the currencyId because Object.keys(tokens) are all checksummed, currencyId may not be
  const token: Token | undefined = currencyId ? tokens[checksumCurrencyId(currencyId)] : undefined

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

  // x.result returns a new array object every render, so memoize based on inner value
  const decimalValue = decimals.result?.[0]
  const symbolValue = symbol.result?.[0]
  const symbolBytesValue = symbolBytes32.result?.[0]
  const tokenNameValue = tokenName.result?.[0]
  const tokenBytesValue = tokenNameBytes32.result?.[0]

  return useMemo(() => {
    if (token) return token
    if (tokenAddress === null) return null
    if (!chainId || !address) return undefined
    if (decimals.loading || symbol.loading || tokenName.loading) return null
    if (decimalValue) {
      return new Token(
        chainId,
        address,
        decimalValue,
        parseStringOrBytes32(symbolValue, symbolBytesValue, 'UNKNOWN'),
        parseStringOrBytes32(tokenNameValue, tokenBytesValue, 'Unknown Token')
      )
    }
    return undefined
  }, [
    address,
    chainId,
    decimals.loading,
    decimalValue,
    symbol.loading,
    symbolValue,
    symbolBytesValue,
    token,
    tokenAddress,
    tokenName.loading,
    tokenNameValue,
    tokenBytesValue,
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
