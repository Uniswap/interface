import clsx from 'clsx'
import { Box } from 'nft/components/Box'
import { FilterIcon } from 'nft/components/icons'
import { putCommas } from 'nft/utils/putCommas'

import * as styles from './FilterButton.css'

export const FilterButton = ({
  onClick,
  isMobile,
  isFiltersExpanded,
  showFilterBadge,
  results,
}: {
  isMobile: boolean
  isFiltersExpanded: boolean
  results?: number
  showFilterBadge?: boolean
  onClick: () => void
}) => {
  return (
    <Box
      className={clsx(styles.filterButton, !isFiltersExpanded && styles.filterButtonExpanded)}
      borderRadius="12"
      fontSize="16"
      cursor="pointer"
      position="relative"
      onClick={onClick}
      paddingTop="12"
      paddingLeft="12"
      paddingBottom="12"
      paddingRight={isMobile ? '8' : '12'}
      width={isMobile ? '44' : 'auto'}
      height="44"
      whiteSpace="nowrap"
    >
      {showFilterBadge && (
        <Box className={styles.filterBadge} color={isFiltersExpanded ? 'grey700' : 'blue400'}>
          {String.fromCharCode(8226)}
        </Box>
      )}
      <FilterIcon style={{ marginBottom: '-4px', paddingRight: '6px' }} />
      {!isMobile && !isFiltersExpanded && 'Filter'}

      {showFilterBadge && !isMobile ? (
        <Box display="inline-block" position="relative">
          {!isFiltersExpanded && (
            <span style={{ position: 'absolute', top: '5px', left: '4px', fontSize: '8px' }}>
              {String.fromCharCode(8226)}
            </span>
          )}
          <Box paddingLeft={!isFiltersExpanded ? '12' : '2'}>{results ? putCommas(results) : 0} results</Box>
        </Box>
      ) : null}
    </Box>
  )
}
