import { Box } from 'nft/components/Box'
import * as styles from 'nft/components/collection/Filters.css'
import { MarketplaceSelect } from 'nft/components/collection/MarketplaceSelect'
import { PriceRange } from 'nft/components/collection/PriceRange'
import { Column, Row } from 'nft/components/Flex'
import { Radio } from 'nft/components/layout/Radio'
import { useCollectionFilters } from 'nft/hooks'
import { Trait } from 'nft/hooks/useCollectionFilters'
import { groupBy } from 'nft/utils/groupBy'
import { useMemo } from 'react'
import { useReducer } from 'react'
import { badge } from 'nft/css/common.css'

import { TraitSelect } from './TraitSelect'

export const Filters = ({ traits }: { traits: Trait[] }) => {
  const { buyNow, setBuyNow } = useCollectionFilters((state) => ({
    buyNow: state.buyNow,
    setBuyNow: state.setBuyNow,
  }))
  const traitsByGroup: Record<string, Trait[]> = useMemo(() => (traits ? groupBy(traits, 'trait_type') : {}), [traits])
  const [buyNowHovered, toggleBuyNowHover] = useReducer((state) => !state, false)

  const handleBuyNowToggle = () => {
    setBuyNow(!buyNow)
  }

  return (
    <Box className={styles.container}>
      <Row width="full" justifyContent="space-between">
        <Row as="span" color="textSecondary" className={badge}>
          Filters
        </Row>
      </Row>
      <Column paddingTop="8">
        <Row
          justifyContent="space-between"
          className={styles.rowHover}
          gap="2"
          paddingTop="12"
          paddingRight="16"
          paddingBottom="12"
          paddingLeft="12"
          cursor="pointer"
          onClick={(e) => {
            e.preventDefault()
            handleBuyNowToggle()
          }}
          onMouseEnter={toggleBuyNowHover}
          onMouseLeave={toggleBuyNowHover}
        >
          <Box fontSize="14" fontWeight="medium" as="summary">
            Buy now
          </Box>
          <Radio hovered={buyNowHovered} checked={buyNow} onClick={handleBuyNowToggle} />
        </Row>
        <MarketplaceSelect />

        <PriceRange />

        <Box marginTop="12">
          <Box as="span" color="textSecondary" className={badge}>
            Traits
          </Box>

          <Column marginTop="12" marginBottom="60">
            {Object.entries(traitsByGroup).map(([type, traits]) => (
              <TraitSelect key={type} {...{ type, traits }} />
            ))}
          </Column>
        </Box>
      </Column>
    </Box>
  )
}
