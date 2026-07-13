// Section-scoped row identity for OnchainItemList, shared by the web (react-window) and native (FlashList) lists.
// Position-independent so a row keeps its identity when sibling rows are inserted/removed/reordered (e.g. Recents
// cleared, or a stock entering Recents).

export function getSectionHeaderRowKey(sectionKey: string): string {
  return `section-${sectionKey}`
}

export function getSectionItemRowKey({
  sectionKey,
  itemKey,
  index,
}: {
  sectionKey: string
  itemKey: string | undefined
  index: number
}): string {
  return `item-${sectionKey}-${itemKey ?? index}`
}

/**
 * Fingerprint of the row SET (ordered keys, excluding heights/expanded state): changes only on insert/remove/
 * reorder, not on expand/collapse (so the web expand animation isn't interrupted). JSON-encoded so it can't
 * false-collide on a key containing a separator char. Callers must pass a `keyExtractor` unique within a section.
 */
export function getRowsStructuralSignature(rowKeys: string[]): string {
  return JSON.stringify(rowKeys)
}
