import { isAndroid } from '@universe/environment'
import { UniversalList, type UniversalListStyle } from '@universe/mycelium'
import { useCallback, useMemo } from 'react'
import { SectionData, SectionInfo, SettingsListProps } from 'src/components/Settings/lists/types'
import { SETTINGS_ROW_HEIGHT, SettingsSection } from 'src/components/Settings/SettingsRow'
import { useBottomScreenGap } from 'uniswap/src/hooks/useBottomScreenGap'

export function SettingsList({
  sections,
  ItemSeparatorComponent,
  ListFooterComponent,
  ListHeaderComponent,
  renderItem,
  renderSectionHeader,
  renderSectionFooter,
  showsVerticalScrollIndicator = false,
}: SettingsListProps): JSX.Element {
  // A section row the consumer can't render would still occupy a cell and draw separators, so the
  // renderers gate whether the rows exist at all rather than what they render.
  const hasSectionHeader = Boolean(renderSectionHeader)
  const hasSectionFooter = Boolean(renderSectionFooter)
  const data = useMemo(
    () => processSections(sections, { hasSectionHeader, hasSectionFooter }),
    [sections, hasSectionHeader, hasSectionFooter],
  )
  const { bottomScreenTotalGap, bottomScreenExtraGap } = useBottomScreenGap()

  const renderRow = useCallback(
    ({ item, index }: { item: ProcessedRow; index: number }) => {
      if (item.type === 'header' && renderSectionHeader) {
        return renderSectionHeader(item.data)
      }
      if (item.type === 'footer' && renderSectionFooter) {
        return renderSectionFooter(item.data)
      }
      if (item.type === 'item') {
        return renderItem({ item: item.data, index })
      }
      return null
    },
    [renderItem, renderSectionHeader, renderSectionFooter],
  )

  const contentContainerStyle = useMemo<UniversalListStyle>(
    () => ({
      className: 'pt-3 px-6',
      // On Android the parent Screen already applies insets.bottom via its bottom safe-area edge, so use the
      // above-safe-area portion here to avoid double-paying the inset; iOS keeps the full inset-inclusive gap.
      style: { paddingBottom: isAndroid ? bottomScreenExtraGap : bottomScreenTotalGap },
    }),
    [bottomScreenTotalGap, bottomScreenExtraGap],
  )

  return (
    <UniversalList
      contentContainerStyle={contentContainerStyle}
      data={data}
      estimatedItemSize={SETTINGS_ROW_HEIGHT}
      getItemType={getItemType}
      ItemSeparatorComponent={ItemSeparatorComponent}
      keyExtractor={keyExtractor}
      ListFooterComponent={ListFooterComponent}
      ListHeaderComponent={ListHeaderComponent}
      renderItem={renderRow}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
    />
  )
}

function keyExtractor(item: ProcessedRow): string {
  return item.key
}

function getItemType(item: ProcessedRow): string {
  return item.type
}

type ProcessedRow = { key: string } & (
  | { type: 'header'; data: SectionInfo }
  | { type: 'item'; data: SectionData }
  | { type: 'footer'; data: SectionInfo }
)

export function processSections(
  sections: SettingsSection[],
  { hasSectionHeader, hasSectionFooter }: { hasSectionHeader: boolean; hasSectionFooter: boolean },
): ProcessedRow[] {
  const result: ProcessedRow[] = []

  sections.forEach((section, sectionIndex) => {
    if (section.isHidden) {
      return
    }

    // Index, not subTitle: subTitle is translated, so keying on it re-keys every row in the section
    // on a locale switch, and two sections sharing a subtitle would collide. Hidden sections stay in
    // `sections`, so the index doesn't shift when one is hidden.
    const sectionKey = `section-${sectionIndex}`

    if (section.subTitle && hasSectionHeader) {
      result.push({ type: 'header', key: `${sectionKey}-header`, data: { section } })
    }

    section.data.forEach((data, itemIndex) => {
      if ('isHidden' in data && data.isHidden) {
        return
      }

      result.push({ type: 'item', key: `${sectionKey}-${rowKey(data, itemIndex)}`, data })
    })

    if (section.subTitle && hasSectionFooter) {
      result.push({ type: 'footer', key: `${sectionKey}-footer`, data: { section } })
    }
  })

  return result
}

/**
 * Row id that survives siblings being hidden: `index` is the position in the section's source `data`
 * array, which hidden rows stay in, so hiding one doesn't re-key the others. The identifier half
 * keeps rows distinct where a section swaps one row for another at the same index; the index half
 * rules out collisions between two rows with the same identifier.
 *
 * Never key on `text`: it's translated, so a locale switch would remount the row, and on Android a
 * remounted row's value stays a skeleton until a navigation transition that never comes.
 */
function rowKey(data: SectionData, index: number): string {
  if ('component' in data) {
    // Component rows carry no identifier, but they're a fixed dev-only set so their position is stable.
    return `component-${index}`
  }
  return `${data.testID ?? data.navigationModal ?? data.screen ?? 'row'}-${index}`
}
