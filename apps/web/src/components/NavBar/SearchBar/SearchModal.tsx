import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex, spacing, Text, TouchableArea } from '@universe/mycelium'
import { useMedia, useScrollbarStyles, useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { type ComponentRef, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useUpdateScrollLock } from 'uniswap/src/components/modals/ScrollLock'
import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter'
import { NetworkFilterV2 } from 'uniswap/src/components/network/NetworkFilterV2/NetworkFilterV2'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { EXPANDABLE_ASSET_SEARCH_ISSUER_ROW_RIGHT_INSET_PX } from 'uniswap/src/features/expandableAsset/expandableAssetLayout'
import { useFilterCallbacks } from 'uniswap/src/features/search/SearchModal/hooks/useFilterCallbacks'
import { SearchModalNoQueryList } from 'uniswap/src/features/search/SearchModal/SearchModalNoQueryList'
import { SearchModalResultsList } from 'uniswap/src/features/search/SearchModal/SearchModalResultsList'
import { SearchTab, type SearchModalRowWrapper, WEB_SEARCH_TABS } from 'uniswap/src/features/search/SearchModal/types'
import { SearchTextInput } from 'uniswap/src/features/search/SearchTextInput'
import { ElementName, InterfaceEventName, ModalName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { useDebounce } from 'utilities/src/time/timing'
import { AuctionHoverCard } from '~/components/HoverCard/AuctionHoverCard/AuctionHoverCard'
import { TokenHoverCard } from '~/components/HoverCard/TokenHoverCard/TokenHoverCard'
import { useModalState } from '~/hooks/useModalState'

const SEARCH_MODAL_WIDTH = {
  default: 640,
  small: 540,
}

const HOVER_CARD_OFFSET = 8

// Compensates for the RWA issuer sub-row's extra nesting; imported (not hardcoded) to stay in sync with its layout.
const RWA_ISSUER_ROW_HOVER_CARD_OFFSET = HOVER_CARD_OFFSET + EXPANDABLE_ASSET_SEARCH_ISSUER_ROW_RIGHT_INSET_PX

const LIST_CONTENT_CONTAINER_STYLE = { paddingBottom: spacing.spacing24 }

function useHoverCardWrapper({
  containerWidth,
  onNavigate,
}: {
  containerWidth: number
  onNavigate: () => void
}): SearchModalRowWrapper {
  return useCallback<SearchModalRowWrapper>(
    (props): JSX.Element => {
      const { element } = props
      if (props.variant === 'auction') {
        return (
          <AuctionHoverCard
            auction={props.auction}
            childOwnsPressFeedback
            placement="right-start"
            offset={HOVER_CARD_OFFSET}
            widthOffset={HOVER_CARD_OFFSET}
            containerWidth={containerWidth}
            onNavigate={onNavigate}
          >
            {element}
          </AuctionHoverCard>
        )
      }
      return (
        <TokenHoverCard
          currencyInfo={props.currencyInfo}
          childOwnsPressFeedback
          placement="right-start"
          offset={props.variant === 'rwaIssuerChild' ? RWA_ISSUER_ROW_HOVER_CARD_OFFSET : HOVER_CARD_OFFSET}
          widthOffset={HOVER_CARD_OFFSET}
          containerWidth={containerWidth}
          onNavigate={onNavigate}
        >
          {element}
        </TokenHoverCard>
      )
    },
    [containerWidth, onNavigate],
  )
}

export const SearchModal = memo(function SearchModalInner({
  isAuctionSearchEnabled,
}: {
  isAuctionSearchEnabled: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const media = useMedia()
  const scrollbarStyles = useScrollbarStyles()

  const { isOpen: isModalOpen, toggleModal: toggleSearchModal } = useModalState(ModalName.Search)

  // Use ref for programmatic focus instead of autoFocus prop
  // autoFocus doesn't work reliably on first modal open in production
  const searchInputRef = useRef<ComponentRef<typeof SearchTextInput>>(null)

  useEffect(() => {
    if (isModalOpen) {
      // Small delay to ensure modal animation/focus trap is ready
      const timeoutId = setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timeoutId)
    }
    return undefined
  }, [isModalOpen])

  const [activeTab, setActiveTab] = useState<SearchTab>(SearchTab.All)
  const searchTabs = useMemo(
    () => (isAuctionSearchEnabled ? WEB_SEARCH_TABS : WEB_SEARCH_TABS.filter((tab) => tab !== SearchTab.Auctions)),
    [isAuctionSearchEnabled],
  )

  useEffect(() => {
    if (!searchTabs.includes(activeTab)) {
      setActiveTab(SearchTab.All)
    }
  }, [activeTab, searchTabs])

  const { onChangeChainFilter, onChangeText, searchFilter, chainFilter, parsedChainFilter, parsedSearchFilter } =
    useFilterCallbacks(null, ModalName.Search)
  const debouncedSearchFilter = useDebounce(searchFilter)
  const debouncedParsedSearchFilter = useDebounce(parsedSearchFilter)

  // A ref, not state: the count only matters at exit, and re-rendering the modal per list update would be wasted.
  const resultsShownRef = useRef(0)
  const onResultsShownChange = useEvent((count: number): void => {
    resultsShownRef.current = count
  })

  const trace = useTrace({ section: SectionName.NavbarSearch })
  const closeSearch = useCallback(
    (resultSelected: boolean) => {
      toggleSearchModal()
      sendAnalyticsEvent(InterfaceEventName.NavbarSearchExited, {
        navbar_search_input_text: debouncedSearchFilter ?? '',
        hasInput: Boolean(debouncedSearchFilter),
        result_selected: resultSelected,
        results_shown: resultsShownRef.current,
        ...trace,
      })
    },
    [toggleSearchModal, debouncedSearchFilter, trace],
  )
  const onClose = useCallback(() => closeSearch(false), [closeSearch])

  const onSelect = useCallback(() => {
    // web handles select differently than wallet as we want to clear search input on selection
    onChangeText('')
    closeSearch(true)
  }, [onChangeText, closeSearch])

  const { chains: enabledChains } = useEnabledChains()
  const isNetworkFilterV2Enabled = useFeatureFlag(FeatureFlags.NetworkFilterV2)

  const searchModalWidth = media.xxl ? SEARCH_MODAL_WIDTH.small : SEARCH_MODAL_WIDTH.default

  const wrapWithHoverCard = useHoverCardWrapper({ containerWidth: searchModalWidth, onNavigate: onSelect })
  const rowWrapper = !media.xl ? wrapWithHoverCard : undefined

  // Tamagui's lock doesn't block ArrowUp/Down key scrolling, so we lock scroll ourselves and disable
  // Tamagui's own lock below (disableRemoveScroll) to avoid a stray scrollbar-gutter reservation.
  useUpdateScrollLock({ isModalOpen })

  return (
    <Modal
      fullScreen
      hideKeyboardOnDismiss
      hideKeyboardOnSwipeDown
      renderBehindBottomInset
      disableRemoveScroll
      backgroundColor={colors.surface1.val}
      isModalOpen={isModalOpen}
      maxWidth={searchModalWidth}
      maxHeight={520}
      name={ModalName.Search}
      padding="$none"
      height="100vh"
      onClose={onClose}
      analyticsProperties={{
        search_tab: activeTab,
      }}
      // Use percent mode to avoid Tamagui bug where 'fit' snapped
      // modals may incorrectly resize on their own when keyboard is visible
      snapPointsMode="percent"
      snapPoints={[85]}
    >
      <Flex grow style={scrollbarStyles}>
        <Flex
          $sm={{ px: '$spacing16', py: '$spacing4', borderColor: undefined, borderBottomWidth: 0 }}
          px="$spacing4"
          py="$spacing20"
          borderBottomColor="$surface3"
          borderBottomWidth={1}
        >
          <SearchTextInput
            ref={searchInputRef}
            minHeight={media.sm ? undefined : 24}
            backgroundColor={media.sm ? '$surface2' : '$transparent'}
            borderColor={!media.sm ? '$transparent' : undefined}
            borderWidth={!media.sm ? '$none' : undefined}
            py="$none"
            endAdornment={
              <Flex row alignItems="center">
                {isNetworkFilterV2Enabled ? (
                  <NetworkFilterV2
                    includeAllNetworks
                    chainIds={enabledChains}
                    selectedChain={chainFilter}
                    onPressChain={onChangeChainFilter}
                  />
                ) : (
                  <NetworkFilter
                    includeAllNetworks
                    chainIds={enabledChains}
                    selectedChain={chainFilter}
                    onPressChain={onChangeChainFilter}
                  />
                )}
              </Flex>
            }
            // The long placeholder hard-clips in the narrow $sm input, so fall back to the short header copy there
            placeholder={media.sm ? t('search.input.placeholder.header') : t('search.input.placeholder.modal')}
            px="$spacing16"
            value={searchFilter ?? ''}
            onChangeText={onChangeText}
            onKeyPress={(e) => {
              if (['Enter', 'ArrowUp', 'ArrowDown'].includes(e.nativeEvent.key)) {
                // default behaviors we don't want:
                // - 'enter' key action blurs the input field
                // - 'arrow up/down' key action moves text cursor to the start/end of the input
                e.preventDefault()
              }
            }}
          />
        </Flex>
        <Flex row px="$spacing20" pt="$spacing16" pb="$spacing8" gap="$spacing16">
          {searchTabs.map((tab) => (
            <Trace element={ElementName.SearchTab} logPress key={tab} properties={{ search_tab: tab }}>
              <TouchableArea onPress={() => setActiveTab(tab)}>
                <Text color={activeTab === tab ? '$neutral1' : '$neutral2'} variant="buttonLabel2">
                  {tab}
                </Text>
              </TouchableArea>
            </Trace>
          ))}
        </Flex>
        <Flex grow>
          {searchFilter && searchFilter.length > 0 ? (
            <SearchModalResultsList
              chainFilter={chainFilter}
              parsedChainFilter={parsedChainFilter}
              debouncedParsedSearchFilter={debouncedParsedSearchFilter}
              debouncedSearchFilter={debouncedSearchFilter}
              searchFilter={searchFilter}
              activeTab={activeTab}
              auctionSearchEnabled={isAuctionSearchEnabled}
              onSelect={onSelect}
              onViewAll={setActiveTab}
              renderedInModal={false}
              contentContainerStyle={LIST_CONTENT_CONTAINER_STYLE}
              rowWrapper={rowWrapper}
              onResultsShownChange={onResultsShownChange}
            />
          ) : (
            <SearchModalNoQueryList
              chainFilter={chainFilter}
              activeTab={activeTab}
              auctionSearchEnabled={isAuctionSearchEnabled}
              onSelect={onSelect}
              onViewAll={setActiveTab}
              renderedInModal
              contentContainerStyle={LIST_CONTENT_CONTAINER_STYLE}
              rowWrapper={rowWrapper}
              onResultsShownChange={onResultsShownChange}
            />
          )}
        </Flex>
      </Flex>
    </Modal>
  )
})
