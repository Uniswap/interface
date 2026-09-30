import { useIsTokenCategoriesEnabled } from '@universe/gating'

/**
 * Single owner of the Explore section title treatment: standardized styling when
 * the token categories flag is on, legacy styling when off. Delete the off branch
 * (and inline the constants) with the token categories cleanup.
 */
export function useExploreSectionTitleProps(): {
  color: '$neutral1' | '$neutral2'
  variant: 'subheading1' | 'subheading2'
} {
  const tokenCategoriesEnabled = useIsTokenCategoriesEnabled()
  return tokenCategoriesEnabled
    ? { color: '$neutral1', variant: 'subheading1' }
    : { color: '$neutral2', variant: 'subheading2' }
}
