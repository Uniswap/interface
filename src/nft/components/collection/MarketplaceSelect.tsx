import { sendAnalyticsEvent } from 'analytics'
import { EventName, FilterTypes } from 'analytics/constants'
import clsx from 'clsx'
import { NftGraphQlVariant, useNftGraphQlFlag } from 'featureFlags/flags/nftGraphQl'
import { Box } from 'nft/components/Box'
import * as styles from 'nft/components/collection/Filters.css'
import { Column, Row } from 'nft/components/Flex'
import { ChevronUpIcon } from 'nft/components/icons'
import { subheadSmall } from 'nft/css/common.css'
import { useCollectionFilters } from 'nft/hooks/useCollectionFilters'
import { useTraitsOpen } from 'nft/hooks/useTraitsOpen'
import { TraitPosition } from 'nft/hooks/useTraitsOpen'
import { FormEvent, useEffect, useMemo, useReducer, useState } from 'react'

import { Checkbox } from '../layout/Checkbox'

export const MARKETPLACE_ITEMS = {
  looksrare: 'LooksRare',
  nft20: 'NFT20',
  nftx: 'NFTX',
  opensea: 'OpenSea',
  x2y2: 'X2Y2',
  cryptopunks: 'LarvaLabs',
  sudoswap: 'SudoSwap',
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
    sendAnalyticsEvent(EventName.NFT_FILTER_SELECTED, { filter_type: FilterTypes.MARKETPLACE })
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
      paddingRight="16"
      borderRadius="12"
      cursor="pointer"
      maxHeight="44"
      style={{ paddingBottom: '22px', paddingTop: '22px' }}
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

const GRAPHQL_MARKETS = ['cryptopunks', 'sudoswap']

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
  const setTraitsOpen = useTraitsOpen((state) => state.setTraitsOpen)
  const isNftGraphQl = useNftGraphQlFlag() === NftGraphQlVariant.Enabled

  const MarketplaceItems = useMemo(
    () =>
      Object.entries(MARKETPLACE_ITEMS)
        .filter(([value]) => isNftGraphQl || !GRAPHQL_MARKETS.includes(value))
        .map(([value, title]) => (
          <MarketplaceItem
            key={value}
            title={title}
            value={value}
            count={marketCount?.[value] || 0}
            {...{ addMarket, removeMarket, isMarketSelected: selectedMarkets.includes(value) }}
          />
        )),
    [addMarket, isNftGraphQl, marketCount, removeMarket, selectedMarkets]
  )

  return (
    <>
      <Box className={styles.detailsOpen} opacity={isOpen ? '1' : '0'} />
      <Box
        as="details"
        className={clsx(subheadSmall, !isOpen && styles.rowHover)}
        open={isOpen}
        borderRadius={isOpen ? '0' : '12'}
      >
        <Box
          as="summary"
          className={`${styles.row} ${styles.rowHover}`}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          fontSize="16"
          paddingTop="12"
          paddingLeft="12"
          paddingBottom="12"
          lineHeight="20"
          borderRadius="12"
          maxHeight="48"
          onClick={(e) => {
            e.preventDefault()
            setOpen(!isOpen)
            setTraitsOpen(TraitPosition.MARKPLACE_INDEX, !isOpen)
          }}
        >
          Marketplaces
          <Box display="flex" alignItems="center">
            <Box
              className={styles.chevronContainer}
              style={{
                transform: `rotate(${isOpen ? 0 : 180}deg)`,
              }}
            >
              <ChevronUpIcon className={styles.chevronIcon} />
            </Box>
          </Box>
        </Box>
        <Column className={styles.filterDropDowns} paddingBottom="8" paddingLeft="0">
          {MarketplaceItems}
        </Column>
      </Box>
    </>
  )
}
