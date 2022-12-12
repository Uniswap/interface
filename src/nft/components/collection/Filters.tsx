import { Box } from 'nft/components/Box'
import * as styles from 'nft/components/collection/Filters.css'
import { MarketplaceSelect } from 'nft/components/collection/MarketplaceSelect'
import { PriceRange } from 'nft/components/collection/PriceRange'
import { Column, Row } from 'nft/components/Flex'
import { Checkbox } from 'nft/components/layout/Checkbox'
import { subhead } from 'nft/css/common.css'
import { useCollectionFilters } from 'nft/hooks'
import { Trait } from 'nft/hooks/useCollectionFilters'
import { TraitPosition } from 'nft/hooks/useTraitsOpen'
import { DropDownOption } from 'nft/types'
import { useMemo, useReducer } from 'react'
import { isMobile } from 'utils/userAgent'

import { FilterSortDropdown } from '../common/SortDropdown'
import { getSortDropdownOptions } from './CollectionNfts'
import { TraitSelect } from './TraitSelect'

export const Filters = ({ traitsByGroup }: { traitsByGroup: Record<string, Trait[]> }) => {
  const { buyNow, setBuyNow } = useCollectionFilters((state) => ({
    buyNow: state.buyNow,
    setBuyNow: state.setBuyNow,
  }))
  const setSortBy = useCollectionFilters((state) => state.setSortBy)
  const hasRarity = useCollectionFilters((state) => state.hasRarity)
  const [buyNowHovered, toggleBuyNowHover] = useReducer((state) => !state, false)

  const handleBuyNowToggle = () => {
    setBuyNow(!buyNow)
  }

  const sortDropDownOptions: DropDownOption[] = useMemo(
    () => getSortDropdownOptions(setSortBy, hasRarity ?? false),
    [hasRarity, setSortBy]
  )

  return (
    <Box className={styles.container}>
      <Row width="full" justifyContent="space-between"></Row>
      <Column marginTop="8">
        <Row
          justifyContent="space-between"
          className={`${styles.row} ${styles.rowHover}`}
          gap="2"
          borderRadius="12"
          paddingTop="12"
          paddingBottom="12"
          paddingLeft="12"
          onClick={(e) => {
            e.preventDefault()
            handleBuyNowToggle()
          }}
          onMouseEnter={toggleBuyNowHover}
          onMouseLeave={toggleBuyNowHover}
        >
          <Box data-testid="nft-collection-filter-buy-now" className={subhead}>
            Buy now
          </Box>
          <Checkbox hovered={buyNowHovered} checked={buyNow} onClick={handleBuyNowToggle}>
            <span />
          </Checkbox>
        </Row>
        {isMobile && <FilterSortDropdown sortDropDownOptions={sortDropDownOptions} />}
        <MarketplaceSelect />
        <PriceRange />
        {Object.entries(traitsByGroup).length > 0 && (
          <Box
            as="span"
            color="textSecondary"
            paddingLeft="8"
            marginTop="12"
            marginBottom="12"
            className={styles.borderTop}
          ></Box>
        )}

        <Column>
          {Object.entries(traitsByGroup).map(([type, traits], index) => (
            // the index is offset by two because price range and marketplace appear prior to it
            <TraitSelect key={type} {...{ type, traits }} index={index + TraitPosition.TRAIT_START_INDEX} />
          ))}
        </Column>
      </Column>
    </Box>
  )
}
