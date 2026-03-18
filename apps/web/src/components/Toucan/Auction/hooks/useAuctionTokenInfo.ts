import { useMemo } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrency } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { useCurrencyInfoWithLoading } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { useTokenInfoFromContract } from '~/components/Toucan/Auction/hooks/useTokenInfoFromContract'
import { getAuctionMetadata } from '~/components/Toucan/Config/config'

/**
 * Hook to fetch auction token information (the token being auctioned off)
 * Derives symbol, name, decimals, and logoUrl from tokenAddress and chainId
 *
 * First attempts to fetch from Uniswap's GraphQL API, then falls back to on-chain
 * RPC calls if the token is not indexed (common for testnet tokens).
 *
 * @param tokenAddress - The address of the auction token
 * @param chainId - The chain ID where the token exists
 * @returns CurrencyInfo with loading and error states
 */
export function useAuctionTokenInfo(
  tokenAddress?: string,
  chainId?: UniverseChainId,
): { tokenInfo: CurrencyInfo | undefined; loading: boolean; error?: Error } {
  const currencyId = useMemo(
    () => (chainId && tokenAddress ? buildCurrencyId(chainId, tokenAddress) : undefined),
    [chainId, tokenAddress],
  )

  // First try to fetch from GraphQL API
  const { currencyInfo, loading: graphqlLoading, error: graphqlError } = useCurrencyInfoWithLoading(currencyId)

  // Fallback to on-chain RPC call if GraphQL returns null (token not indexed)
  const shouldFetchFromContract = !graphqlLoading && !currencyInfo && Boolean(tokenAddress && chainId)
  const {
    tokenMetadata,
    loading: contractLoading,
    error: contractError,
  } = useTokenInfoFromContract(
    shouldFetchFromContract ? tokenAddress : undefined,
    shouldFetchFromContract ? chainId : undefined,
  )

  // Combine loading states - loading if either is loading
  const loading = graphqlLoading || contractLoading

  // Prefer GraphQL error, fallback to contract error
  const error = graphqlError || contractError || undefined

  // Check for logo override from config
  const metadataOverride = useMemo(() => {
    if (chainId && tokenAddress) {
      const override = getAuctionMetadata({ chainId, tokenAddress })
      return override
    }
    return undefined
  }, [chainId, tokenAddress])

  // Construct tokenInfo from either GraphQL or on-chain data
  const tokenInfo = useMemo((): CurrencyInfo | undefined => {
    // If we have GraphQL data, use it (with potential logo override)
    if (currencyInfo) {
      if (metadataOverride?.logoUrl) {
        return {
          ...currencyInfo,
          logoUrl: metadataOverride.logoUrl,
        }
      }
      return currencyInfo
    }

    // If we have on-chain metadata, construct CurrencyInfo from it
    if (tokenMetadata && tokenAddress && chainId && currencyId) {
      const currency = buildCurrency({
        chainId,
        address: tokenAddress,
        decimals: tokenMetadata.decimals ?? 18,
        symbol: tokenMetadata.symbol,
        name: tokenMetadata.name,
      })

      if (!currency) {
        return undefined
      }

      return {
        currency,
        currencyId,
        logoUrl: metadataOverride?.logoUrl,
      }
    }

    return undefined
  }, [currencyInfo, tokenMetadata, tokenAddress, chainId, currencyId, metadataOverride])

  return { tokenInfo, loading, error }
}
