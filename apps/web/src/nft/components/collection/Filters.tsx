import { Box } from 'components/deprecated/Box'
import { Column, Row } from 'nft/components/Flex'
import { getSortDropdownOptions } from 'nft/components/collection/CollectionNfts'
import * as styles from 'nft/components/collection/Filters.css'
import { MarketplaceSelect } from 'nft/components/collection/MarketplaceSelect'
import { PriceRange } from 'nft/components/collection/PriceRange'
import { TraitSelect } from 'nft/components/collection/TraitSelect'
import { FilterSortDropdown } from 'nft/components/common/SortDropdown'
import { useCollectionFilters } from 'nft/hooks'
import { Trait } from 'nft/hooks/useCollectionFilters'
import { TraitPosition } from 'nft/hooks/useTraitsOpen'
import { DropDownOption } from 'nft/types'
import { useMemo } from 'react'
import { Checkbox, Flex, Text } from 'ui/src'
import { isMobileWeb } from 'utilities/src/platform'

export const Filters = ({ traitsByGroup }: { traitsByGroup: Record<string, Trait[]> }) => {
  const { buyNow, setBuyNow } = useCollectionFilters((state) => ({
    buyNow: state.buyNow,
    setBuyNow: state.setBuyNow,
  }))
  const setSortBy = useCollectionFilters((state) => state.setSortBy)
  const hasRarity = useCollectionFilters((state) => state.hasRarity)

  const handleBuyNowToggle = () => {
    setBuyNow(!buyNow)
  }

  const sortDropDownOptions: DropDownOption[] = useMemo(
    () => getSortDropdownOptions(setSortBy, hasRarity ?? false),
    [hasRarity, setSortBy],
  )

  return (
    <Box className={styles.container}>
      <Row width="full" justifyContent="space-between"></Row>
      <Column marginTop="8">
        <Flex row width="100%" justifyContent="space-between" px="$spacing12">
          <Text>Buy now</Text>
          <Checkbox
            testID="nft-collection-filter-buy-now"
            checked={buyNow}
            onPress={handleBuyNowToggle}
            variant="branded"
          />
        </Flex>
        {isMobileWeb && <FilterSortDropdown sortDropDownOptions={sortDropDownOptions} />}
        <MarketplaceSelect />
        <PriceRange />
        {Object.entries(traitsByGroup).length > 0 && (
          <Box
            as="span"
            color="neutral2"
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
