import { isExtensionApp } from '@universe/environment'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Flex, Separator, SpaceTokens, Text, TouchableArea } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { ChevronsIn } from 'ui/src/components/icons/ChevronsIn'
import { ChevronsOut } from 'ui/src/components/icons/ChevronsOut'
import { Skeleton } from 'ui/src/loading/Skeleton'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { EarnAnalyticsSurface, EarnEntryPoint } from 'uniswap/src/features/earn/analytics'
import { useEarnVaults } from 'uniswap/src/features/earn/hooks/useEarnVaults'
import { useIsEarnEnabled } from 'uniswap/src/features/earn/hooks/useIsEarnEnabled'
import { useLogEarnSurfaceViewed } from 'uniswap/src/features/earn/hooks/useLogEarnSurfaceViewed'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { hasEarnPosition } from 'uniswap/src/features/earn/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NumberType } from 'utilities/src/format/types'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { selectHasSeenUnfundedEarnCardReveal } from 'wallet/src/features/behaviorHistory/selectors'
import { setHasSeenUnfundedEarnCardReveal } from 'wallet/src/features/behaviorHistory/slice'
import { DiscoveryVaultRow } from 'wallet/src/features/earn/DiscoveryVaultRow'
import { EARNING_CARD_FRAME_PROPS } from 'wallet/src/features/earn/earnCardStyles'
import { UnfundedEarnCard } from 'wallet/src/features/earn/UnfundedEarnCard'

type EarningEntry = {
  vault: EarnVaultInfo
  position: EarnPositionInfo
  depositedUsd: number
  underlyingAmountRaw: string
}

export function HomeScreenEarningSection({
  evmAddress,
  isRevealReady,
  mb,
  mt,
  mx,
}: {
  evmAddress: Address
  /** Holds the unfunded card's one-time reveal until the section is actually visible. See UnfundedEarnCard. */
  isRevealReady?: boolean
  /** Optional margin-bottom, applied only when the section renders content. */
  mb?: SpaceTokens
  /** Optional margin-top, applied only when the section renders content. */
  mt?: SpaceTokens
  /** Optional horizontal margin, applied only when the section renders content. */
  mx?: SpaceTokens
}): JSX.Element | null {
  const isEarnEnabled = useIsEarnEnabled()

  const { vaultsSortedByPosition, positionsByVaultId, isLoadingVaults, isLoadingPositions, isError, refetch } =
    useEarnVaults({ account: evmAddress, enabled: isEarnEnabled })

  // Gates the unfunded discovery card: only wallets holding something are prompted to earn.
  const { data: portfolioTotal } = usePortfolioTotalValue({ evmAddress, enabled: isEarnEnabled })
  const hasWalletBalance = (portfolioTotal?.balanceUSD ?? 0) > 0

  const entries = useMemo<EarningEntry[]>(() => {
    const acc: EarningEntry[] = []
    vaultsSortedByPosition.forEach((vault) => {
      const position = positionsByVaultId.get(vault.id)
      if (!position || !hasEarnPosition(position)) {
        return
      }
      acc.push({ vault, position, depositedUsd: position.depositedUsd, underlyingAmountRaw: position.depositedRaw })
    })
    return acc
  }, [vaultsSortedByPosition, positionsByVaultId])

  // Vaults the wallet hasn't deposited into, surfaced as discovery rows when the card is expanded.
  const discoveryVaults = useMemo<EarnVaultInfo[]>(
    () =>
      vaultsSortedByPosition
        .filter((vault) => !hasEarnPosition(positionsByVaultId.get(vault.id)))
        .sort((vaultA, vaultB) => vaultB.apyPercent - vaultA.apyPercent),
    [vaultsSortedByPosition, positionsByVaultId],
  )
  const isLoading = isLoadingVaults || isLoadingPositions
  const isUnfundedCardVisible =
    entries.length === 0 && !isError && !isLoading && hasWalletBalance && discoveryVaults.length > 0

  const dispatch = useDispatch()
  const hasSeenReveal = useSelector(selectHasSeenUnfundedEarnCardReveal)
  // A funded wallet will never play the unfunded reveal — mark it seen so the
  // skeleton (suppressed until the reveal has played) comes back on later loads.
  const isEarningCardVisible = entries.length > 0
  useEffect(() => {
    if (isEarningCardVisible && !hasSeenReveal) {
      dispatch(setHasSeenUnfundedEarnCardReveal())
    }
  }, [isEarningCardVisible, hasSeenReveal, dispatch])

  useLogEarnSurfaceViewed({
    entryPoint: EarnEntryPoint.PortfolioEarnSection,
    isVisible: isEarnEnabled && (entries.length > 0 || isUnfundedCardVisible),
    surface: isExtensionApp ? EarnAnalyticsSurface.Extension : EarnAnalyticsSurface.Mobile,
  })

  if (!isEarnEnabled) {
    return null
  }

  // Surface the error state only when the load failed with nothing to show.
  if (isError && entries.length === 0) {
    return <EarningErrorCard mb={mb} mt={mt} mx={mx} onRetry={refetch} />
  }

  if (entries.length === 0) {
    // Placeholder while data loads so the card doesn't pop in. Users without positions briefly see it.
    // isLoadingPositions also covers wallet switches, where entries clear while the new wallet's positions load.
    // Suppressed before the reveal has played — skeleton → blank → reveal reads as a glitch.
    if (isLoading) {
      return hasSeenReveal ? <EarningCardSkeleton mb={mb} mt={mt} mx={mx} /> : null
    }
    if (isUnfundedCardVisible) {
      return <UnfundedEarnCard vaults={discoveryVaults} isRevealReady={isRevealReady} mb={mb} mt={mt} mx={mx} />
    }
    return null
  }

  return <EarningCard entries={entries} discoveryVaults={discoveryVaults} mb={mb} mt={mt} mx={mx} />
}

function EarningErrorCard({
  mb,
  mt,
  mx,
  onRetry,
}: {
  mb?: SpaceTokens
  mt?: SpaceTokens
  mx?: SpaceTokens
  onRetry: () => void
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex
      mb={mb}
      mt={mt}
      mx={mx}
      borderWidth="$spacing1"
      borderColor="$surface3"
      borderRadius="$rounded20"
      backgroundColor="$surface1"
      gap="$spacing12"
      px="$spacing16"
      py="$spacing12"
      testID={TestID.HomeEarningError}
    >
      <Text variant="body2" color="$neutral1">
        {t('home.earning.title')}
      </Text>
      <Flex row gap="$spacing12">
        <AlertTriangleFilled color="$neutral3" size={iconSizes.icon20} />
        <Flex fill>
          <Text variant="body3" color="$neutral2">
            {t('portfolio.overview.earn.errorLoadingBalance')}
          </Text>
          <TouchableArea testID={TestID.HomeEarningErrorRetry} onPress={onRetry}>
            <Text variant="body3" color="$accent1">
              {t('common.button.tryAgain')}
            </Text>
          </TouchableArea>
        </Flex>
      </Flex>
    </Flex>
  )
}

function EarningCardSkeleton({ mb, mt, mx }: { mb?: SpaceTokens; mt?: SpaceTokens; mx?: SpaceTokens }): JSX.Element {
  return (
    <Flex
      {...EARNING_CARD_FRAME_PROPS}
      mt={mt}
      mb={mb ?? EARNING_CARD_FRAME_PROPS.mb}
      mx={mx}
      testID={TestID.HomeEarningSkeleton}
    >
      <Skeleton>
        <Flex row alignItems="center" justifyContent="space-between" gap="$spacing8">
          <Text loading="no-shimmer" loadingPlaceholderText="Earning" variant="subheading2" />
          <Text loading="no-shimmer" loadingPlaceholderText="$1,000.00 • 4.30% est. APY" variant="body3" />
        </Flex>
      </Skeleton>
    </Flex>
  )
}

function EarningCard({
  entries,
  discoveryVaults,
  mb,
  mt,
  mx,
}: {
  entries: EarningEntry[]
  discoveryVaults: EarnVaultInfo[]
  mb?: SpaceTokens
  mt?: SpaceTokens
  mx?: SpaceTokens
}): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent, convertFiatAmountFormatted } = useLocalizationContext()
  const { navigateToEarnVault } = useWalletNavigation()
  const [isExpanded, setIsExpanded] = useState(false)
  const onSelectVault = useCallback(
    ({ vault, position }: { vault: EarnVaultInfo; position?: EarnPositionInfo }) => {
      navigateToEarnVault({ analyticsEntryPoint: EarnEntryPoint.PortfolioEarnSection, vault, position })
    },
    [navigateToEarnVault],
  )

  const { totalUsd, weightedApy } = useMemo(() => {
    let total = 0
    let weighted = 0
    entries.forEach(({ depositedUsd, vault }) => {
      total += depositedUsd
      weighted += depositedUsd * vault.apyPercent
    })
    return { totalUsd: total, weightedApy: total > 0 ? weighted / total : 0 }
  }, [entries])

  const toggleExpanded = (): void => setIsExpanded((prev) => !prev)

  return (
    <Flex {...EARNING_CARD_FRAME_PROPS} mt={mt} mb={mb ?? EARNING_CARD_FRAME_PROPS.mb} mx={mx}>
      <TouchableArea testID={TestID.HomeEarningToggle} onPress={toggleExpanded}>
        <Flex row alignItems="center" gap="$spacing8">
          <Text variant="subheading2" color="$neutral1">
            {t('home.earning.title')}
          </Text>
          <Flex fill row alignItems="center" justifyContent="flex-end" gap="$spacing8">
            {!isExpanded && (
              <Flex row alignItems="center">
                <Text variant="body3" color="$neutral1" numberOfLines={1}>
                  {convertFiatAmountFormatted(totalUsd, NumberType.FiatTokenDetails)}
                </Text>
                <Text variant="body3" color="$surface3" px="$spacing4">
                  {' • '}
                </Text>
                <Text variant="body3" color="$accent1">
                  {t('explore.earn.apy', { apy: formatPercent(weightedApy) })}
                </Text>
              </Flex>
            )}
            {isExpanded ? (
              <ChevronsIn color="$neutral2" size={iconSizes.icon20} />
            ) : (
              <ChevronsOut color="$neutral2" size={iconSizes.icon20} />
            )}
          </Flex>
        </Flex>
      </TouchableArea>

      {isExpanded && (
        <Flex gap="$spacing12">
          {entries.map((entry) => (
            <EarningRow key={entry.vault.id} entry={entry} onSelect={onSelectVault} />
          ))}
          {discoveryVaults.length > 0 && (
            <>
              <Separator borderColor="$surface3" />
              {discoveryVaults.map((vault) => (
                <DiscoveryVaultRow key={vault.id} vault={vault} onSelect={onSelectVault} />
              ))}
            </>
          )}
        </Flex>
      )}
    </Flex>
  )
}

const EarningRow = memo(function EarningRow({
  entry,
  onSelect,
}: {
  entry: EarningEntry
  onSelect: (args: { vault: EarnVaultInfo; position: EarnPositionInfo }) => void
}): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent, convertFiatAmountFormatted, formatCurrencyAmount } = useLocalizationContext()
  const currencyInfo = useCurrencyInfo(entry.vault.displayCurrencyId)
  const currency = currencyInfo?.currency

  const tokenAmount = useMemo(
    () => getCurrencyAmount({ value: entry.underlyingAmountRaw, valueType: ValueType.Raw, currency }),
    [entry.underlyingAmountRaw, currency],
  )

  const tokenAmountLabel = tokenAmount
    ? `${formatCurrencyAmount({ value: tokenAmount, type: NumberType.TokenNonTx })} ${currency?.symbol ?? ''}`.trim()
    : undefined

  const handlePress = useCallback(
    () => onSelect({ vault: entry.vault, position: entry.position }),
    [onSelect, entry.vault, entry.position],
  )

  return (
    <TouchableArea onPress={handlePress}>
      <Flex row alignItems="center" gap="$spacing12">
        <TokenLogo
          hideNetworkLogo
          url={currencyInfo?.logoUrl}
          chainId={currency?.chainId}
          symbol={currency?.symbol}
          name={currency?.name}
        />
        <Flex fill minWidth={0}>
          <Text variant="body2" color="$neutral1" numberOfLines={1}>
            {currency?.name ?? currency?.symbol ?? '-'}
          </Text>
          {tokenAmountLabel && (
            <Text variant="body3" color="$neutral2" numberOfLines={1}>
              {tokenAmountLabel}
            </Text>
          )}
        </Flex>
        <Flex alignItems="flex-end">
          <Text variant="body2" color="$neutral1">
            {convertFiatAmountFormatted(entry.depositedUsd, NumberType.FiatTokenDetails)}
          </Text>
          <Text variant="body3" color="$accent1">
            {t('explore.earn.apy', { apy: formatPercent(entry.vault.apyPercent) })}
          </Text>
        </Flex>
      </Flex>
    </TouchableArea>
  )
})
