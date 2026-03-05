import { fonts, type TextVariantTokens } from 'ui/src/theme/fonts'
import { HEADER_LOGO_SIZE } from '~/components/Explore/stickyHeader/constants'

/**
 * Resolves header logo size from sticky header state and viewport.
 * Used by TokenDetailsHeader, PoolDetailsHeader, and TDP skeleton for consistent sizing.
 */
export function getHeaderLogoSize({ isCompact, isMobile }: { isCompact: boolean; isMobile: boolean }): number {
  if (isCompact) {
    return HEADER_LOGO_SIZE.compact
  }
  if (isMobile) {
    return HEADER_LOGO_SIZE.medium
  }
  return HEADER_LOGO_SIZE.expanded
}

/** Subset of UI text variants used for details header title. */
type HeaderTitleVariant = Extract<TextVariantTokens, 'heading3' | 'subheading1' | 'subheading2'>

/**
 * Resolves header title Text variant from sticky header state and viewport.
 * Used by TokenDetailsHeader (and skeleton) for consistent title sizing.
 */
export function getHeaderTitleVariant({
  isCompact,
  isMobile,
}: {
  isCompact: boolean
  isMobile: boolean
}): HeaderTitleVariant {
  if (isMobile) {
    return 'subheading1'
  }
  if (isCompact) {
    return 'subheading2'
  }
  return 'heading3'
}

/**
 * Resolves header title line height in px for skeleton/placeholder sizing.
 * Uses theme fonts for the variant from getHeaderTitleVariant.
 */
export function getHeaderTitleLineHeight({ isCompact, isMobile }: { isCompact: boolean; isMobile: boolean }): number {
  const variant = getHeaderTitleVariant({ isCompact, isMobile })
  return fonts[variant].lineHeight
}
