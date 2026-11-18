import { Flex } from '@universe/mycelium'
import { ExploreCategoryTablesSection } from '~/pages/Explore/categories/ExploreCategoryTablesSection'
import { TrendingShelf } from '~/pages/Explore/trending/TrendingShelf'

export function ExploreTrendingShelfSection(): JSX.Element {
  return (
    <Flex mt="$spacing48" mb="$spacing24" $md={{ mt: '$spacing32', mb: '$spacing20' }}>
      <TrendingShelf />
    </Flex>
  )
}

export function ExploreCategoryTablesOrPage({
  showExploreCategoryTables,
  page,
}: {
  showExploreCategoryTables: boolean
  page: JSX.Element
}): JSX.Element {
  if (showExploreCategoryTables) {
    return <ExploreCategoryTablesSection />
  }
  return page
}
