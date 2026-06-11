import { Flex } from 'ui/src'
import { ExploreCategoryTablesSection } from '~/pages/Explore/categories/ExploreCategoryTablesSection'
import { AssetShelf } from '~/pages/Explore/rwa/shelf/AssetShelf'

export function ExploreAssetShelfSection(): JSX.Element {
  return (
    <Flex mt="$spacing32">
      <AssetShelf />
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
