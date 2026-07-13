import { spacing } from 'ui/src/theme/spacing'
import {
  EXPANDABLE_ASSET_INNER_PADDING_Y_PX,
  EXPANDABLE_ASSET_ISSUER_GAP_PX,
  EXPANDABLE_ASSET_ISSUER_GAP_SEARCH_PX,
  EXPANDABLE_ASSET_ISSUER_ROW_MIN_HEIGHT_PX,
  EXPANDABLE_ASSET_ISSUER_ROW_SEARCH_HEIGHT_PX,
  getExpandableIssuerPanelHeightPx,
  getExpandableSearchRowHeightPx,
} from 'uniswap/src/features/expandableAsset/expandableAssetLayout'
import { describe, expect, it } from 'vitest'

describe('getExpandableIssuerPanelHeightPx', () => {
  it('returns 0 when there are no issuers', () => {
    expect(getExpandableIssuerPanelHeightPx({ issuerCount: 0 })).toBe(0)
    expect(getExpandableIssuerPanelHeightPx({ issuerCount: 0, variant: 'search' })).toBe(0)
  })

  it('table variant: includes inner vertical padding, fixed row heights, and spacing4 gaps', () => {
    const issuerCount = 3
    const expected =
      EXPANDABLE_ASSET_INNER_PADDING_Y_PX * 2 +
      issuerCount * EXPANDABLE_ASSET_ISSUER_ROW_MIN_HEIGHT_PX +
      (issuerCount - 1) * EXPANDABLE_ASSET_ISSUER_GAP_PX

    expect(getExpandableIssuerPanelHeightPx({ issuerCount })).toBe(expected)
    // Default variant is `table`.
    expect(getExpandableIssuerPanelHeightPx({ issuerCount, variant: 'table' })).toBe(expected)
  })

  it('search variant: surface5 border (top + bottom), 56px rows, spacing2 gaps', () => {
    const issuerCount = 3
    const expected =
      2 * spacing.spacing1 +
      issuerCount * EXPANDABLE_ASSET_ISSUER_ROW_SEARCH_HEIGHT_PX +
      (issuerCount - 1) * EXPANDABLE_ASSET_ISSUER_GAP_SEARCH_PX

    expect(getExpandableIssuerPanelHeightPx({ issuerCount, variant: 'search' })).toBe(expected)
  })
})

describe('getExpandableSearchRowHeightPx', () => {
  // A collapsed row (single- or multi-issuer) renders flat — just the bare parent, no shell chrome. This equals
  // the row's base minHeight (the collapsed wrapper and the expanded `$surface2` shell; the expanded header itself
  // is natural-height). Asserting the exported constant keeps the helper's base in sync with that pinned minHeight.
  it('returns just the bare parent row height for any collapsed row (flat, no shell)', () => {
    expect(getExpandableSearchRowHeightPx({ issuerCount: 0, expanded: false })).toBe(
      EXPANDABLE_ASSET_ISSUER_ROW_MIN_HEIGHT_PX,
    )
    expect(getExpandableSearchRowHeightPx({ issuerCount: 1, expanded: false })).toBe(
      EXPANDABLE_ASSET_ISSUER_ROW_MIN_HEIGHT_PX,
    )
    expect(getExpandableSearchRowHeightPx({ issuerCount: 3, expanded: false })).toBe(
      EXPANDABLE_ASSET_ISSUER_ROW_MIN_HEIGHT_PX,
    )
  })

  it('expanded estimate = budgeted header + shell chrome + parent↔panel gap + search panel, as absolute px', () => {
    // The native FlashList cell estimate. Spelled out from the design values, independent of the helper's own
    // expressions, so any shell/gap/panel change fails here:
    //   header 64 + shell (p8 ×2 = 16 + border 1 ×2 = 2) + gap 8 + panel(3) [border 2 + 3×56 + 2×2 = 174] = 264.
    expect(getExpandableSearchRowHeightPx({ issuerCount: 3, expanded: true })).toBe(264)
  })
})

describe('height invariance with the context-menu affordance', () => {
  // The `…` menu / right-click affordance is a 28px horizontal sibling inside the fixed-height row (no vertical
  // extent), so it must NOT change any row/panel height — the virtualized list relies on these heights being exact.
  // Freezing the search-variant heights as absolute px for 1..4 issuers fails loudly if a layout regression (or an
  // accidental menu-driven height change) slips in.
  it('search issuer-panel height is unchanged for 1..4 issuers (border + 56px rows + 2px gaps)', () => {
    expect(getExpandableIssuerPanelHeightPx({ issuerCount: 1, variant: 'search' })).toBe(58)
    expect(getExpandableIssuerPanelHeightPx({ issuerCount: 2, variant: 'search' })).toBe(116)
    expect(getExpandableIssuerPanelHeightPx({ issuerCount: 3, variant: 'search' })).toBe(174)
    expect(getExpandableIssuerPanelHeightPx({ issuerCount: 4, variant: 'search' })).toBe(232)
  })

  it('expanded search-row height is unchanged for the expandable cases (2..4 issuers)', () => {
    expect(getExpandableSearchRowHeightPx({ issuerCount: 2, expanded: true })).toBe(206)
    expect(getExpandableSearchRowHeightPx({ issuerCount: 3, expanded: true })).toBe(264)
    expect(getExpandableSearchRowHeightPx({ issuerCount: 4, expanded: true })).toBe(322)
  })

  it('collapsed row height stays the bare min-height for 1..4 issuers (the single-issuer Stocks-shelf row included)', () => {
    for (const issuerCount of [1, 2, 3, 4]) {
      expect(getExpandableSearchRowHeightPx({ issuerCount, expanded: false })).toBe(
        EXPANDABLE_ASSET_ISSUER_ROW_MIN_HEIGHT_PX,
      )
    }
  })
})
