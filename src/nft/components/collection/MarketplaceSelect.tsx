import { sendAnalyticsEvent } from '@uniswap/analytics'
import { NFTEventName, NFTFilterTypes } from '@uniswap/analytics-events'
import clsx from 'clsx'
import { Box } from 'nft/components/Box'
import * as styles from 'nft/components/collection/Filters.css'
import { Column, Row } from 'nft/components/Flex'
import { ChevronUpIcon } from 'nft/components/icons'
import { subheadSmall } from 'nft/css/common.css'
import { useCollectionFilters } from 'nft/hooks/useCollectionFilters'
import { TraitPosition, useTraitsOpen } from 'nft/hooks/useTraitsOpen'
import { getMarketplaceIcon } from 'nft/utils'
import { FormEvent, useEffect, useMemo, useReducer, useState } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { Checkbox } from '../layout/Checkbox'

const FilterItemWrapper = styled(Row)`
  justify-content: space-between;
  padding: 10px 16px 10px 12px;
  cursor: pointer;
  border-radius: 12px;
  &:hover {
    background: ${({ theme }) => theme.backgroundInteractive};
  }
`

const MarketNameWrapper = styled(Row)`
  gap: 10px;
`

export const MARKETPLACE_ITEMS = {
  x2y2: 'X2Y2',
  opensea: 'OpenSea',
  looksrare: 'LooksRare',
  sudoswap: 'SudoSwap',

  nftx: 'NFTX',
  nft20: 'NFT20',
  cryptopunks: 'LarvaLabs',
}

export const FilterItem = ({
  title,
  element,
  onClick,
}: {
  title: string | JSX.Element
  element: JSX.Element
  onClick: React.MouseEventHandler<HTMLElement>
}) => {
  return (
    <FilterItemWrapper onClick={onClick}>
      <ThemedText.BodyPrimary>{title}</ThemedText.BodyPrimary>
      <ThemedText.SubHeaderSmall>{element}</ThemedText.SubHeaderSmall>
    </FilterItemWrapper>
  )
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
    sendAnalyticsEvent(NFTEventName.NFT_FILTER_SELECTED, { filter_type: NFTFilterTypes.MARKETPLACE })
  }

  const checkbox = (
    <Checkbox checked={isCheckboxSelected} hovered={hovered} onChange={handleCheckbox}>
      <Box as="span" color="textSecondary" marginLeft="4" paddingRight="12">
        {count}
      </Box>
    </Checkbox>
  )

  const titleWithLogo = (
    <MarketNameWrapper>
      {getMarketplaceIcon(title, '16')}
      {title}
    </MarketNameWrapper>
  )

  return (
    <div key={value} onMouseEnter={toggleHover} onMouseLeave={toggleHover}>
      <FilterItem title={titleWithLogo} element={checkbox} onClick={handleCheckbox} />
    </div>
  )
}

export const FilterDropdown = ({
  title,
  items,
  onClick,
  isOpen,
}: {
  title: string
  items: JSX.Element[]
  onClick: React.MouseEventHandler<HTMLElement>
  isOpen: boolean
}) => {
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
          onClick={onClick}
        >
          {title}
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
          {items}
        </Column>
      </Box>
    </>
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
  const setTraitsOpen = useTraitsOpen((state) => state.setTraitsOpen)

  const MarketplaceItems = useMemo(
    () =>
      Object.entries(MARKETPLACE_ITEMS).map(([value, title]) => (
        <MarketplaceItem
          key={value}
          title={title}
          value={value}
          count={marketCount?.[value] || 0}
          {...{ addMarket, removeMarket, isMarketSelected: selectedMarkets.includes(value) }}
        />
      )),
    [addMarket, marketCount, removeMarket, selectedMarkets]
  )

  const onClick: React.MouseEventHandler<HTMLElement> = (e) => {
    e.preventDefault()
    setOpen(!isOpen)
    setTraitsOpen(TraitPosition.MARKPLACE_INDEX, !isOpen)
  }

  return <FilterDropdown title="Marketplaces" items={MarketplaceItems} onClick={onClick} isOpen={isOpen} />
}
