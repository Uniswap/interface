import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Briefcase } from 'ui/src/components/icons/Briefcase'
import { Etf } from 'ui/src/components/icons/Etf'
import { Nut } from 'ui/src/components/icons/Nut'

type CategoryTagContent = { icon: JSX.Element; label: string }

/** Maps a tokenized-asset category to its tag icon + label. This switch is the single extension point for new
 *  category tags: add a `case` once the data layer classifies that category and a matching i18n string + icon
 *  exist. Returns `undefined` for categories without a tag (e.g. UNSPECIFIED) so the tag renders nothing. */
function useCategoryTagContent(category: RwaCategory): CategoryTagContent | undefined {
  const { t } = useTranslation()

  switch (category) {
    case RwaCategory.STOCKS:
      return { icon: <Briefcase color="$neutral2" size="$icon.16" />, label: t('common.stocks') }
    case RwaCategory.ETFS:
      return { icon: <Etf color="$neutral2" size="$icon.16" />, label: t('common.etfs') }
    case RwaCategory.COMMODITIES:
      return { icon: <Nut color="$neutral2" size="$icon.16" />, label: t('common.commodities') }
    default:
      return undefined
  }
}

/** A small category tag (icon + label, e.g. "Stocks") rendered on token rows that are tokenized RWAs. */
export const CategoryTag = memo(function CategoryTag({ category }: { category: RwaCategory }): JSX.Element | null {
  const content = useCategoryTagContent(category)

  if (!content) {
    return null
  }

  return (
    <Flex row alignItems="center" gap="$spacing4" py="$spacing4" borderRadius="$rounded8">
      {content.icon}
      <Text color="$neutral2" variant="body4">
        {content.label}
      </Text>
    </Flex>
  )
})
