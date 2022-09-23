import { Box } from 'nft/components/Box'
import * as styles from 'nft/components/collection/Filters.css'
import { MarketplaceSelect } from 'nft/components/collection/MarketplaceSelect'
import { PriceRange } from 'nft/components/collection/PriceRange'
import { Column, Row } from 'nft/components/Flex'
import { Radio } from 'nft/components/layout/Radio'
import { useCollectionFilters } from 'nft/hooks'
import { Trait } from 'nft/hooks/useCollectionFilters'
import { groupBy } from 'nft/utils/groupBy'
import { FocusEventHandler, FormEvent, useMemo, useState } from 'react'
import { useReducer } from 'react'

import { Input } from '../layout/Input'
import { TraitSelect } from './TraitSelect'

export const Filters = ({
  traits,
  traitsByAmount,
}: {
  traits: Trait[]
  traitsByAmount: {
    traitCount: number
    numWithTrait: number
  }[]
}) => {
  const { buyNow, setBuyNow } = useCollectionFilters((state) => ({
    buyNow: state.buyNow,
    setBuyNow: state.setBuyNow,
  }))
  const traitsByGroup: Record<string, Trait[]> = useMemo(() => {
    if (traits) {
      let groupedTraits = groupBy(traits, 'trait_type')
      groupedTraits['Number of traits'] = []
      for (let i = 0; i < traitsByAmount.length; i++) {
        groupedTraits['Number of traits'].push({
          trait_type: 'Number of traits',
          trait_value: traitsByAmount[i].traitCount,
          trait_count: traitsByAmount[i].numWithTrait,
        })
      }
      groupedTraits = Object.assign({ 'Number of traits': null }, groupedTraits)
      return groupedTraits
    } else return {}
  }, [traits, traitsByAmount])

  const [buyNowHovered, toggleBuyNowHover] = useReducer((state) => !state, false)
  const [search, setSearch] = useState('')

  const handleBuyNowToggle = () => {
    setBuyNow(!buyNow)
  }

  const handleFocus: FocusEventHandler<HTMLInputElement> = (e) => {
    e.currentTarget.placeholder = ''
  }
  const handleBlur: FocusEventHandler<HTMLInputElement> = (e) => {
    e.currentTarget.placeholder = 'Search traits'
  }

  return (
    <Box className={styles.container}>
      <Row width="full" justifyContent="space-between">
        <Row as="span" fontSize="20" color="textPrimary">
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
        <Box marginTop="12" marginBottom="12">
          <Box as="span" fontSize="20">
            Price
          </Box>
          <PriceRange />
        </Box>
        <Box marginTop="12">
          <Box as="span" fontSize="20">
            Traits
          </Box>

          <Column marginTop="12" marginBottom="60" gap={{ sm: '4' }}>
            <Input
              display={!traits?.length ? 'none' : undefined}
              value={search}
              onChange={(e: FormEvent<HTMLInputElement>) => setSearch(e.currentTarget.value)}
              width="full"
              marginBottom="8"
              placeholder="Search traits"
              autoComplete="off"
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={{ border: '2px solid rgba(153, 161, 189, 0.24)', maxWidth: '300px' }}
            />
            {Object.entries(traitsByGroup).map(([type, traits]) => (
              <TraitSelect key={type} {...{ type, traits, search }} />
            ))}
          </Column>
        </Box>
      </Column>
    </Box>
  )
}
