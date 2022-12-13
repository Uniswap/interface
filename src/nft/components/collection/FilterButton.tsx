import clsx from 'clsx'
import { Box } from 'nft/components/Box'
import * as styles from 'nft/components/collection/FilterButton.css'
import { FilterIcon } from 'nft/components/icons'
import { buttonTextMedium } from 'nft/css/common.css'
import { breakpoints } from 'nft/css/sprinkles.css'
import { pluralize, putCommas } from 'nft/utils'

export const FilterButton = ({
  onClick,
  isMobile,
  isFiltersExpanded,
  collectionCount = 0,
}: {
  isMobile: boolean
  isFiltersExpanded: boolean
  onClick: () => void
  collectionCount?: number
}) => {
  const hideResultsCount = window.innerWidth >= breakpoints.sm && window.innerWidth < breakpoints.md

  return (
    <Box
      className={clsx(styles.filterButton, !isFiltersExpanded && styles.filterButtonExpanded)}
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
      color="white"
      data-testid="nft-filter"
    >
      <FilterIcon />
      {!isMobile ? (
        <Box className={buttonTextMedium}>
          {' '}
          {!collectionCount || hideResultsCount
            ? 'Filter'
            : `Filter • ${putCommas(collectionCount)} result${pluralize(collectionCount)}`}
        </Box>
      ) : null}
    </Box>
  )
}
