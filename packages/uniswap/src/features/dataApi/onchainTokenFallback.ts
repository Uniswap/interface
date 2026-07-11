import { skipToken, useQuery } from '@tanstack/react-query'
import { GqlResult, tryProvideSession } from '@universe/api'
import { Contract } from 'ethers/lib/ethers'
import { useMemo } from 'react'
import ERC20_ABI from 'uniswap/src/abis/erc20.json'
import { RPCType, UniverseChainId } from 'uniswap/src/features/chains/types'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrency, buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { getCurrencySafetyInfo } from 'uniswap/src/features/dataApi/utils/getCurrencySafetyInfo'
import { createEthersProviderFactory } from 'uniswap/src/features/providers/createEthersProvider'
import { defaultResolveRpcConfig } from 'uniswap/src/features/providers/resolveRpcConfig'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { ONE_DAY_MS, ONE_HOUR_MS } from 'utilities/src/time/time'

const FILE_NAME = 'onchainTokenFallback.ts'

// Same provider factory pattern used by portfolio/api.ts for client-side on-chain reads:
// public RPC per chain (the HookSwap custom chains carry their public RPC in chain info).
const createProvider = createEthersProviderFactory({
  resolveRpcConfig: defaultResolveRpcConfig,
  getSessionGate: tryProvideSession,
})

/**
 * GRACEFUL ADDRESS-PASTE FALLBACK (Part A).
 *
 * The hosted Uniswap SearchService (entryGatewayProdPostTransport) can't serve HookSwap's custom
 * chains (e.g. Robinhood 4663), so pasting a token address into the selector errors. This resolves
 * an ERC-20 directly from the chain's public RPC (name/symbol/decimals) so the pasted token is still
 * selectable/importable — no backend/deploy required. Returns null (→ honest empty state) when the
 * address isn't a readable ERC-20; never fabricates metadata.
 */
export async function fetchOnchainTokenCurrencyInfo({
  chainId,
  address,
}: {
  chainId: UniverseChainId
  address: string
}): Promise<CurrencyInfo | null> {
  // Validate format (lowercased, length/0x checks). Contract() re-checksums a valid lowercase address.
  const validated = getValidAddress({ address, chainId, withEVMChecksum: false })
  if (!validated) {
    return null
  }

  const provider = createProvider({ chainId, rpcType: RPCType.Public })
  if (!provider) {
    return null
  }

  try {
    const contract = new Contract(validated, ERC20_ABI, provider)
    // decimals is the discriminator: a non-ERC-20 (or empty) address rejects it → we return null and
    // the UI shows "no results" rather than importing a bogus token. symbol/name are best-effort.
    const [decimalsRaw, symbol, name] = await Promise.all([
      contract.callStatic['decimals']?.(),
      contract.callStatic['symbol']?.().catch(() => undefined),
      contract.callStatic['name']?.().catch(() => undefined),
    ])

    if (decimalsRaw === undefined || decimalsRaw === null) {
      return null
    }
    const decimals = Number(decimalsRaw)
    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255) {
      return null
    }

    const currency = buildCurrency({
      chainId,
      address: validated,
      decimals,
      symbol: typeof symbol === 'string' ? symbol : undefined,
      name: typeof name === 'string' ? name : undefined,
    })
    if (!currency || currency.isNative) {
      return null
    }

    return buildCurrencyInfo({
      currency,
      currencyId: currencyId(currency),
      logoUrl: undefined,
      // Unverified on-chain import → default safety info (NonDefault list, Unknown protection). The
      // token-selector already renders its low-safety warning for NonDefault tokens.
      safetyInfo: getCurrencySafetyInfo(),
    })
  } catch (error) {
    // RPC hiccup / non-conforming contract — treat as "not found", never fabricate.
    logger.debug(FILE_NAME, 'fetchOnchainTokenCurrencyInfo', 'on-chain token read failed', {
      chainId,
      address: validated,
      error,
    })
    return null
  }
}

/**
 * Hook wrapper around {@link fetchOnchainTokenCurrencyInfo}. Only runs when a concrete `chainFilter`
 * is set and `searchQuery` is a valid address on that chain (and not skipped). Otherwise idle.
 */
export function useOnchainTokenSearchResults({
  searchQuery,
  chainFilter,
  skip,
}: {
  searchQuery: string | null
  chainFilter: UniverseChainId | null
  skip?: boolean
}): GqlResult<CurrencyInfo | undefined> {
  const normalizedAddress =
    chainFilter && searchQuery
      ? getValidAddress({ address: searchQuery.trim(), chainId: chainFilter, withEVMChecksum: false })
      : null

  const enabled = !skip && !!chainFilter && !!normalizedAddress

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['onchainTokenSearchFallback', chainFilter, normalizedAddress],
    queryFn:
      enabled && chainFilter && normalizedAddress
        ? async (): Promise<CurrencyInfo | null> =>
            fetchOnchainTokenCurrencyInfo({ chainId: chainFilter, address: normalizedAddress })
        : skipToken,
    staleTime: ONE_HOUR_MS,
    gcTime: ONE_DAY_MS,
  })

  return useMemo(
    () => ({ data: data ?? undefined, loading: enabled && isLoading, error: error ?? undefined, refetch }),
    [data, enabled, isLoading, error, refetch],
  )
}
