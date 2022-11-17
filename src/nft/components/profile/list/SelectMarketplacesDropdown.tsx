import clsx from 'clsx'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { ChevronUpIcon } from 'nft/components/icons'
import { buttonTextMedium, caption } from 'nft/css/common.css'
import { ListingMarket } from 'nft/types'
import { ListingMarkets } from 'nft/utils/listNfts'
import { Dispatch, useReducer } from 'react'
import styled from 'styled-components/macro'

import * as styles from './ListPage.css'

const HeaderButtonWrap = styled(Row)`
  padding: 12px;
  border-radius: 12px;
  width: 220px;
  justify-content: space-between;
  background: ${({ theme }) => theme.backgroundInteractive};
  cursor: pointer;
  &:hover {
    opacity: ${({ theme }) => theme.opacity.hover};
  }
`

const HeaderButtonContentWrapper = styled.div`
  display: flex;
  flex-direction: row;
`

const MarketIcon = styled.img<{ index: number; totalSelected: number }>`
  height: 20px;
  width: 20px;
  margin-right: 8px;
  border: 1px solid;
  border-color: ${({ theme }) => theme.backgroundInteractive};
  border-radius: 4px;
  z-index: ${({ index, totalSelected }) => totalSelected - index};
  margin-left: ${({ index }) => `${index * -18}px`};
`

const Chevron = styled(ChevronUpIcon)<{ isOpen: boolean }>`
  height: 20px;
  width: 20px;
  transition: ${({
    theme: {
      transition: { duration },
    },
  }) => `${duration.fast} transform`};
  transform: ${({ isOpen }) => `rotate(${isOpen ? 0 : 180}deg)`};
`

const DropdownWrapper = styled.div`
  display: flex;
  flex-direction: column;
`

export const SelectMarketplacesDropdown = ({
  setSelectedMarkets,
  selectedMarkets,
}: {
  setSelectedMarkets: Dispatch<ListingMarket[]>
  selectedMarkets: ListingMarket[]
}) => {
  const [isOpen, toggleIsOpen] = useReducer((s) => !s, false)
  const dropdownDisplayText = selectedMarkets.length === 1 ? selectedMarkets[0].name : 'Multiple'
  return (
    <DropdownWrapper>
      <HeaderButtonWrap className={buttonTextMedium} onClick={toggleIsOpen}>
        <HeaderButtonContentWrapper>
          {selectedMarkets.map((market, index) => {
            return (
              <MarketIcon
                key={index}
                alt={market.name}
                src={market.icon}
                totalSelected={selectedMarkets.length}
                index={index}
              />
            )
          })}
          {dropdownDisplayText}
        </HeaderButtonContentWrapper>

        <Chevron isOpen={isOpen} />
      </HeaderButtonWrap>
      {isOpen && (
        <Column padding="8">
          {ListingMarkets.map((market) => {
            return GlobalMarketplaceButton({ market, setSelectedMarkets, selectedMarkets })
          })}
        </Column>
      )}
    </DropdownWrapper>
  )
}

interface GlobalMarketplaceButtonProps {
  market: ListingMarket
  setSelectedMarkets: Dispatch<ListingMarket[]>
  selectedMarkets: ListingMarket[]
}

const GlobalMarketplaceButton = ({ market, setSelectedMarkets, selectedMarkets }: GlobalMarketplaceButtonProps) => {
  const isSelected = selectedMarkets.includes(market)
  const toggleSelected = () => {
    isSelected
      ? setSelectedMarkets(selectedMarkets.filter((selected: ListingMarket) => selected !== market))
      : setSelectedMarkets([...selectedMarkets, market])
  }
  return (
    <Row
      gap="6"
      borderRadius="12"
      backgroundColor="backgroundOutline"
      height="44"
      className={clsx(isSelected && styles.buttonSelected)}
      onClick={toggleSelected}
      width="max"
      cursor="pointer"
    >
      <Box
        as="img"
        alt={market.name}
        width={isSelected ? '24' : '20'}
        height={isSelected ? '24' : '20'}
        borderRadius="4"
        objectFit="cover"
        marginLeft={isSelected ? '8' : '12'}
        src={isSelected ? '/nft/svgs/checkmark.svg' : market.icon}
      />
      <Box className={buttonTextMedium}>{market.name}</Box>
      <Box color="textSecondary" className={caption} marginRight="12">
        {market.fee}% fee
      </Box>
    </Row>
  )
}
