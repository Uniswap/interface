import { fonts } from 'ui/src/theme/fonts'
import { HEADER_LOGO_SIZE } from '~/components/StickyCollapsibleHeader/constants'
import {
  getHeaderLogoSize,
  getHeaderTitleLineHeight,
  getHeaderTitleVariant,
} from '~/components/StickyCollapsibleHeader/getHeaderLogoSize'

describe('getHeaderLogoSize', () => {
  it('returns small size when sm breakpoint matches (before compact / md)', () => {
    expect(getHeaderLogoSize({ isCompact: false, media: { sm: true } })).toBe(HEADER_LOGO_SIZE.small)
    // sm is checked first, so compact layout does not shrink the logo further on narrow viewports
    expect(getHeaderLogoSize({ isCompact: true, media: { sm: true } })).toBe(HEADER_LOGO_SIZE.small)
  })

  it('returns compact size when isCompact is true', () => {
    expect(getHeaderLogoSize({ isCompact: true, media: { md: false } })).toBe(HEADER_LOGO_SIZE.compact)
    expect(getHeaderLogoSize({ isCompact: true, media: { md: true } })).toBe(HEADER_LOGO_SIZE.compact)
  })

  it('returns medium size when not compact and media.md is true (sm off)', () => {
    expect(getHeaderLogoSize({ isCompact: false, media: { sm: false, md: true } })).toBe(HEADER_LOGO_SIZE.medium)
  })

  it('returns expanded size when not compact and below sm/md breakpoints', () => {
    expect(getHeaderLogoSize({ isCompact: false, media: { sm: false, md: false } })).toBe(HEADER_LOGO_SIZE.expanded)
  })

  it('returns small size when sm and md both match (sm is checked first)', () => {
    expect(getHeaderLogoSize({ isCompact: false, media: { sm: true, md: true } })).toBe(HEADER_LOGO_SIZE.small)
  })
})

describe('getHeaderTitleVariant', () => {
  it('returns subheading2 when media.sm is true (before md and isCompact)', () => {
    expect(getHeaderTitleVariant({ isCompact: false, media: { sm: true } })).toBe('subheading2')
    // sm is checked first — same variant as compact-only, but guard order matters when combined with md
    expect(getHeaderTitleVariant({ isCompact: true, media: { sm: true } })).toBe('subheading2')
    expect(getHeaderTitleVariant({ isCompact: false, media: { sm: true, md: true } })).toBe('subheading2')
  })

  it('returns subheading1 when media.md is true (sm off)', () => {
    expect(getHeaderTitleVariant({ isCompact: false, media: { sm: false, md: true } })).toBe('subheading1')
    expect(getHeaderTitleVariant({ isCompact: true, media: { sm: false, md: true } })).toBe('subheading1')
  })

  it('returns subheading2 when not mobile and isCompact is true', () => {
    expect(getHeaderTitleVariant({ isCompact: true, media: { sm: false, md: false } })).toBe('subheading2')
  })

  it('returns heading3 when not mobile and not compact', () => {
    expect(getHeaderTitleVariant({ isCompact: false, media: { sm: false, md: false } })).toBe('heading3')
  })
})

describe('getHeaderTitleLineHeight', () => {
  it('returns theme line height for subheading2 when media.sm is true', () => {
    expect(getHeaderTitleLineHeight({ isCompact: false, media: { sm: true } })).toBe(fonts.subheading2.lineHeight)
    expect(getHeaderTitleLineHeight({ isCompact: true, media: { sm: true } })).toBe(fonts.subheading2.lineHeight)
  })

  it('returns theme line height for subheading1 when media.md is true (sm off)', () => {
    expect(getHeaderTitleLineHeight({ isCompact: false, media: { sm: false, md: true } })).toBe(
      fonts.subheading1.lineHeight,
    )
    expect(getHeaderTitleLineHeight({ isCompact: true, media: { sm: false, md: true } })).toBe(
      fonts.subheading1.lineHeight,
    )
  })

  it('returns theme line height for subheading2 when media.md is false and is compact', () => {
    expect(getHeaderTitleLineHeight({ isCompact: true, media: { sm: false, md: false } })).toBe(
      fonts.subheading2.lineHeight,
    )
  })

  it('returns theme line height for heading3 when media.md is false and not compact', () => {
    expect(getHeaderTitleLineHeight({ isCompact: false, media: { sm: false, md: false } })).toBe(
      fonts.heading3.lineHeight,
    )
  })
})
