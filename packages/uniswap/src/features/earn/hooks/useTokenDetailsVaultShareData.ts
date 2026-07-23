import { useMemo } from 'react'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useEarnVaults } from 'uniswap/src/features/earn/hooks/useEarnVaults'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import {
  getTokenProjectCurrencyIds,
  hasEarnPosition,
  type TokenProjectTokenForEarn,
} from 'uniswap/src/features/earn/utils'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { areCurrencyIdsEqual, buildCurrencyId } from 'uniswap/src/utils/currencyId'

/**
 * Inverse of `selectEarnVaultForToken`: given token currency ids, find the vault whose ERC-4626 share
 * token IS one of those tokens (i.e. the token is itself a vault share token, e.g. GTUSDCP).
 */
export function selectVaultByShareToken({
  tokenCurrencyIds,
  vaults,
}: {
  tokenCurrencyIds: readonly string[]
  vaults: readonly EarnVaultInfo[]
}): EarnVaultInfo | undefined {
  return vaults.find((vault) => {
    const shareTokenCurrencyId = buildCurrencyId(vault.chainId, vault.vaultAddress)
    return tokenCurrencyIds.some((id) => areCurrencyIdsEqual(id, shareTokenCurrencyId))
  })
}

export type TokenDetailsVaultShareData = {
  /** The vault whose share token is the token currently being viewed, if any. */
  vault: EarnVaultInfo | undefined
  /** Currency info for the vault's underlying (deposit) token, used for the banner logo + symbol. */
  underlyingCurrencyInfo: Maybe<CurrencyInfo>
  isLoggedIn: boolean
  hasLoadedPositions: boolean
  /** True once positions have loaded and the user holds shares of this vault. */
  userHasPosition: boolean
}

type UseTokenDetailsVaultShareDataParams = {
  enabled: boolean
  account: Address | undefined
  /** Currency id for the token on the current page chain. */
  activeCurrencyId: string | undefined
  /** Project tokens used to build the candidate currency id list when matching vaults. */
  tokenProjectTokens: readonly TokenProjectTokenForEarn[] | undefined
}

/**
 * Shared TDP vault-share data hook. Detects when the token being viewed is itself a vault share
 * token (e.g. GTUSDCP) and resolves the backing vault + the user's position in it. Inputs are
 * passed in explicitly so the hook works identically on web (TDP store) and mobile.
 */
export function useTokenDetailsVaultShareData({
  enabled,
  account,
  activeCurrencyId,
  tokenProjectTokens,
}: UseTokenDetailsVaultShareDataParams): TokenDetailsVaultShareData {
  const tokenCurrencyIds = useMemo(() => {
    const ids = new Set(getTokenProjectCurrencyIds(tokenProjectTokens))
    if (activeCurrencyId) {
      ids.add(activeCurrencyId)
    }
    return Array.from(ids)
  }, [activeCurrencyId, tokenProjectTokens])

  const { hasLoadedPositions, positionsByVaultId, vaults } = useEarnVaults({
    account,
    enabled: enabled && tokenCurrencyIds.length > 0,
  })

  const vault = useMemo(() => selectVaultByShareToken({ tokenCurrencyIds, vaults }), [tokenCurrencyIds, vaults])
  const underlyingCurrencyInfo = useCurrencyInfo(vault?.displayCurrencyId)
  const earnPosition = vault ? positionsByVaultId.get(vault.id) : undefined
  const userHasPosition = hasLoadedPositions && hasEarnPosition(earnPosition)

  return {
    vault,
    underlyingCurrencyInfo,
    isLoggedIn: !!account,
    hasLoadedPositions,
    userHasPosition,
  }
}
