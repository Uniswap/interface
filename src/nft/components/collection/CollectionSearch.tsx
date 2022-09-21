/* eslint-disable react-hooks/exhaustive-deps */
import { Box } from 'nft/components/Box'
import { useCollectionFilters } from 'nft/hooks/useCollectionFilters'
import { FormEvent, useState } from 'react'

export const CollectionSearch = () => {
  const [debouncedSearchByNameText, setDebouncedSearchByNameText] = useState('')
  const setSearchByNameText = useCollectionFilters((state) => state.setSearch)

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
      value={debouncedSearchByNameText}
      placeholder={'Search by name'}
      onChange={(e: FormEvent<HTMLInputElement>) => {
        setDebouncedSearchByNameText(e.currentTarget.value)
        setSearchByNameText(e.currentTarget.value)
      }}
    />
  )
}
