import clsx from 'clsx'
import { Box } from 'nft/components/Box'
import * as styles from 'nft/components/collection/CollectionSearch.css'
import { useIsCollectionLoading } from 'nft/hooks'
import { useCollectionFilters } from 'nft/hooks/useCollectionFilters'
import { FormEvent } from 'react'

export const CollectionSearch = () => {
  const setSearchByNameText = useCollectionFilters((state) => state.setSearch)
  const searchByNameText = useCollectionFilters((state) => state.search)
  const iscollectionStatsLoading = useIsCollectionLoading((state) => state.isCollectionStatsLoading)

  return (
    <Box
      as="input"
      flex="1"
      borderColor={{ default: 'backgroundOutline', focus: 'accentAction' }}
      borderWidth="1.5px"
      borderStyle="solid"
      borderRadius="12"
      padding="12"
      backgroundColor="backgroundSurface"
      maxWidth="332"
      minWidth="0"
      fontSize="16"
      height="44"
      color={{ placeholder: 'textTertiary', default: 'textPrimary' }}
      value={searchByNameText}
      placeholder={iscollectionStatsLoading ? '' : 'Search by name'}
      className={clsx(iscollectionStatsLoading && styles.filterButtonLoading)}
      onChange={(e: FormEvent<HTMLInputElement>) => {
        setSearchByNameText(e.currentTarget.value)
      }}
    />
  )
}
