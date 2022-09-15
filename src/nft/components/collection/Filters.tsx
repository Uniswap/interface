import { Box } from 'nft/components/Box'
import * as styles from 'nft/components/collection/Filters.css'
import { Column, Row } from 'nft/components/Flex'
import { Radio } from 'nft/components/layout/Radio'
import { useCollectionFilters } from 'nft/hooks'
import { useReducer } from 'react'

export const Filters = () => {
  const { buyNow, setBuyNow } = useCollectionFilters((state) => ({
    buyNow: state.buyNow,
    setBuyNow: state.setBuyNow,
  }))
  const [buyNowHovered, toggleBuyNowHover] = useReducer((state) => !state, false)

  const handleBuyNowToggle = () => {
    setBuyNow(!buyNow)
  }

  return (
    <Box className={styles.container}>
      <Row width="full" justifyContent="space-between">
        <Row as="span" fontSize="20" color="blackBlue">
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
      </Column>
    </Box>
  )
}
