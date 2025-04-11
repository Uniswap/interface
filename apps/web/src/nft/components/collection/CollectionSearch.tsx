import { Input } from 'nft/components/layout/Input'
import { useIsCollectionLoading } from 'nft/hooks'
import { useCollectionFilters } from 'nft/hooks/useCollectionFilters'

export const CollectionSearch = () => {
  const setSearchByNameText = useCollectionFilters((state) => state.setSearch)
  const searchByNameText = useCollectionFilters((state) => state.search)
  const iscollectionStatsLoading = useIsCollectionLoading((state) => state.isCollectionStatsLoading)

  if (iscollectionStatsLoading) {
    return null
  }

  return (
    <Input
      flexGrow={1}
      flexBasis={1}
      borderColor="$surface3"
      focusStyle={{ borderColor: '$accent1' }}
      borderWidth={1.5}
      borderRadius="$rounded12"
      p="$padding12"
      backgroundColor="$surface1"
      maxWidth={332}
      minWidth={0}
      height={44}
      placeholderTextColor="$neutral3"
      color="$neutral1"
      value={searchByNameText}
      placeholder="Search by name"
      $platform-web={{
        userSelect: 'none',
      }}
      onChangeText={(value) => {
        setSearchByNameText(value)
      }}
    />
  )
}
