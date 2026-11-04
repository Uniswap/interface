import type { UniverseChainId } from '@universe/chains'
import { DynamicConfigs, useIsTokenCategoriesEnabled } from '@universe/gating'
import { Flex, ScrollView, Text, TouchableArea, useMedia, ModalCloseIcon } from '@universe/mycelium'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { AdaptiveWebPopoverContentCompat, PopoverCompat as Popover } from '@universe/mycelium/popover-compat'
import { fonts } from '@universe/mycelium/tokens'
import { TestID } from '@universe/test'
import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter/NetworkFilter'
import { useAllTokenCategories } from 'uniswap/src/data/apiClients/dataApiService/categories/useAllTokenCategories'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { SearchTextInput } from 'uniswap/src/features/search/SearchTextInput'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { useCategoryOrder } from 'uniswap/src/features/tokenCategories/useCategoryOrder'
import { type RestTokens, useRestTokensQuery } from 'uniswap/src/features/tokens/useCurrencyInfo'
import {
  useMarginFormStore,
  useMarginFormStoreActions,
} from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { useEvent } from 'utilities/src/react/hooks'
import { MARGIN_CHAIN_ID, type MarginTokenInfo } from '~/constants/margin'
import { MarginVenueLogo } from '~/features/margin/components/MarginVenueLogo'
import {
  getMarginCurrencyInfo,
  getMarginPairLogoProps,
  useMarginCurrencyInfos,
} from '~/features/margin/hooks/useMarginCurrencyInfos'
import { useMarginMarkets } from '~/features/margin/hooks/useMarginMarkets'
import { marginTokenCurrencyId } from '~/features/margin/utils/marginCurrencies'
import { getMarginDirectionStyle, lltvToPercent, marginVenueLabel } from '~/features/margin/utils/marginFormat'
import {
  marginMarketDirection,
  marginPairLabel,
  marginPairLegs,
  marginUnwrapName,
} from '~/features/margin/utils/marginTokenDisplay'
import { MarginCategoryChips, MarginTokenFilter } from '~/pages/Swap/Margin/components/MarginMarketSelectorFilters'
import { MarginPairRow, PairColumnHeader } from '~/pages/Swap/Margin/components/MarginMarketSelectorRows'
import { MarginSideToggle } from '~/pages/Swap/Margin/components/MarginSideToggle'
import { useMarginSupportedChainIds } from '~/pages/Swap/Margin/hooks/useMarginSupportedChainIds'
import {
  buildMarginPairRows,
  filterMarginPairRows,
  marginAssetFilterOptions,
  marginDebtFilterOptions,
  marginPairCategoryIds,
  type MarginPairRowData,
  marginTokenKey,
} from '~/pages/Swap/Margin/marginPairVenueList'

// Wide enough for the chips and both token filters on one row.
const PANEL_WIDTH = 760
const LIST_MAX_HEIGHT = 448
// Below this the token filters wrap under the category chips instead of squeezing them.
const CATEGORY_ROW_MIN_WIDTH = 240
const SIDE_TOGGLE_WIDTH = 128
const SEARCH_HEIGHT = 40
const NO_CATEGORIES: TokenCategory[] = []

function tokenDisplayName({
  token,
  currencyInfos,
}: {
  token: MarginTokenInfo
  currencyInfos: Map<string, CurrencyInfo>
}): string {
  const info = getMarginCurrencyInfo({ currencyInfos, currencyId: marginTokenCurrencyId(token) })
  return marginUnwrapName({ address: token.address, name: info?.currency.name ?? token.symbol })
}

// Collapsed pair header: dual token icons, "<base> / <quote>", a Long/Short badge, the venue +
// LLTV, and a chevron. Tapping it opens the selector modal.
function PairHeaderButton({
  onPress,
  currencyInfos,
  trailing,
}: {
  onPress: () => void
  currencyInfos: Map<string, CurrencyInfo>
  trailing?: ReactNode
}): JSX.Element | null {
  const { t } = useTranslation()
  const pairKey = useMarginFormStore((s) => s.pairKey)
  const { getPairMarket, markets } = useMarginMarkets()
  const market = getPairMarket(pairKey) ?? markets.at(0)

  // MarginFormMarketsState owns the loading / error / empty surface — it renders directly below this
  // in MarginForm's else-branch, with the same copy, the same testIDs and its own retry. Rendering a
  // second copy here stacked two identical boxes with two Retry buttons on any markets failure.
  if (!market) {
    return null
  }
  // Ground truth is the resolved market's own direction — never the raw side toggle, which can
  // diverge from what's actually selected.
  const direction =
    market.direction ??
    marginMarketDirection({
      collateralToken: market.collateral.address,
      debtToken: market.debt.address,
    })
  const directionStyle = getMarginDirectionStyle(direction)
  // Sharing its row with a trailing action, the card tightens so the pair still reads on one line.
  const isCompact = Boolean(trailing)

  const button = (
    <TouchableArea
      flex={isCompact ? 1 : undefined}
      minWidth={0}
      borderRadius="$rounded20"
      borderWidth={1}
      borderColor="$surface3"
      p={isCompact ? '$spacing12' : '$spacing16'}
      hoverStyle={{ backgroundColor: '$surface2' }}
      onPress={onPress}
    >
      <Flex row alignItems="center" gap={isCompact ? '$spacing8' : '$spacing12'}>
        <SplitLogo
          orientation="stacked"
          size={isCompact ? 32 : 40}
          chainId={MARGIN_CHAIN_ID}
          inputCurrencyInfo={null}
          outputCurrencyInfo={null}
          {...getMarginPairLogoProps({ ...marginPairLegs(market), currencyInfos })}
        />
        <Flex fill minWidth={0} gap="$spacing2">
          <Flex row alignItems="center" gap="$spacing8">
            <Text variant={isCompact ? 'subheading2' : 'body1'} color="$neutral1" numberOfLines={1} flexShrink={1}>
              {marginPairLabel({ market })}
            </Text>
            {/* Compact, the side toggle right above already says it, and the stacked pair logo needs the
                room for the pair to read on one line. */}
            {isCompact ? null : (
              <Flex
                px="$spacing8"
                py="$spacing2"
                flexShrink={0}
                borderRadius="$roundedFull"
                backgroundColor={directionStyle.backgroundColor}
              >
                <Text variant="buttonLabel4" color={directionStyle.color}>
                  {direction === MarginDirection.SHORT ? t('margin.side.short') : t('margin.side.long')}
                </Text>
              </Flex>
            )}
          </Flex>
          <Flex row alignItems="center" gap="$spacing6">
            <MarginVenueLogo venue={market.venue} size="$icon.16" />
            <Text variant="body4" color="$neutral2" numberOfLines={1} flexShrink={1}>
              {market.lltvWad !== '0'
                ? t('margin.market.venueLltv', {
                    venue: marginVenueLabel(market.venue),
                    lltv: lltvToPercent(market.lltvWad).toFixed(0),
                  })
                : marginVenueLabel(market.venue)}
            </Text>
          </Flex>
        </Flex>
        <RotatableChevron direction="right" size="$icon.20" color="$neutral2" />
      </Flex>
    </TouchableArea>
  )
  // Rendered only beside a resolved market, so a trailing action never stands alone over the
  // markets loading/error state.
  return trailing ? (
    <Flex row alignItems="center" gap="$spacing8">
      {button}
      {trailing}
    </Flex>
  ) : (
    button
  )
}

function SelectorTitleRow({ onClose, showClose }: { onClose: () => void; showClose: boolean }): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex row alignItems="center" gap="$spacing12">
      <Flex fill>
        <Text variant="subheading1" color="$neutral1">
          {t('margin.selector.title')}
        </Text>
      </Flex>
      <Flex width={SIDE_TOGGLE_WIDTH}>
        <MarginSideToggle />
      </Flex>
      {showClose ? <ModalCloseIcon onClose={onClose} /> : null}
    </Flex>
  )
}

function ListStatus({ isLoading, emptyCopy }: { isLoading: boolean; emptyCopy: string }): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex
      p="$spacing16"
      alignItems="center"
      testID={isLoading ? TestID.MarginMarketsLoading : TestID.MarginMarketsEmpty}
    >
      <Text variant="body3" color="$neutral2">
        {isLoading ? t('common.loading') : emptyCopy}
      </Text>
    </Flex>
  )
}

// Pairs over one /margin/markets fetch. Only the pair is picked here: the venue is routed, and changed only
// from the receipt's venue picker. Lives inside the modal / popover so it unmounts on close, which is what
// resets the search and filters between openings.
function MarketSelectorContent({ onClose, isSheet }: { onClose: () => void; isSheet: boolean }): JSX.Element {
  const supportedChainIds = useMarginSupportedChainIds()
  const { t } = useTranslation()
  const media = useMedia()
  const compact = media.md
  const { setMarginFormState } = useMarginFormStoreActions()
  const direction = useMarginFormStore((s) => s.side)
  const excludedVenues = useMarginFormStore((s) => s.excludedVenues)
  const currencyInfos = useMarginCurrencyInfos()

  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined)
  const [assetFilter, setAssetFilter] = useState<string | undefined>(undefined)
  const [debtFilter, setDebtFilter] = useState<string | undefined>(undefined)
  const [chainFilter, setChainFilter] = useState<UniverseChainId | null>(null)

  const { groups, isLoading } = useMarginMarkets()
  const allRows = useMemo(() => buildMarginPairRows({ groups, excludedVenues }), [groups, excludedVenues])

  // A plain callback, not useEvent: the filters below must recompute when currency names resolve.
  const tokenName = useCallback((token: MarginTokenInfo) => tokenDisplayName({ token, currencyInfos }), [currencyInfos])

  // Category chips are the data API's own token taxonomy (the token selector's chips), matched on each
  // pair's traded token; with categories off, or no listed token tagged, there are no chips.
  const isTokenCategoriesEnabled = useIsTokenCategoriesEnabled()
  const baseTokens = useMemo(
    () => [...new Map(groups.map((group) => [marginTokenKey(group.base), group.base])).values()],
    [groups],
  )
  const baseCurrencyIds = useMemo(() => baseTokens.map((token) => marginTokenCurrencyId(token)), [baseTokens])
  // Positional: the response lines up with the request, and WETH is requested as native ETH, so keying
  // by the response's own address would miss it.
  const selectCategoryIdsByToken = useCallback(
    (tokens: RestTokens) =>
      new Map(baseTokens.map((token, index) => [marginTokenKey(token), tokens[index]?.categoryIds ?? []])),
    [baseTokens],
  )
  const { data: categoryIdsByToken } = useRestTokensQuery(baseCurrencyIds, {
    skip: !isTokenCategoriesEnabled,
    select: selectCategoryIdsByToken,
  })
  const { categories } = useAllTokenCategories()
  const orderedCategories = useCategoryOrder({ categories, config: DynamicConfigs.TokenCategoriesOrder })

  const directionRows = useMemo(
    () => filterMarginPairRows({ rows: allRows, direction, chainId: chainFilter ?? undefined, tokenName }),
    [allRows, direction, chainFilter, tokenName],
  )
  const chipCategories = useMemo(() => {
    if (!categoryIdsByToken) {
      return NO_CATEGORIES
    }
    const present = marginPairCategoryIds({ rows: directionRows, categoryIdsByToken })
    return orderedCategories.filter((category) => present.has(category.id))
  }, [categoryIdsByToken, directionRows, orderedCategories])
  const activeCategoryId = chipCategories.some((category) => category.id === categoryId) ? categoryId : undefined

  const sideRows = useMemo(
    () => filterMarginPairRows({ rows: directionRows, categoryId: activeCategoryId, categoryIdsByToken, tokenName }),
    [directionRows, activeCategoryId, categoryIdsByToken, tokenName],
  )
  // A token filter the current side has no pair for (cbBTC longs but never shorts; a long's USDC debt
  // is never a short's) stands down rather than emptying the list after a side flip.
  const activeAsset = sideRows.some((row) => marginTokenKey(row.group.base) === assetFilter) ? assetFilter : undefined
  const activeDebt = marginDebtFilterOptions(sideRows).some((option) => option.address === debtFilter)
    ? debtFilter
    : undefined

  const rows = useMemo(
    () => filterMarginPairRows({ rows: sideRows, query, asset: activeAsset, debt: activeDebt, tokenName }),
    [sideRows, query, activeAsset, activeDebt, tokenName],
  )
  // Faceted: the asset menu lists only what the chosen debt asset trades against and vice versa, so a
  // pick is never a dead end.
  const assetOptions = useMemo(
    () => marginAssetFilterOptions(filterMarginPairRows({ rows: sideRows, debt: activeDebt, tokenName })),
    [sideRows, activeDebt, tokenName],
  )
  const debtOptions = useMemo(
    () => marginDebtFilterOptions(filterMarginPairRows({ rows: sideRows, asset: activeAsset, tokenName })),
    [sideRows, activeAsset, tokenName],
  )

  // Pair and direction in one write. Any venue pin is cleared so routing picks the pair's market, and any
  // explicit payment selection so the new market's default re-resolves.
  const onSelectPair = useEvent(({ group }: MarginPairRowData) => {
    setMarginFormState({
      pairKey: group.pairKey,
      paymentToken: undefined,
      side: group.direction,
      pinnedVenue: undefined,
    })
    onClose()
  })

  const isFiltered = Boolean(query.trim() || chainFilter || activeCategoryId || activeAsset || activeDebt)
  const emptyCopy = isFiltered
    ? t('margin.selector.empty')
    : direction === MarginDirection.SHORT
      ? t('margin.selector.emptySideShort')
      : t('margin.selector.emptySideLong')

  return (
    <Flex p={isSheet ? '$spacing4' : '$spacing20'} gap="$spacing16" width="100%">
      <SelectorTitleRow showClose={!isSheet} onClose={onClose} />
      <SearchTextInput
        borderColor="$surface3"
        borderWidth={1}
        placeholder={t('margin.selector.searchPlaceholder')}
        px="$spacing12"
        py="$none"
        minHeight={SEARCH_HEIGHT}
        fontSize={fonts.body2.fontSize}
        lineHeight={fonts.body2.fontSize}
        value={query}
        endAdornment={
          <NetworkFilter
            includeAllNetworks
            dropdownOnMobile
            showSearchInput={false}
            chainIds={supportedChainIds}
            selectedChain={chainFilter}
            onPressChain={setChainFilter}
          />
        }
        onChangeText={setQuery}
      />
      {/* Raised so an open token-filter menu drops over the list below. */}
      <Flex row alignItems="center" flexWrap="wrap" gap="$spacing8" zIndex={1}>
        <Flex flexGrow={1} flexShrink={1} flexBasis={0} minWidth={CATEGORY_ROW_MIN_WIDTH}>
          <MarginCategoryChips
            categories={chipCategories}
            categoryId={activeCategoryId}
            onSelectCategory={setCategoryId}
          />
        </Flex>
        <Flex row alignItems="center" gap="$spacing8">
          <MarginTokenFilter
            label={
              direction === MarginDirection.SHORT
                ? t('margin.selector.assetFilter.short')
                : t('margin.selector.assetFilter.long')
            }
            anyLabel={
              direction === MarginDirection.SHORT
                ? t('margin.selector.assetFilter.anyShort')
                : t('margin.selector.assetFilter.anyLong')
            }
            currencyInfos={currencyInfos}
            options={assetOptions}
            selected={activeAsset}
            testID={TestID.MarginAssetFilter}
            optionTestIdPrefix={TestID.MarginAssetFilterOptionPrefix}
            onSelect={setAssetFilter}
          />
          <MarginTokenFilter
            label={t('margin.selector.debtFilter.label')}
            anyLabel={t('margin.selector.debtFilter.any')}
            currencyInfos={currencyInfos}
            options={debtOptions}
            selected={activeDebt}
            testID={TestID.MarginDebtFilter}
            optionTestIdPrefix={TestID.MarginDebtFilterOptionPrefix}
            alignRight
            onSelect={setDebtFilter}
          />
        </Flex>
      </Flex>
      <Flex>
        <PairColumnHeader compact={compact} />
        <ScrollView maxHeight={LIST_MAX_HEIGHT} showsVerticalScrollIndicator={false}>
          <Flex gap="$spacing4">
            {rows.map((row) => (
              <MarginPairRow
                key={row.group.key}
                row={row}
                currencyInfos={currencyInfos}
                compact={compact}
                onSelect={onSelectPair}
              />
            ))}
            {rows.length === 0 ? <ListStatus isLoading={isLoading} emptyCopy={emptyCopy} /> : null}
          </Flex>
        </ScrollView>
      </Flex>
    </Flex>
  )
}

// "Select a pair" on the shared Modal (a bottom sheet on mobile web): the form's pair card, and the
// chart header in the compact layout.
export function MarginMarketSelectorModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }): JSX.Element {
  return (
    <Modal
      name={ModalName.MarginMarketSelector}
      isModalOpen={isOpen}
      maxWidth={PANEL_WIDTH}
      padding="$spacing12"
      onClose={onClose}
    >
      <MarketSelectorContent isSheet onClose={onClose} />
    </Modal>
  )
}

// The chart header's market picker: the selector as a popover anchored under its trigger (a bottom
// sheet below md), or in the compact layout the modal sheet.
export function MarginMarketSelectorAnchor({
  compact,
  children,
}: {
  compact: boolean
  children: (isOpen: boolean) => ReactNode
}): JSX.Element {
  const media = useMedia()
  const [isOpen, setIsOpen] = useState(false)
  const toggle = useEvent(() => setIsOpen((open) => !open))
  const close = useEvent(() => setIsOpen(false))
  const triggerContent = (
    <Flex row alignItems="center" gap="$spacing12" minWidth={0}>
      {children(isOpen)}
    </Flex>
  )
  if (compact) {
    return (
      <>
        <TouchableArea flexShrink={1} minWidth={0} onPress={toggle}>
          {triggerContent}
        </TouchableArea>
        <MarginMarketSelectorModal isOpen={isOpen} onClose={close} />
      </>
    )
  }
  return (
    <Popover open={isOpen} placement="bottom-start" strategy="fixed" offset={8} allowFlip onOpenChange={setIsOpen}>
      {/* No onPress: the compat trigger wires the open interaction itself and reports via onOpenChange. */}
      <Popover.Trigger>
        <TouchableArea flexShrink={1} minWidth={0}>
          {triggerContent}
        </TouchableArea>
      </Popover.Trigger>
      <AdaptiveWebPopoverContentCompat
        isOpen={isOpen}
        adaptWhen={media.md}
        testID={TestID.MarginMarketSelectorPanel}
        p="$none"
        width={PANEL_WIDTH}
        backgroundColor="$surface1"
        borderRadius="$rounded16"
        borderWidth="$spacing1"
        borderColor="$surface3"
      >
        <MarketSelectorContent isSheet={media.md} onClose={close} />
      </AdaptiveWebPopoverContentCompat>
    </Popover>
  )
}

// The form's own pair card + modal. Only rendered outside the terminal layout, where there is no chart
// header to pick the market from.
export function MarginMarketSelector({ trailing }: { trailing?: ReactNode }): JSX.Element {
  const currencyInfos = useMarginCurrencyInfos()
  const [isOpen, setIsOpen] = useState(false)
  const openModal = useEvent(() => setIsOpen(true))
  const closeModal = useEvent(() => setIsOpen(false))

  return (
    <>
      <PairHeaderButton onPress={openModal} currencyInfos={currencyInfos} trailing={trailing} />
      <MarginMarketSelectorModal isOpen={isOpen} onClose={closeModal} />
    </>
  )
}
