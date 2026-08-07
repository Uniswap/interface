import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, LinearGradient, Text, TouchableArea } from 'ui/src'
import { Sidebar } from 'ui/src/components/icons/Sidebar'
import { iconSizes, spacing } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import { ItemRowInfo } from 'uniswap/src/components/lists/OnchainItemList/OnchainItemList'
import { OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { SelectorBaseList } from 'uniswap/src/components/lists/SelectorBaseList'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { type PortfolioBalancesResult } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import { usePortfolioTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioTokenOptions'
import { OnSelectCurrency } from 'uniswap/src/components/TokenSelector/types'
import {
  TOKEN_SELECTOR_V2_CONTROL_HEIGHT,
  TOKEN_SELECTOR_V2_SIDEBAR_EDGE_BLEED,
  TOKEN_SELECTOR_V2_SIDEBAR_ROW_HEIGHT,
  TOKEN_SELECTOR_V2_SIDEBAR_TOTAL_WIDTH,
} from 'uniswap/src/components/TokenSelectorV2/constants'
import { usePendingWarningSelection } from 'uniswap/src/components/TokenSelectorV2/hooks/usePendingWarningSelection'
import { TokenSelectorV2SkeletonOverlay } from 'uniswap/src/components/TokenSelectorV2/TokenSelectorV2Skeleton'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import type { AddressGroup } from 'uniswap/src/features/accounts/store/types/AccountsState'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { DataApiOutageBanner } from 'uniswap/src/features/dataApi/outage/DataApiOutageBanner'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getTokenWarningSeverity } from 'uniswap/src/features/tokens/warnings/safetyUtils'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'

const SIDEBAR_BOTTOM_FADE_HEIGHT = 32
const COLLAPSE_TOGGLE_SIZE = 28

const SIDEBAR_ROW_LAYOUT = {
  dynamicHeight: true,
  collapsedHeightPx: TOKEN_SELECTOR_V2_SIDEBAR_ROW_HEIGHT,
  expandedHeightPx: TOKEN_SELECTOR_V2_SIDEBAR_ROW_HEIGHT,
}

function SidebarTokenRow({ option, onPress }: { option: TokenOption; onPress: () => void }): JSX.Element {
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()
  const { currencyInfo, quantity, balanceUSD } = option
  const { currency } = currencyInfo

  // Blocked rows stay pressable (dimmed only) so the press opens TokenWarningModal's blocked explanation.
  const isBlocked = getTokenWarningSeverity(currencyInfo) === WarningSeverity.Blocked

  return (
    <TouchableArea
      accessibilityLabel={currency.name ?? currency.symbol}
      accessibilityRole="button"
      opacity={isBlocked ? 0.5 : 1}
      testID={`${TestID.TokenSelectorV2SidebarTokenOptionPrefix}${currency.chainId}-${currency.symbol}`}
      onPress={onPress}
    >
      <Flex
        row
        alignItems="center"
        gap="$spacing8"
        height={TOKEN_SELECTOR_V2_SIDEBAR_ROW_HEIGHT}
        pl="$spacing12"
        pr={spacing.spacing12 + TOKEN_SELECTOR_V2_SIDEBAR_EDGE_BLEED}
      >
        <TokenLogo
          chainId={currency.chainId}
          name={currency.name}
          size={iconSizes.icon28}
          symbol={currency.symbol}
          url={currencyInfo.logoUrl}
        />
        <Flex fill>
          <Text color="$neutral1" numberOfLines={1} variant="body3">
            {currency.name}
          </Text>
          <Text color="$neutral2" numberOfLines={1} variant="body4">
            {currency.symbol}
          </Text>
        </Flex>
        <Flex alignItems="flex-end">
          <Text color="$neutral1" variant="body3">
            {convertFiatAmountFormatted(balanceUSD, NumberType.FiatTokenQuantity)}
          </Text>
          <Text color="$neutral2" variant="body4">
            {formatNumberOrString({ value: quantity, type: NumberType.TokenNonTx })}
          </Text>
        </Flex>
      </Flex>
    </TouchableArea>
  )
}

export interface MyTokensSidebarProps {
  addresses: AddressGroup
  chainFilter: UniverseChainId | null
  chainIds?: UniverseChainId[]
  searchFilter: string | null
  portfolioData: PortfolioBalancesResult
  onSelectCurrency: OnSelectCurrency
  onCollapse: () => void
}

/**
 * "My tokens" sidebar of the dual-pane V2 selector (SWAP-3039, Figma 750:13179).
 * Web-desktop-only by usage (the shell only mounts it there); virtualized from day one
 * via SelectorBaseList. Stays visible during search (header + zero rows when nothing
 * matches, Figma 750:15766) and refilters on chainFilter.
 */
export const MyTokensSidebar = memo(function MyTokensSidebar({
  addresses,
  chainFilter,
  chainIds,
  searchFilter,
  portfolioData,
  onSelectCurrency,
  onCollapse,
}: MyTokensSidebarProps): JSX.Element {
  const { t } = useTranslation()

  const isConnected = Boolean(addresses.evmAddress ?? addresses.svmAddress)

  const {
    data: tokens,
    loading,
    error,
    refetch,
  } = usePortfolioTokenOptions({
    chainFilter,
    chainIds,
    searchFilter: searchFilter ?? undefined,
    portfolioData,
  })

  const { handleTokenPress, pendingModal } = usePendingWarningSelection({ showTokenWarnings: true, onSelectCurrency })

  // Stale balances + live error → outage warning, mirroring the single-pane Your-tokens header.
  const isPortfolioOutage = Boolean(tokens) && Boolean(error)

  const sections: OnchainItemSection<TokenOption>[] | undefined = useMemo(() => {
    if (!tokens) {
      return undefined
    }
    // Loaded-but-empty outside of search returns no sections so the emptyElement renders.
    if (tokens.length === 0 && !searchFilter) {
      return []
    }
    const optionsWithLayout = tokens.map((token) => ({ ...token, rowLayout: SIDEBAR_ROW_LAYOUT }))
    return [
      {
        sectionKey: OnchainItemSectionName.YourTokens,
        data: optionsWithLayout,
        // The sidebar owns its header; suppress the in-list section header.
        sectionHeader: <Flex />,
        sectionHeaderHeight: 0,
      },
    ]
  }, [tokens, searchFilter])

  const renderItem = useEvent(
    ({ item, section, index }: ItemRowInfo<TokenOption>): JSX.Element => (
      <SidebarTokenRow option={item} onPress={(): void => handleTokenPress(item, section, index)} />
    ),
  )

  // Position-independent: currencyId is unique within the portfolio list, so refiltering keeps row identity.
  const keyExtractor = useEvent((item: TokenOption): string => `sidebar-${item.currencyInfo.currencyId}`)

  // During search the sidebar keeps its header and simply shows zero rows on no match.
  const emptyElement = useMemo(() => {
    if (searchFilter) {
      return <Flex />
    }
    return (
      <Flex
        gap="$spacing4"
        pl="$spacing12"
        pr={spacing.spacing12 + TOKEN_SELECTOR_V2_SIDEBAR_EDGE_BLEED}
        pt="$spacing16"
      >
        <Text color="$neutral2" variant="body3">
          {isConnected ? t('tokens.selectorV2.myTokens.empty.title') : t('tokens.selectorV2.myTokens.disconnected')}
        </Text>
        {isConnected && (
          <Text color="$neutral3" variant="body4">
            {t('tokens.selectorV2.myTokens.empty.description')}
          </Text>
        )}
      </Flex>
    )
  }, [searchFilter, isConnected, t])

  return (
    // `fill` is load-bearing: without flex:1 the sidebar's height collapses to auto and AutoSizer measures 0 rows.
    <Flex
      fill
      gap="$spacing4"
      pt="$spacing12"
      testID={TestID.TokenSelectorV2Sidebar}
      width={TOKEN_SELECTOR_V2_SIDEBAR_TOTAL_WIDTH}
    >
      <Flex
        row
        alignItems="center"
        gap="$spacing8"
        height={TOKEN_SELECTOR_V2_CONTROL_HEIGHT}
        pl="$spacing12"
        pr={spacing.spacing12 + TOKEN_SELECTOR_V2_SIDEBAR_EDGE_BLEED}
        py="$spacing4"
      >
        <AccountIcon address={addresses.evmAddress ?? addresses.svmAddress} size={iconSizes.icon24} />
        <Text color="$neutral1" flex={1} numberOfLines={1} variant="body2">
          {t('tokens.selectorV2.myTokens.title')}
        </Text>
        <TouchableArea
          accessibilityLabel={t('tokens.selectorV2.myTokens.collapse')}
          accessibilityRole="button"
          testID={TestID.TokenSelectorV2SidebarCollapse}
          onPress={onCollapse}
        >
          <Flex
            alignItems="center"
            backgroundColor="$surface2"
            borderRadius="$rounded6"
            height={COLLAPSE_TOGGLE_SIZE}
            justifyContent="center"
            width={COLLAPSE_TOGGLE_SIZE}
          >
            <Sidebar color="$neutral3" size="$icon.16" />
          </Flex>
        </TouchableArea>
      </Flex>
      {isPortfolioOutage && (
        <Flex pl="$spacing12" pr={spacing.spacing12 + TOKEN_SELECTOR_V2_SIDEBAR_EDGE_BLEED}>
          {/* surface1 inverts the banner's default surface2 — the sidebar backdrop is already surface2 */}
          <DataApiOutageBanner backgroundColor="$surface1" />
        </Flex>
      )}
      <Flex fill position="relative">
        <SelectorBaseList<TokenOption>
          chainFilter={chainFilter}
          emptyElement={emptyElement}
          hasError={Boolean(error && !tokens)}
          keyExtractor={keyExtractor}
          loading={loading}
          refetch={refetch}
          renderItem={renderItem}
          renderedInModal={false}
          sections={isConnected ? sections : []}
        />
        {Boolean(loading && !tokens?.length) && <TokenSelectorV2SkeletonOverlay backgroundColor="$surface2" />}
        {/* Rows fade out at the sidebar's bottom edge; fades to surface2, the sidebar's backdrop */}
        <LinearGradient
          colors={['transparent', '$surface2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          height={SIDEBAR_BOTTOM_FADE_HEIGHT}
          pointerEvents="none"
          position="absolute"
          bottom={0}
          left={0}
          right={0}
        />
      </Flex>
      {pendingModal}
    </Flex>
  )
})
