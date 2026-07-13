import { useEffect, useMemo, useState } from 'react'
import { useTokenProjects } from 'uniswap/src/features/dataApi/tokenProjects/tokenProjects'
import type { EarnDepositSourceOption, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { getEarnDepositSourceOptions, getEarnDepositSourceOptionsBySupport } from 'uniswap/src/features/earn/utils'
import { usePortfolioBalances } from 'uniswap/src/features/portfolio/balances/hooks'
import { areCurrencyIdsEqual } from 'uniswap/src/utils/currencyId'

type UseEarnDepositSourcesParams = {
  vault: Pick<EarnVaultInfo, 'currencyId' | 'displayCurrencyId'> | null | undefined
  walletAddress?: Address
  isOpen?: boolean
  initialSourceCurrencyId?: string
  resetSelectionOnClose?: boolean
  skip?: boolean
}

type UseEarnDepositSourcesResult = {
  balanceLookupErrored: boolean
  balanceLookupHasData: boolean
  balanceLookupSettled: boolean
  depositSourceOptions: EarnDepositSourceOption[]
  /** Includes unsupported-chain balances; use this only for informational UI. */
  hasAnyBalanceForUnderlying: boolean
  /** Supported chains only; use this to decide whether the user can enter the deposit flow. */
  hasSupportedBalanceForUnderlying: boolean
  projectCurrencyIds: string[]
  selectedDepositSource: EarnDepositSourceOption | undefined
  selectedDepositSourceCurrencyId: string | undefined
  setSelectedDepositSourceCurrencyId: (currencyId: string) => void
  unsupportedDepositSourceOptions: EarnDepositSourceOption[]
}

export function useEarnDepositSources({
  vault,
  walletAddress,
  isOpen = true,
  initialSourceCurrencyId,
  resetSelectionOnClose = false,
  skip = false,
}: UseEarnDepositSourcesParams): UseEarnDepositSourcesResult {
  const shouldSkipLookups = skip || !isOpen
  const projectQueryIds = useMemo(
    () => (!shouldSkipLookups && vault?.currencyId ? [vault.currencyId] : []),
    [shouldSkipLookups, vault?.currencyId],
  )
  const { data: tokenProject, error: tokenProjectError } = useTokenProjects(projectQueryIds)
  const projectCurrencyIds = useMemo(() => tokenProject?.map((info) => info.currencyId) ?? [], [tokenProject])

  const portfolio = usePortfolioBalances({
    evmAddress: walletAddress,
    skip: shouldSkipLookups || !walletAddress,
  })

  const allDepositSourceOptions = useMemo<EarnDepositSourceOption[]>(() => {
    if (!vault) {
      return []
    }

    return getEarnDepositSourceOptions({
      portfolioBalances: portfolio.data,
      tokenProjectCurrencyIds: projectCurrencyIds,
      vault,
    })
  }, [portfolio.data, projectCurrencyIds, vault])
  const { supportedDepositSourceOptions: depositSourceOptions, unsupportedDepositSourceOptions } = useMemo(
    () => getEarnDepositSourceOptionsBySupport(allDepositSourceOptions),
    [allDepositSourceOptions],
  )

  // `initialSourceCurrencyId` seeds the initial pick once on mount. Callers that need to re-seed
  // (e.g. navigating back from the review sheet with a different source) trigger a fresh mount via
  // `navigation.replace`, which re-runs `useState` with the new initial value. Don't add an effect
  // that syncs the prop on later changes — that would stomp local user selections.
  const [selectedDepositSourceCurrencyId, setSelectedDepositSourceCurrencyId] = useState<string | undefined>(
    initialSourceCurrencyId,
  )

  useEffect(() => {
    if (!isOpen && resetSelectionOnClose) {
      setSelectedDepositSourceCurrencyId(undefined)
      return
    }

    if (depositSourceOptions.length === 0) {
      return
    }

    const stillAvailable =
      selectedDepositSourceCurrencyId !== undefined &&
      depositSourceOptions.some((option) =>
        areCurrencyIdsEqual(option.currencyInfo.currencyId, selectedDepositSourceCurrencyId),
      )
    const firstDepositSource = depositSourceOptions.at(0)

    if (!stillAvailable && firstDepositSource) {
      setSelectedDepositSourceCurrencyId(firstDepositSource.currencyInfo.currencyId)
    }
  }, [depositSourceOptions, isOpen, resetSelectionOnClose, selectedDepositSourceCurrencyId])

  const selectedDepositSource = useMemo(
    () =>
      depositSourceOptions.find(
        (option) =>
          selectedDepositSourceCurrencyId !== undefined &&
          areCurrencyIdsEqual(option.currencyInfo.currencyId, selectedDepositSourceCurrencyId),
      ) ?? depositSourceOptions.at(0),
    [depositSourceOptions, selectedDepositSourceCurrencyId],
  )

  const balanceLookupHasData = !shouldSkipLookups && portfolio.data !== undefined && tokenProject !== undefined
  const balanceLookupErrored = portfolio.error !== undefined || tokenProjectError !== undefined
  const balanceLookupSettled = balanceLookupHasData || balanceLookupErrored || !walletAddress || shouldSkipLookups

  return {
    balanceLookupErrored,
    balanceLookupHasData,
    balanceLookupSettled,
    depositSourceOptions,
    hasAnyBalanceForUnderlying: allDepositSourceOptions.length > 0,
    hasSupportedBalanceForUnderlying: depositSourceOptions.length > 0,
    projectCurrencyIds,
    selectedDepositSource,
    selectedDepositSourceCurrencyId,
    setSelectedDepositSourceCurrencyId,
    unsupportedDepositSourceOptions,
  }
}
