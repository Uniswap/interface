import clsx from 'clsx'
import { Box } from 'nft/components/Box'
import * as styles from 'nft/components/collection/Filters.css'
import { MarketplaceSelect } from 'nft/components/collection/MarketplaceSelect'
import { PriceRange } from 'nft/components/collection/PriceRange'
import { Column, Row } from 'nft/components/Flex'
import { Radio } from 'nft/components/layout/Radio'
import { caption } from 'nft/css/common.css'
import { useCollectionFilters } from 'nft/hooks'
import { Trait } from 'nft/hooks/useCollectionFilters'
import { groupBy } from 'nft/utils/groupBy'
import { useMemo } from 'react'
import { useReducer } from 'react'
import { Checkbox } from 'nft/components/layout/Checkbox'

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
      <Row width="full" justifyContent="space-between"></Row>
      <Column marginTop="8">
        <Row
          justifyContent="space-between"
          className={styles.rowHover}
          gap="2"
          borderRadius="12"
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
          <Box fontSize="16" fontWeight="medium" as="summary" lineHeight="20">
            Buy now
          </Box>

          <Checkbox hovered={buyNowHovered} checked={buyNow} onClick={handleBuyNowToggle}>
            <span />
          </Checkbox>
        </Row>
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
            <TraitSelect key={type} {...{ type, traits }} index={index} />
          ))}
        </Column>
      </Column>
    </Box>
  )
}
