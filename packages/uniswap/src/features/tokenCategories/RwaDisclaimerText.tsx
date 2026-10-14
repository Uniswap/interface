import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { cloneElement, type ReactElement } from 'react'
import { Trans } from 'react-i18next'

/** Stocks and ETFs carry the disclaimer; Commodities has none, by design. */
export function hasRwaDisclaimer(category: RwaCategory): boolean {
  return category === RwaCategory.STOCKS || category === RwaCategory.ETFS
}

/**
 * Disclaimer copy for RWA categories, shared by web and mobile. The caller supplies the
 * platform-appropriate "Learn more" link element, which renders at the end of the copy.
 *
 * The i18n keys must stay literal in the Trans elements: i18next-parser only sees static keys,
 * and these back the shipped Explore Stocks/ETFs disclaimers — a dynamic-key refactor silently
 * drops them from the catalog on the next `bun i18n:extract`.
 */
export function RwaDisclaimerText({
  category,
  link,
}: {
  category: RwaCategory
  link: ReactElement
}): JSX.Element | null {
  // Trans splices the mapped element into its children array, so it needs a key to avoid
  // React's unique-key warning.
  const keyedLink = cloneElement(link, { key: 'link' })

  switch (category) {
    case RwaCategory.STOCKS:
      return <Trans i18nKey="explore.rwa.table.disclaimer.stocks" components={{ link: keyedLink }} />
    case RwaCategory.ETFS:
      return <Trans i18nKey="explore.rwa.table.disclaimer.etfs" components={{ link: keyedLink }} />
    default:
      return null
  }
}
