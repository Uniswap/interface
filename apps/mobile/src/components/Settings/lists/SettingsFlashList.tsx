import { FlashList } from '@shopify/flash-list'
import { default as React, useCallback, useMemo } from 'react'
import { SectionData, SectionInfo, SettingsListProps } from 'src/components/Settings/lists/types'
import { SETTINGS_ROW_HEIGHT, SettingsSection } from 'src/components/Settings/SettingsRow'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { spacing } from 'ui/src/theme'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'

export function SettingsFlashList({
  sections,
  ItemSeparatorComponent,
  ListFooterComponent,
  ListHeaderComponent,
  renderItem,
  renderSectionHeader,
  renderSectionFooter,
  showsVerticalScrollIndicator = false,
}: SettingsListProps): JSX.Element {
  const data = useMemo(() => processSections(sections), [sections])
  const insets = useAppInsets()
  const { fullWidth, fullHeight } = useDeviceDimensions()

  const renderFlashListItem = useCallback(
    ({ item, ...rest }: { item: ProcessedRow; index: number }) => {
      if (item.type === 'header' && renderSectionHeader) {
        return renderSectionHeader(item.data)
      }
      if (item.type === 'footer' && renderSectionFooter) {
        return renderSectionFooter(item.data)
      }
      if (item.type === 'item') {
        return renderItem({
          item: item.data,
          index: rest.index,
          // no-op separators for flashlist
          separators: {
            highlight: () => {},
            unhighlight: () => {},
            updateProps: () => {},
          },
        })
      }
      return null
    },
    [renderItem, renderSectionHeader, renderSectionFooter],
  )

  const estimatedListSize = useMemo(() => {
    return {
      height: fullHeight,
      width: fullWidth,
    }
  }, [fullHeight, fullWidth])

  const contentContainerStyle = useMemo(() => {
    return {
      paddingBottom: insets.bottom - spacing.spacing16,
      paddingTop: spacing.spacing12,
      paddingHorizontal: spacing.spacing24,
    }
  }, [insets])

  return (
    <FlashList
      contentContainerStyle={contentContainerStyle}
      estimatedListSize={estimatedListSize}
      ItemSeparatorComponent={ItemSeparatorComponent}
      ListFooterComponent={ListFooterComponent}
      ListHeaderComponent={ListHeaderComponent}
      data={data}
      estimatedItemSize={SETTINGS_ROW_HEIGHT}
      keyExtractor={keyExtractor}
      renderItem={renderFlashListItem}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
    />
  )
}

function keyExtractor(_item: ProcessedRow, index: number): string {
  return 'settings' + index
}

type ProcessedRow =
  | { type: 'header'; data: SectionInfo }
  | { type: 'item'; data: SectionData }
  | { type: 'footer'; data: SectionInfo }

function processSections(sections: SettingsSection[]): ProcessedRow[] {
  const result: ProcessedRow[] = []

  for (const section of sections) {
    if (section.isHidden) {
      continue
    }

    if (section.subTitle) {
      result.push({
        type: 'header',
        data: {
          section,
        },
      })
    }

    for (const data of section.data) {
      if ('isHidden' in data && data.isHidden) {
        continue
      }

      result.push({
        type: 'item',
        data,
      })
    }

    if (section.subTitle) {
      result.push({
        type: 'footer',
        data: {
          section,
        },
      })
    }
  }

  return result
}
