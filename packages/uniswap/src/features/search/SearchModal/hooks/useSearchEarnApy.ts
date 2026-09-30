import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useEarnVaults } from 'uniswap/src/features/earn/hooks/useEarnVaults'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { selectEarnVaultForToken } from 'uniswap/src/features/earn/utils'
import { useEvent } from 'utilities/src/react/hooks'

/** Best Earn vault APY across the given currency ids, or undefined when no vault accepts any of them. */
export function getSearchEarnApyPercent({
  currencyIds,
  vaults,
}: {
  currencyIds: readonly string[]
  vaults: readonly EarnVaultInfo[]
}): number | undefined {
  return selectEarnVaultForToken({ tokenCurrencyIds: currencyIds, vaults })?.apyPercent
}

/**
 * Search V2 token rows show a token's Earn APY in place of its symbol. Returns a stable lookup so the list can
 * resolve it per row inside `renderItem`, which is a plain function and can't call hooks itself. The vault
 * list is fetched once here (not per row) and is small, so the per-row scan is cheap.
 */
export function useSearchEarnApy({
  enabled,
}: {
  enabled: boolean
}): (currencyIds: readonly string[]) => number | undefined {
  const { isTestnetModeEnabled } = useEnabledChains()
  const { vaults } = useEarnVaults({ enabled: enabled && !isTestnetModeEnabled })

  return useEvent((currencyIds: readonly string[]): number | undefined =>
    enabled ? getSearchEarnApyPercent({ currencyIds, vaults }) : undefined,
  )
}
