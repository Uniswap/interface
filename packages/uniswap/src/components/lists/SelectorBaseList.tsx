import { UniverseChainId } from '@universe/chains'
import { Flex, Text } from '@universe/mycelium'
import { memo, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { StyleProp, ViewStyle } from 'react-native'
import { Loader } from 'ui/src'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import type { FocusedRowStore } from 'uniswap/src/components/lists/focusedRowStore'
import { OnchainItemListOption } from 'uniswap/src/components/lists/items/types'
import {
  ItemRowInfo,
  OnchainItemList,
  OnchainItemListRef,
  SectionRowInfo,
} from 'uniswap/src/components/lists/OnchainItemList/OnchainItemList'
import type { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { SectionHeader } from 'uniswap/src/components/lists/SectionHeader'

function EmptyResults(): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex>
      <Text color="$neutral3" mt="$spacing16" textAlign="center" variant="subheading2">
        {t('common.noResults')}
      </Text>
    </Flex>
  )
}

interface SelectorBaseListProps<T extends OnchainItemListOption> {
  sections?: OnchainItemSection<T>[]
  chainFilter?: UniverseChainId | null
  refetch?: () => void
  loading?: boolean
  loadingRows?: number
  loadingElement?: JSX.Element
  hasError?: boolean
  emptyElement?: JSX.Element
  errorText?: string
  renderItem: (info: ItemRowInfo<T>) => JSX.Element
  keyExtractor: (item: T, index: number) => string
  expandedItems?: string[]
  focusedRowStore?: FocusedRowStore
  autoFocusFirstRowKey?: string
  renderedInModal: boolean
  contentContainerStyle?: StyleProp<ViewStyle>
}

function SelectorBaseListInner<T extends OnchainItemListOption>({
  renderItem,
  sections,
  chainFilter,
  refetch,
  loading,
  loadingRows,
  loadingElement,
  hasError,
  emptyElement,
  errorText,
  keyExtractor,
  expandedItems,
  focusedRowStore,
  autoFocusFirstRowKey,
  renderedInModal,
  contentContainerStyle,
}: SelectorBaseListProps<T>): JSX.Element {
  const { t } = useTranslation()
  const sectionListRef = useRef<OnchainItemListRef>(undefined)

  // Keyed on whether rows exist, not on how many sections there are: sections resolve one at a time,
  // and every arrival changed the count — which scrolled the list back to the top under the user's
  // finger mid-scroll.
  const hasRows = Boolean(sections?.length)
  useEffect(() => {
    if (hasRows) {
      sectionListRef.current?.scrollToLocation({
        itemIndex: 0,
        sectionIndex: 0,
        animated: true,
      })
    }
  }, [chainFilter, hasRows])

  const renderSectionHeader = useCallback(
    ({ section }: SectionRowInfo): JSX.Element => (
      <SectionHeader
        rightElement={section.rightElement}
        endElement={section.endElement}
        sectionKey={section.sectionKey}
        sectionRowId={section.sectionRowId}
        name={section.name}
        sectionHeader={section.sectionHeader}
        icon={section.icon}
        onPress={section.onPress}
      />
    ),
    [],
  )

  if (hasError) {
    return (
      <>
        <Flex grow justifyContent="center">
          <BaseCard.ErrorState
            retryButtonLabel={t('common.button.retry')}
            title={errorText ?? t('tokens.selector.error.load')}
            onRetry={refetch}
          />
        </Flex>
        {/*
          This is needed to position error message roughly in the center of
          the sheet initially when modal is opened to 65% only
        */}
        <Flex grow />
      </>
    )
  }

  const isLoading = (!sections || !sections.length) && loading

  // The loading skeleton renders IN FLOW (not as an absolute overlay): the loader rows carry the
  // real row height, so containers that size to their content — the mobile-web bottom sheet's
  // content-fit frame — open at the same tall, list-bearing height as a loaded selector, matching
  // how the Tamagui sheet rendered in prod. An absolute overlay contributes no
  // layout height and let the sheet collapse to its chrome while loading. `isLoading` implies the
  // list is empty, so nothing is covered by rendering the skeleton instead of the list.
  if (isLoading) {
    return (
      <Flex fill backgroundColor="$surface1">
        {loadingElement ?? <SelectorBaseListSkeleton repeat={loadingRows} />}
      </Flex>
    )
  }

  return (
    // `fill` (flex:1) not `grow` (flexGrow:1): Legend List needs a parent with a definite height,
    // otherwise the non-modal list (explore search) collapses to its content and is cut short.
    <Flex fill>
      <OnchainItemList<T>
        ListEmptyComponent={emptyElement || <EmptyResults />}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        sectionListRef={sectionListRef}
        sections={sections ?? []}
        expandedItems={expandedItems}
        focusedRowStore={focusedRowStore}
        autoFocusFirstRowKey={autoFocusFirstRowKey}
        renderedInModal={renderedInModal}
        contentContainerStyle={contentContainerStyle}
      />
    </Flex>
  )
}

export function SelectorBaseListSkeleton({ repeat = 3 }: { repeat?: number } = {}): JSX.Element {
  return (
    <Flex grow px="$spacing20" overflow="hidden">
      <Loader.Token gap="$none" repeat={repeat} />
    </Flex>
  )
}

export const SelectorBaseList = memo(SelectorBaseListInner) as typeof SelectorBaseListInner
