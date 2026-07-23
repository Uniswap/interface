import { useEffect, useMemo } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrency } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { useCurrencyInfoWithLoading } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import {
  shouldLogCorruptMetadataOnce,
  shouldLogUnresolvedDecimalsOnce,
} from '~/features/Toucan/Auction/hooks/auctionTokenInfoLogGuards'
import { useTokenInfoFromContract } from '~/features/Toucan/Auction/hooks/useTokenInfoFromContract'
import { isUsableAuctionTokenMetadata } from '~/features/Toucan/Auction/utils/tokenMetadata'
import { getAuctionMetadata } from '~/features/Toucan/Config/config'

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

  // Indexed metadata for launched tokens can come back corrupt on some chains
  // (decimals=0 with empty name/symbol). Treat it as missing so the on-chain
  // fallback resolves the real values instead of rendering mis-scaled numbers.
  const usableCurrencyInfo = useMemo(() => {
    if (!currencyInfo) {
      return undefined
    }
    const { decimals, symbol, name } = currencyInfo.currency
    return isUsableAuctionTokenMetadata({ decimals, symbol, name }) ? currencyInfo : undefined
  }, [currencyInfo])

  // Bad-ingestion signal: the API returned metadata for this token but it matched
  // the corrupt signature, so the on-chain fallback has to engage. Distinct from a
  // token that is simply not indexed yet (currencyInfo undefined).
  const hasCorruptIndexedMetadata = !graphqlLoading && Boolean(currencyInfo) && !usableCurrencyInfo

  useEffect(() => {
    if (!hasCorruptIndexedMetadata || !currencyId || !shouldLogCorruptMetadataOnce(currencyId)) {
      return
    }
    // Stable message — Datadog dashboards/monitors count occurrences of this exact string.
    logger.warn(
      'useAuctionTokenInfo',
      'useAuctionTokenInfo',
      'Corrupt indexed auction token metadata, falling back to on-chain read',
      { chainId, tokenAddress },
    )
  }, [hasCorruptIndexedMetadata, currencyId, chainId, tokenAddress])

  // Fallback to on-chain RPC call if GraphQL returns null (token not indexed)
  // or returns unusable metadata (corrupt ingestion)
  const shouldFetchFromContract = !graphqlLoading && !usableCurrencyInfo && Boolean(tokenAddress && chainId)
  const {
    tokenMetadata,
    loading: contractLoading,
    error: contractError,
  } = useTokenInfoFromContract(
    shouldFetchFromContract ? tokenAddress : undefined,
    shouldFetchFromContract ? chainId : undefined,
  )

  // Unresolved-decimals signal: the on-chain fallback has settled (a result or an
  // RPC error, not still loading) and decimals are still unknown, so consumers stay
  // stuck in their loading/placeholder state.
  const contractFetchSettled = shouldFetchFromContract && !contractLoading && Boolean(tokenMetadata || contractError)
  const decimalsUnresolved = contractFetchSettled && tokenMetadata?.decimals === undefined
  const contractErrorMessage = contractError?.message

  useEffect(() => {
    if (!decimalsUnresolved || !currencyId || !shouldLogUnresolvedDecimalsOnce(currencyId)) {
      return
    }
    // Stable message — Datadog error tracking counts occurrences of this exact string.
    logger.error(new Error('Failed to resolve auction token decimals'), {
      tags: { file: 'useAuctionTokenInfo.ts', function: 'useAuctionTokenInfo' },
      extra: {
        chainId,
        tokenAddress,
        hadCorruptIndexedMetadata: hasCorruptIndexedMetadata,
        contractError: contractErrorMessage,
      },
    })
  }, [decimalsUnresolved, currencyId, chainId, tokenAddress, hasCorruptIndexedMetadata, contractErrorMessage])

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
    // If we have usable GraphQL data, use it (with potential overrides)
    if (usableCurrencyInfo) {
      const hasLogoOverride = !!metadataOverride?.logoUrl
      const hasNameOverride = !!metadataOverride?.tokenName || !!metadataOverride?.tokenSymbol

      if (hasLogoOverride || hasNameOverride) {
        const overriddenCurrency = hasNameOverride
          ? buildCurrency({
              chainId: usableCurrencyInfo.currency.chainId,
              address: usableCurrencyInfo.currency.isToken ? usableCurrencyInfo.currency.address : undefined,
              decimals: usableCurrencyInfo.currency.decimals,
              symbol: metadataOverride.tokenSymbol ?? usableCurrencyInfo.currency.symbol,
              name: metadataOverride.tokenName ?? usableCurrencyInfo.currency.name,
            })
          : undefined

        return {
          ...usableCurrencyInfo,
          ...(overriddenCurrency && { currency: overriddenCurrency }),
          ...(hasLogoOverride && { logoUrl: metadataOverride.logoUrl }),
        }
      }
      return usableCurrencyInfo
    }

    // If we have on-chain metadata (including resolved decimals), construct CurrencyInfo from it
    if (tokenMetadata && tokenMetadata.decimals !== undefined && tokenAddress && chainId && currencyId) {
      const currency = buildCurrency({
        chainId,
        address: tokenAddress,
        decimals: tokenMetadata.decimals,
        symbol: metadataOverride?.tokenSymbol ?? tokenMetadata.symbol,
        name: metadataOverride?.tokenName ?? tokenMetadata.name,
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
  }, [usableCurrencyInfo, tokenMetadata, tokenAddress, chainId, currencyId, metadataOverride])

  return { tokenInfo, loading, error }
}
