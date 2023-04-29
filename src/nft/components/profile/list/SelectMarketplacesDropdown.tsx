import { SMALL_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { Column, Row } from 'nft/components/Flex'
import { ChevronUpIcon } from 'nft/components/icons'
import { Checkbox } from 'nft/components/layout/Checkbox'
import { buttonTextMedium, caption } from 'nft/css/common.css'
import { themeVars } from 'nft/css/sprinkles.css'
import { ListingMarket } from 'nft/types'
import { getMarketplaceIcon } from 'nft/utils'
import { ListingMarkets } from 'nft/utils/listNfts'
import { Dispatch, FormEvent, useMemo, useReducer, useRef } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { Z_INDEX } from 'theme/zIndex'

const MarketplaceRowWrapper = styled(Row)`
  gap: 6px;
  height: 44px;
  width: 100%;
  cursor: pointer;
  justify-content: space-between;
  padding: 0px 16px;
  &:hover {
    background-color: ${({ theme }) => theme.backgroundInteractive};
  }
  border-radius: 12px;
`

const FeeText = styled.div`
  color: ${({ theme }) => theme.textSecondary};
`

interface MarketplaceRowProps {
  market: ListingMarket
  setSelectedMarkets: Dispatch<ListingMarket[]>
  selectedMarkets: ListingMarket[]
}

const MarketplaceRow = ({ market, setSelectedMarkets, selectedMarkets }: MarketplaceRowProps) => {
  const isSelected = selectedMarkets.includes(market)
  const [hovered, toggleHovered] = useReducer((s) => !s, false)

  const toggleSelected = () => {
    if (selectedMarkets.length === 1 && isSelected) return
    isSelected
      ? setSelectedMarkets(selectedMarkets.filter((selected: ListingMarket) => selected !== market))
      : setSelectedMarkets([...selectedMarkets, market])
  }

  const handleCheckbox = (e: FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }
  return (
    <MarketplaceRowWrapper onMouseEnter={toggleHovered} onMouseLeave={toggleHovered} onClick={toggleSelected}>
      <Row gap="12" onClick={toggleSelected}>
        {getMarketplaceIcon(market.name, '24')}
        <Column>
          <ThemedText.BodyPrimary>{market.name}</ThemedText.BodyPrimary>
          <FeeText className={caption}>{market.fee}% fee</FeeText>
        </Column>
      </Row>

      <Checkbox hovered={hovered} checked={isSelected} onClick={handleCheckbox}>
        <span />
      </Checkbox>
    </MarketplaceRowWrapper>
  )
}

const HeaderButtonWrap = styled(Row)`
  padding: 12px;
  border-radius: 12px;
  width: 180px;
  justify-content: space-between;
  background: ${({ theme }) => theme.backgroundInteractive};
  cursor: pointer;
  &:hover {
    opacity: ${({ theme }) => theme.opacity.hover};
  }
  @media screen and (min-width: ${SMALL_MEDIA_BREAKPOINT}) {
    width: 220px;
  }
`

const HeaderButtonContentWrapper = styled.div`
  display: flex;
`

const MarketIcon = styled.div<{ index: number; totalSelected: number }>`
  height: 20px;
  width: 20px;
  margin-right: 8px;
  outline: 1px solid ${({ theme }) => theme.backgroundInteractive};
  border-radius: 4px;
  z-index: ${({ index, totalSelected }) => totalSelected - index};
  margin-left: ${({ index }) => `${index === 0 ? 0 : -18}px`};
`

const Chevron = styled(ChevronUpIcon)<{ isOpen: boolean }>`
  height: 20px;
  width: 20px;
  fill: ${({ theme }) => theme.textPrimary};
  transition: ${({
    theme: {
      transition: { duration },
    },
  }) => `${duration.fast} transform`};
  transform: ${({ isOpen }) => `rotate(${isOpen ? 0 : 180}deg)`};
`

const ModalWrapper = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
`

const DropdownWrapper = styled(Column)<{ isOpen: boolean }>`
  padding: 16px 0px;
  background-color: ${({ theme }) => theme.backgroundSurface};
  display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
  position: absolute;
  top: 52px;
  width: 100%;
  border-radius: 12px;
  gap: 12px;
  z-index: ${Z_INDEX.modalBackdrop};
  box-shadow: ${({ theme }) => theme.deepShadow};
  border: 0.5px solid ${({ theme }) => theme.backgroundOutline};
`

export const SelectMarketplacesDropdown = ({
  setSelectedMarkets,
  selectedMarkets,
}: {
  setSelectedMarkets: Dispatch<ListingMarket[]>
  selectedMarkets: ListingMarket[]
}) => {
  const [isOpen, toggleIsOpen] = useReducer((s) => !s, false)
  const dropdownDisplayText = useMemo(
    () => (selectedMarkets.length === 1 ? selectedMarkets[0].name : 'Multiple'),
    [selectedMarkets]
  )
  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, () => isOpen && toggleIsOpen())
  return (
    <ModalWrapper ref={ref}>
      <HeaderButtonWrap className={buttonTextMedium} onClick={toggleIsOpen}>
        <HeaderButtonContentWrapper>
          {selectedMarkets.map((market, index) => {
            return (
              <MarketIcon key={index} totalSelected={selectedMarkets.length} index={index}>
                {getMarketplaceIcon(market.name, '20')}
              </MarketIcon>
            )
          })}
          {dropdownDisplayText}
        </HeaderButtonContentWrapper>

        <Chevron isOpen={isOpen} secondaryColor={themeVars.colors.textPrimary} />
      </HeaderButtonWrap>
      <DropdownWrapper isOpen={isOpen}>
        {ListingMarkets.map((market) => {
          return MarketplaceRow({ market, setSelectedMarkets, selectedMarkets })
        })}
      </DropdownWrapper>
    </ModalWrapper>
  )
}
