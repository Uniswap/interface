import clsx from 'clsx'
import { Box } from 'nft/components/Box'
import * as styles from 'nft/components/collection/Filters.css'
import { Column, Row } from 'nft/components/Flex'
import { ChevronUpIcon } from 'nft/components/icons'
import { subheadSmall } from 'nft/css/common.css'
import { useCollectionFilters } from 'nft/hooks/useCollectionFilters'
import { FormEvent, useEffect, useReducer, useState } from 'react'

import { Checkbox } from '../layout/Checkbox'

export const marketPlaceItems = {
  looksrare: 'LooksRare',
  nft20: 'NFT20',
  nftx: 'NFTX',
  opensea: 'OpenSea',
  x2y2: 'X2Y2',
}

const MarketplaceItem = ({
  title,
  value,
  addMarket,
  removeMarket,
  isMarketSelected,
  count,
}: {
  title: string
  value: string
  addMarket: (market: string) => void
  removeMarket: (market: string) => void
  isMarketSelected: boolean
  count?: number
}) => {
  const [isCheckboxSelected, setCheckboxSelected] = useState(false)
  const [hovered, toggleHover] = useReducer((state) => !state, false)
  useEffect(() => {
    setCheckboxSelected(isMarketSelected)
  }, [isMarketSelected])
  const handleCheckbox = (e: FormEvent) => {
    e.preventDefault()
    if (!isCheckboxSelected) {
      addMarket(value)
      setCheckboxSelected(true)
    } else {
      removeMarket(value)
      setCheckboxSelected(false)
    }
  }

  return (
    <Row
      key={value}
      justifyContent="space-between"
      maxWidth="full"
      overflowX={'hidden'}
      overflowY={'hidden'}
      fontWeight="normal"
      className={`${subheadSmall} ${styles.subRowHover}`}
      paddingLeft="12"
      paddingRight="12"
      cursor="pointer"
      style={{ paddingBottom: '21px', paddingTop: '21px', maxHeight: '44px' }}
      onMouseEnter={toggleHover}
      onMouseLeave={toggleHover}
      onClick={handleCheckbox}
    >
      <Box as="span" fontSize="14" fontWeight="normal">
        {title}{' '}
      </Box>
      <Checkbox checked={isCheckboxSelected} hovered={hovered} onChange={handleCheckbox}>
        <Box as="span" color="textSecondary" marginLeft="4" paddingRight={'12'}>
          {count}
        </Box>
      </Checkbox>
    </Row>
  )
}

export const MarketplaceSelect = () => {
  const {
    addMarket,
    removeMarket,
    markets: selectedMarkets,
    marketCount,
  } = useCollectionFilters(({ markets, marketCount, removeMarket, addMarket }) => ({
    markets,
    marketCount,
    removeMarket,
    addMarket,
  }))

  const [isOpen, setOpen] = useState(!!selectedMarkets.length)

  return (
    <Box
      as="details"
      className={clsx(subheadSmall, !isOpen && styles.rowHover, isOpen && styles.detailsOpen)}
      borderRadius="12"
      open={isOpen}
    >
      <Box
        as="summary"
        className={clsx(isOpen && styles.summaryOpen, isOpen ? styles.rowHoverOpen : styles.rowHover)}
        display="flex"
        justifyContent="space-between"
        cursor="pointer"
        alignItems="center"
        fontSize="14"
        paddingTop="12"
        paddingLeft="12"
        paddingRight="12"
        paddingBottom={isOpen ? '8' : '12'}
        onClick={(e) => {
          e.preventDefault()
          setOpen(!isOpen)
        }}
      >
        Marketplaces
        <Box
          color="textSecondary"
          transition="250"
          height="28"
          width="28"
          style={{
            transform: `rotate(${isOpen ? 0 : 180}deg)`,
          }}
        >
          <ChevronUpIcon />
        </Box>
      </Box>
      <Column className={styles.filterDropDowns} paddingLeft="0">
        {Object.entries(marketPlaceItems).map(([value, title]) => (
          <MarketplaceItem
            key={value}
            title={title}
            value={value}
            count={marketCount?.[value] || 0}
            {...{ addMarket, removeMarket, isMarketSelected: selectedMarkets.includes(value) }}
          />
        ))}
      </Column>
    </Box>
  )
}
