// Section-scoped row identity for OnchainItemList, shared by the web (react-window) and native (Legend List) lists.
// Position-independent so a row keeps its identity when sibling rows are inserted/removed/reordered (e.g. Recents
// cleared, or a stock entering Recents).

/** Row-key namespace for a section: `sectionId` when set, else the shared `sectionKey`. */
export function getSectionRowId(section: { sectionKey: string; sectionId?: string }): string {
  return section.sectionId ?? section.sectionKey
}

export function getSectionHeaderRowKey(sectionRowId: string): string {
  return `section-${sectionRowId}`
}

export function getSectionFooterRowKey(sectionRowId: string): string {
  return `section-footer-${sectionRowId}`
}

export function getSectionItemRowKey({
  sectionRowId,
  itemKey,
  index,
}: {
  sectionRowId: string
  itemKey: string | undefined
  index: number
}): string {
  return `item-${sectionRowId}-${itemKey ?? index}`
}

/**
 * Fingerprint of the row SET (ordered keys, excluding heights/expanded state): changes only on insert/remove/
 * reorder, not on expand/collapse (so the web expand animation isn't interrupted). JSON-encoded so it can't
 * false-collide on a key containing a separator char. Callers must pass a `keyExtractor` unique within a section.
 */
export function getRowsStructuralSignature(rowKeys: string[]): string {
  return JSON.stringify(rowKeys)
}
