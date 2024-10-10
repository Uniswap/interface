import { BottomSheetSectionList } from '@gorhom/bottom-sheet'
import { useEffect, useRef } from 'react'
import { SectionList } from 'react-native'
import { TokenSectionBaseListProps } from 'uniswap/src/components/TokenSelector/TokenSectionBaseList'
import { TokenOption, TokenSection } from 'uniswap/src/components/TokenSelector/types'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'

export function TokenSectionBaseList({
  sectionListRef,
  ListEmptyComponent,
  focusHook,
  keyExtractor,
  renderItem,
  renderSectionHeader,
  sections,
}: TokenSectionBaseListProps): JSX.Element {
  const insets = useAppInsets()
  const ref = useRef<SectionList<TokenOption>>(null)

  useEffect(() => {
    if (sectionListRef) {
      sectionListRef.current = {
        scrollToLocation: ({ itemIndex, sectionIndex, animated }): void => {
          ref.current?.scrollToLocation({ itemIndex, sectionIndex, animated })
        },
      }
    }
  }, [sectionListRef])

  return (
    <BottomSheetSectionList<TokenOption | TokenOption[], TokenSection>
      ref={ref}
      ListEmptyComponent={ListEmptyComponent}
      bounces={true}
      contentContainerStyle={{ paddingBottom: insets.bottom }}
      focusHook={focusHook}
      keyExtractor={keyExtractor}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="always"
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      sections={sections ?? []}
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={true}
      windowSize={4}
    />
  )
}
