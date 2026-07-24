import { memo, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { StyleProp, ViewStyle } from 'react-native'
import { Flex, Loader, Text } from 'ui/src'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { FocusedRowControl } from 'uniswap/src/components/lists/items/OptionItem'
import { OnchainItemListOption } from 'uniswap/src/components/lists/items/types'
import {
  ItemRowInfo,
  OnchainItemList,
  OnchainItemListRef,
  SectionRowInfo,
} from 'uniswap/src/components/lists/OnchainItemList/OnchainItemList'
import type { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { SectionHeader } from 'uniswap/src/components/lists/SectionHeader'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

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
  hasError?: boolean
  emptyElement?: JSX.Element
  errorText?: string
  renderItem: (info: ItemRowInfo<T>) => JSX.Element
  keyExtractor: (item: T, index: number) => string
  expandedItems?: string[]
  focusedRowControl?: Omit<FocusedRowControl, 'rowIndex'>
  renderedInModal: boolean
  contentContainerStyle?: StyleProp<ViewStyle>
}

function SelectorBaseListInner<T extends OnchainItemListOption>({
  renderItem,
  sections,
  chainFilter,
  refetch,
  loading,
  hasError,
  emptyElement,
  errorText,
  keyExtractor,
  expandedItems,
  focusedRowControl,
  renderedInModal,
  contentContainerStyle,
}: SelectorBaseListProps<T>): JSX.Element {
  const { t } = useTranslation()
  const sectionListRef = useRef<OnchainItemListRef>(undefined)

  useEffect(() => {
    if (sections?.length) {
      sectionListRef.current?.scrollToLocation({
        itemIndex: 0,
        sectionIndex: 0,
        animated: true,
      })
    }
  }, [chainFilter, sections?.length])

  const renderSectionHeader = useCallback(
    ({ section }: SectionRowInfo): JSX.Element => (
      <SectionHeader
        rightElement={section.rightElement}
        endElement={section.endElement}
        sectionKey={section.sectionKey}
        name={section.name}
        sectionHeader={section.sectionHeader}
        icon={section.icon}
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

  return (
    // `fill` (flex:1) not `grow` (flexGrow:1): FlashList v2 needs a parent with a definite height,
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
        focusedRowControl={focusedRowControl}
        renderedInModal={renderedInModal}
        contentContainerStyle={contentContainerStyle}
      />
      {isLoading && (
        <Flex grow position="absolute" top={0} left={0} right={0} bottom={0} backgroundColor="$surface1">
          <SelectorBaseListSkeleton />
        </Flex>
      )}
    </Flex>
  )
}

export function SelectorBaseListSkeleton(): JSX.Element {
  return (
    <Flex grow px="$spacing20">
      <Loader.Token gap="$none" repeat={3} />
    </Flex>
  )
}

export const SelectorBaseList = memo(SelectorBaseListInner) as typeof SelectorBaseListInner
