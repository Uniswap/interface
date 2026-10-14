import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { getRwaCategoryForTokenCategory } from 'uniswap/src/features/tokenCategories/rwaCategoryBridge'
import { hasRwaDisclaimer, RwaDisclaimerText } from 'uniswap/src/features/tokenCategories/RwaDisclaimerText'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'

/**
 * Category description ending in the caller's platform "Learn more" link, with the Stocks/ETFs
 * disclaimer in between. Inline content: render it inside a Text.
 */
export function CategoryDescriptionText({
  category,
  renderLink,
}: {
  category: TokenCategory
  renderLink: (label: string) => ReactElement
}): JSX.Element {
  const { t } = useTranslation()
  const rwaCategory = getRwaCategoryForTokenCategory(category)
  // Non-breaking spaces so the label's words wrap to a new line together.
  const link = renderLink(t('common.button.learn').replace(/ /g, ' '))

  return (
    <>
      {category.description}{' '}
      {hasRwaDisclaimer(rwaCategory) ? <RwaDisclaimerText category={rwaCategory} link={link} /> : link}
    </>
  )
}
