import { Box } from 'nft/components/Box'
import { useCollectionFilters } from 'nft/hooks/useCollectionFilters'
import { FormEvent } from 'react'

export const CollectionSearch = () => {
  const setSearchByNameText = useCollectionFilters((state) => state.setSearch)
  const searchByNameText = useCollectionFilters((state) => state.search)

  return (
    <Box
      as="input"
      borderColor={{ default: 'backgroundOutline', focus: 'genieBlue' }}
      borderWidth="1px"
      borderStyle="solid"
      borderRadius="12"
      padding="12"
      backgroundColor="backgroundSurface"
      fontSize="16"
      height="44"
      color={{ placeholder: 'textSecondary', default: 'textPrimary' }}
      value={searchByNameText}
      placeholder={'Search by name'}
      onChange={(e: FormEvent<HTMLInputElement>) => {
        setSearchByNameText(e.currentTarget.value)
      }}
    />
  )
}
