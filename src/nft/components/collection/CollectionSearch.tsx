import { Box } from 'nft/components/Box'
import { useIsLoading } from 'nft/hooks'
import { useCollectionFilters } from 'nft/hooks/useCollectionFilters'
import { FormEvent } from 'react'

import * as styles from 'nft/components/collection/CollectionSearch'

export const CollectionSearch = () => {
  const setSearchByNameText = useCollectionFilters((state) => state.setSearch)
  const searchByNameText = useCollectionFilters((state) => state.search)
  const isLoading = useIsLoading((state) => state.isLoading)

  return (
    <Box
      as="input"
      borderColor={{ default: 'medGray', focus: 'genieBlue' }}
      borderWidth="1px"
      borderStyle="solid"
      borderRadius="12"
      padding="12"
      backgroundColor="white"
      fontSize="16"
      height="44"
      color={{ placeholder: 'darkGray', default: 'blackBlue' }}
      value={searchByNameText}
      placeholder={'Search by name'}
      onChange={(e: FormEvent<HTMLInputElement>) => {
        setSearchByNameText(e.currentTarget.value)
      }}
    />
  )
}
