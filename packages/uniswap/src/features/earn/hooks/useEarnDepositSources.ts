import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTokenProjects } from 'uniswap/src/features/dataApi/tokenProjects/tokenProjects'
import {
  getFreshPortfolioBalanceData,
  hasFreshEnoughPortfolioBalanceData,
} from 'uniswap/src/features/earn/depositSourceFreshness'
import {
  getEarnDepositSourceOptions,
  getEarnDepositSourceOptionsBySupport,
} from 'uniswap/src/features/earn/depositSources'
import type { EarnDepositSourceOption, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { usePortfolioBalances } from 'uniswap/src/features/portfolio/balances/hooks'
import { areCurrencyIdsEqual } from 'uniswap/src/utils/currencyId'

type UseEarnDepositSourcesParams = {
  vault: Pick<EarnVaultInfo, 'currencyId' | 'displayCurrencyId'> | null | undefined
  walletAddress?: Address
  isOpen?: boolean
  initialSourceCurrencyId?: string
  minimumBalanceDataUpdatedAtMs?: number
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
  refetchBalanceLookup: () => void
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
  minimumBalanceDataUpdatedAtMs,
  resetSelectionOnClose = false,
  skip = false,
}: UseEarnDepositSourcesParams): UseEarnDepositSourcesResult {
  const shouldSkipLookups = skip || !isOpen
  const projectQueryIds = useMemo(
    () => (!shouldSkipLookups && vault?.currencyId ? [vault.currencyId] : []),
    [shouldSkipLookups, vault?.currencyId],
  )
  const {
    data: tokenProject,
    error: tokenProjectError,
    refetch: refetchTokenProjects,
  } = useTokenProjects(projectQueryIds)
  const projectCurrencyIds = useMemo(() => tokenProject?.map((info) => info.currencyId) ?? [], [tokenProject])

  const portfolio = usePortfolioBalances({
    evmAddress: walletAddress,
    skip: shouldSkipLookups || !walletAddress,
  })
  const refetchPortfolioBalances = portfolio.refetch
  const hasFreshEnoughPortfolioData = hasFreshEnoughPortfolioBalanceData({
    dataUpdatedAt: portfolio.dataUpdatedAt,
    minimumBalanceDataUpdatedAtMs,
  })
  const freshPortfolioData = getFreshPortfolioBalanceData({
    data: portfolio.data,
    dataUpdatedAt: portfolio.dataUpdatedAt,
    minimumBalanceDataUpdatedAtMs,
  })

  const allDepositSourceOptions = useMemo<EarnDepositSourceOption[]>(() => {
    if (!vault) {
      return []
    }

    return getEarnDepositSourceOptions({
      portfolioBalances: freshPortfolioData,
      tokenProjectCurrencyIds: projectCurrencyIds,
      vault,
    })
  }, [freshPortfolioData, projectCurrencyIds, vault])
  const { supportedDepositSourceOptions: depositSourceOptions, unsupportedDepositSourceOptions } = useMemo(
    () => getEarnDepositSourceOptionsBySupport({ depositSourceOptions: allDepositSourceOptions }),
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

  const balanceLookupHasData =
    !shouldSkipLookups && portfolio.data !== undefined && hasFreshEnoughPortfolioData && tokenProject !== undefined
  const balanceLookupErrored = portfolio.error !== undefined || tokenProjectError !== undefined
  const canUseErroredLookupAsSettled = minimumBalanceDataUpdatedAtMs === undefined
  const balanceLookupSettled =
    balanceLookupHasData ||
    (canUseErroredLookupAsSettled && balanceLookupErrored) ||
    !walletAddress ||
    shouldSkipLookups
  const refetchBalanceLookup = useCallback(() => {
    refetchPortfolioBalances()
    refetchTokenProjects?.()
  }, [refetchPortfolioBalances, refetchTokenProjects])

  return {
    balanceLookupErrored,
    balanceLookupHasData,
    balanceLookupSettled,
    depositSourceOptions,
    hasAnyBalanceForUnderlying: allDepositSourceOptions.length > 0,
    hasSupportedBalanceForUnderlying: depositSourceOptions.length > 0,
    projectCurrencyIds,
    refetchBalanceLookup,
    selectedDepositSource,
    selectedDepositSourceCurrencyId,
    setSelectedDepositSourceCurrencyId,
    unsupportedDepositSourceOptions,
  }
}
