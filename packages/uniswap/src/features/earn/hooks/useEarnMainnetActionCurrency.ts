import { useMemo } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useTokenProjects } from 'uniswap/src/features/dataApi/tokenProjects/tokenProjects'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { isWrappedNativeEarnVault } from 'uniswap/src/features/earn/utils'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'

type UseEarnMainnetActionCurrencyResult = {
  actionsDisabled: boolean
  currencyIdForSwap: string | undefined
  currencyInfoForActions: CurrencyInfo | undefined
}

// Resolves the mainnet variant of a given currency. Wrapped-native vaults are a special case:
// the user-facing actions (swap, on-ramp) operate on the native token directly, not the wrapped
// one, so we return the display currency info instead of looking up via `useTokenProjects`.
export function useEarnMainnetActionCurrencyForVault({
  vault,
}: {
  vault: Pick<EarnVaultInfo, 'currencyId' | 'displayCurrencyId'> | null | undefined
}): UseEarnMainnetActionCurrencyResult {
  const displayCurrencyInfo = useCurrencyInfo(vault?.displayCurrencyId)
  const mainnetCurrencyInfo = useMainnetTokenProjectVariant(vault?.currencyId)
  const isWrappedNativeVault = vault ? isWrappedNativeEarnVault(vault) : false
  const fallbackMainnetCurrencyInfo = pickMainnetVariant(displayCurrencyInfo)
  const currencyInfoForActions = isWrappedNativeVault
    ? (displayCurrencyInfo ?? undefined)
    : (mainnetCurrencyInfo ?? fallbackMainnetCurrencyInfo)

  return {
    actionsDisabled: !currencyInfoForActions,
    currencyIdForSwap: currencyInfoForActions?.currencyId,
    currencyInfoForActions,
  }
}

// Resolves the mainnet variant of a single token id. Used by entry points that have a currency
// id but no vault context (e.g. the "You need {symbol}" route from token details).
export function useEarnMainnetActionCurrencyForToken({
  currencyId,
}: {
  currencyId: string | undefined
}): UseEarnMainnetActionCurrencyResult {
  const directCurrencyInfo = useCurrencyInfo(currencyId)
  const mainnetCurrencyInfo = useMainnetTokenProjectVariant(currencyId)
  const fallbackMainnetCurrencyInfo = pickMainnetVariant(directCurrencyInfo)
  const currencyInfoForActions = mainnetCurrencyInfo ?? fallbackMainnetCurrencyInfo

  return {
    actionsDisabled: !currencyInfoForActions,
    currencyIdForSwap: currencyInfoForActions?.currencyId,
    currencyInfoForActions,
  }
}

function useMainnetTokenProjectVariant(currencyId: string | undefined): CurrencyInfo | undefined {
  const projectQueryIds = useMemo(() => (currencyId ? [currencyId] : []), [currencyId])
  const { data: tokenProject } = useTokenProjects(projectQueryIds)
  return useMemo(() => tokenProject?.find((info) => info.currency.chainId === UniverseChainId.Mainnet), [tokenProject])
}

function pickMainnetVariant(currencyInfo: Maybe<CurrencyInfo>): CurrencyInfo | undefined {
  return currencyInfo?.currency.chainId === UniverseChainId.Mainnet ? currencyInfo : undefined
}
