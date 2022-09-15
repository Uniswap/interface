import clsx from 'clsx'
import { Box } from 'nft/components/Box'
import * as styles from 'nft/components/collection/FilterButton.css'
import { Row } from 'nft/components/Flex'
import { FilterIcon } from 'nft/components/icons'
import { useCollectionFilters } from 'nft/hooks'
import { putCommas } from 'nft/utils/putCommas'

export const FilterButton = ({
  onClick,
  isMobile,
  isFiltersExpanded,
  results,
}: {
  isMobile: boolean
  isFiltersExpanded: boolean
  results?: number
  onClick: () => void
}) => {
  const { minPrice, maxPrice, minRarity, maxRarity, traits, markets, buyNow } = useCollectionFilters((state) => ({
    minPrice: state.minPrice,
    maxPrice: state.maxPrice,
    minRarity: state.minRarity,
    maxRarity: state.maxRarity,
    traits: state.traits,
    markets: state.markets,
    buyNow: state.buyNow,
  }))

  const showFilterBadge = minPrice || maxPrice || minRarity || maxRarity || traits.length || markets.length || buyNow
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
        <Row className={styles.filterBadge} color={isFiltersExpanded ? 'grey700' : 'blue400'}>
          •
        </Row>
      )}
      <FilterIcon
        style={{ marginBottom: '-4px', paddingRight: `${!isFiltersExpanded || showFilterBadge ? '6px' : '0px'}` }}
      />
      {!isMobile && !isFiltersExpanded && 'Filter'}

      {showFilterBadge && !isMobile ? (
        <Box display="inline-block" position="relative">
          {!isFiltersExpanded && (
            <Box as="span" position="absolute" left="4" style={{ top: '5px', fontSize: '8px' }}>
              •
            </Box>
          )}
          <Box paddingLeft={!isFiltersExpanded ? '12' : '2'}>{results ? putCommas(results) : 0} results</Box>
        </Box>
      ) : null}
    </Box>
  )
}
