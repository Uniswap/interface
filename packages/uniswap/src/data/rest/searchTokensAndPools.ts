import { PartialMessage } from '@bufbuild/protobuf'
import { ConnectError } from '@connectrpc/connect'
import { useQuery } from '@connectrpc/connect-query'
import { UseQueryResult } from '@tanstack/react-query'
import { searchTokens } from '@uniswap/client-search/dist/search/v1/api-searchService_connectquery'
import {
  Pool,
  Token as SearchToken,
  SearchTokensRequest,
  SearchTokensResponse,
  SpamCode,
} from '@uniswap/client-search/dist/search/v1/api_pb'
import { Contract } from '@ethersproject/contracts'
import ERC20_ABI from 'uniswap/src/abis/erc20.json'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { uniswapPostTransport } from 'uniswap/src/data/rest/base'
import { parseProtectionInfo, parseRestProtocolVersion, parseSafetyLevel } from 'uniswap/src/data/rest/utils'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrency, buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { getCurrencySafetyInfo } from 'uniswap/src/features/dataApi/utils/getCurrencySafetyInfo'
import { createEthersProvider } from 'uniswap/src/features/providers/createEthersProvider'
import { PoolSearchResult, SearchResultType } from 'uniswap/src/features/search/SearchResult'
import { buildCurrencyId, currencyId, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'

/**
 * Wrapper around Tanstack useQuery for the Uniswap REST BE service SearchTokens
 * This includes data for both token search AND pool search
 * @param input - The search request parameters including search query, chain IDs, search type, page and size
 * @returns data, error, isPending, and refetch
 */
export function useSearchTokensAndPoolsQuery<TSelectType>({
  input,
  enabled = true,
  select,
}: {
  input?: PartialMessage<SearchTokensRequest>
  enabled?: boolean
  select?: ((data: SearchTokensResponse) => TSelectType) | undefined
}): UseQueryResult<TSelectType, ConnectError> {
  return useQuery(searchTokens, input, {
    transport: uniswapPostTransport,
    enabled: !!input && enabled,
    select,
  })
}

export function searchTokenToCurrencyInfo(token: SearchToken): CurrencyInfo | null {
  const { chainId, address, symbol, name, decimals, logoUrl, feeData } = token
  const safetyLevel = parseSafetyLevel(token.safetyLevel)
  const protectionInfo = parseProtectionInfo(token.protectionInfo)

  const currency = buildCurrency({
    chainId,
    // TODO: backend currently returns 'ETH' for some native tokens, remove this check once BE fixes
    address: address === 'ETH' ? getNativeAddress(chainId) : address,
    decimals,
    symbol,
    name,
    buyFeeBps: feeData?.buyFeeBps,
    sellFeeBps: feeData?.sellFeeBps,
  })

  const safetyInfo = getCurrencySafetyInfo(safetyLevel, protectionInfo)

  if (!currency) {
    return null
  }

  return buildCurrencyInfo({ currency, currencyId: currencyId(currency), logoUrl, safetyInfo })
}

export function searchPoolToPoolSearchResult(pool: Pool): PoolSearchResult | undefined {
  const protocolVersion = parseRestProtocolVersion(pool.protocolVersion)
  if (!pool.token0 || !pool.token1 || !protocolVersion) {
    return undefined
  }
  const token0Address = isNativeCurrencyAddress(pool.chainId, pool.token0.address)
    ? getNativeAddress(pool.chainId)
    : pool.token0.address
  const token1Address = isNativeCurrencyAddress(pool.chainId, pool.token1.address)
    ? getNativeAddress(pool.chainId)
    : pool.token1.address
  return {
    type: SearchResultType.Pool,
    chainId: pool.chainId,
    poolId: pool.id,
    protocolVersion,
    hookAddress: pool.hookAddress,
    feeTier: pool.feeTier,
    token0CurrencyId: buildCurrencyId(pool.chainId, token0Address),
    token1CurrencyId: buildCurrencyId(pool.chainId, token1Address),
  }
}

/**
 * Direct blockchain token data fetching function that bypasses useQuery
 * Fetches token data directly from the blockchain using ethers
 * @param tokenAddress - The token contract address
 * @param chainId - The chain ID to fetch from
 * @returns Promise with token data matching the SearchToken format
 */
export async function fetchTokenDataDirectly(
  tokenAddress: string,
  chainId: UniverseChainId,
): Promise<SearchToken | null> {
  try {
    const provider = createEthersProvider({ chainId })
    if (!provider) {
      throw new Error(`Failed to create provider for chain ${chainId}`)
    }

    const contract = new Contract(tokenAddress, ERC20_ABI, provider)

    const [name, symbol, decimals] = await Promise.all([contract.name(), contract.symbol(), contract.decimals()])

    const decimalsNumber = Number(decimals)

    const tokenData = new SearchToken({
      address: tokenAddress,
      chainId,
      decimals: decimalsNumber,
      isSpam: 'FALSE',
      name,
      projectName: name,
      safetyLevel: 'STRONG_WARNING',
      standard: 'ERC20',
      logoUrl: `https://ethereum-optimism.github.io/data/${name}/logo.png`,
      symbol,
      tokenId: `${chainId}_${tokenAddress}`,
      spamCode: SpamCode.NOT_SPAM,
    })

    return tokenData
  } catch (error) {
    return null
  }
}
