import clsx from 'clsx'
import { Box } from 'nft/components/Box'
import * as styles from 'nft/components/collection/FilterButton.css'
import { FilterIcon } from 'nft/components/icons'
import { buttonTextMedium } from 'nft/css/common.css'
import { useIsCollectionLoading } from 'nft/hooks'

export const FilterButton = ({
  onClick,
  isMobile,
  isFiltersExpanded,
}: {
  isMobile: boolean
  isFiltersExpanded: boolean
  onClick: () => void
}) => {
  const isCollectionNftsLoading = useIsCollectionLoading((state) => state.isCollectionNftsLoading)

  return (
    <Box
      className={
        isCollectionNftsLoading
          ? styles.filterButtonLoading
          : clsx(styles.filterButton, !isFiltersExpanded && styles.filterButtonExpanded)
      }
      display="flex"
      gap="8"
      borderRadius="12"
      fontSize="16"
      cursor="pointer"
      position="relative"
      onClick={onClick}
      padding="12"
      width={isMobile ? '44' : 'auto'}
      height="44"
      whiteSpace="nowrap"
      color="textPrimary"
    >
      <FilterIcon />
      {!isMobile && !isFiltersExpanded && <Box className={buttonTextMedium}> Filter</Box>}
    </Box>
  )
}
