import { fonts } from 'ui/src/theme/fonts'
import { HEADER_LOGO_SIZE } from '~/components/Explore/stickyHeader/constants'
import {
  getHeaderLogoSize,
  getHeaderTitleLineHeight,
  getHeaderTitleVariant,
} from '~/components/Explore/stickyHeader/getHeaderLogoSize'

describe('getHeaderLogoSize', () => {
  it('returns compact size when isCompact is true', () => {
    expect(getHeaderLogoSize({ isCompact: true, isMobile: false })).toBe(HEADER_LOGO_SIZE.compact)
    expect(getHeaderLogoSize({ isCompact: true, isMobile: true })).toBe(HEADER_LOGO_SIZE.compact)
  })

  it('returns medium size when not compact and isMobile is true', () => {
    expect(getHeaderLogoSize({ isCompact: false, isMobile: true })).toBe(HEADER_LOGO_SIZE.medium)
  })

  it('returns expanded size when not compact and not isMobile', () => {
    expect(getHeaderLogoSize({ isCompact: false, isMobile: false })).toBe(HEADER_LOGO_SIZE.expanded)
  })
})

describe('getHeaderTitleVariant', () => {
  it('returns subheading1 when isMobile is true', () => {
    expect(getHeaderTitleVariant({ isCompact: false, isMobile: true })).toBe('subheading1')
    expect(getHeaderTitleVariant({ isCompact: true, isMobile: true })).toBe('subheading1')
  })

  it('returns subheading2 when not mobile and isCompact is true', () => {
    expect(getHeaderTitleVariant({ isCompact: true, isMobile: false })).toBe('subheading2')
  })

  it('returns heading3 when not mobile and not compact', () => {
    expect(getHeaderTitleVariant({ isCompact: false, isMobile: false })).toBe('heading3')
  })
})

describe('getHeaderTitleLineHeight', () => {
  it('returns theme line height for subheading1 when isMobile', () => {
    expect(getHeaderTitleLineHeight({ isCompact: false, isMobile: true })).toBe(fonts.subheading1.lineHeight)
    expect(getHeaderTitleLineHeight({ isCompact: true, isMobile: true })).toBe(fonts.subheading1.lineHeight)
  })

  it('returns theme line height for subheading2 when not mobile and compact', () => {
    expect(getHeaderTitleLineHeight({ isCompact: true, isMobile: false })).toBe(fonts.subheading2.lineHeight)
  })

  it('returns theme line height for heading3 when not mobile and not compact', () => {
    expect(getHeaderTitleLineHeight({ isCompact: false, isMobile: false })).toBe(fonts.heading3.lineHeight)
  })
})
