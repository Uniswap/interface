import { useOnClickOutside } from 'hooks/useOnClickOutside'
import styled from 'lib/styled-components'
import { ChevronUpIcon } from 'nft/components/icons'
import { ListingMarket } from 'nft/types'
import { getMarketplaceIcon } from 'nft/utils'
import { ListingMarkets } from 'nft/utils/listNfts'
import { Dispatch, useMemo, useReducer, useRef } from 'react'
import { ThemedText } from 'theme/components'
import { Checkbox, Flex, Text, useSporeColors } from 'ui/src'
import { zIndexes } from 'ui/src/theme'

interface MarketplaceRowProps {
  market: ListingMarket
  setSelectedMarkets: Dispatch<ListingMarket[]>
  selectedMarkets: ListingMarket[]
}

const MarketplaceRow = ({ market, setSelectedMarkets, selectedMarkets }: MarketplaceRowProps) => {
  const isSelected = selectedMarkets.includes(market)

  const toggleSelected = () => {
    if (selectedMarkets.length === 1 && isSelected) {
      return
    }
    isSelected
      ? setSelectedMarkets(selectedMarkets.filter((selected: ListingMarket) => selected !== market))
      : setSelectedMarkets([...selectedMarkets, market])
  }

  return (
    <Flex
      row
      onPress={toggleSelected}
      gap="$gap6"
      height="$spacing44"
      width="100%"
      cursor="pointer"
      justifyContent="space-between"
      px="$padding16"
      borderRadius="$rounded12"
      hoverStyle={{
        backgroundColor: '$surface3',
      }}
    >
      <Flex row gap="$gap12" onPress={toggleSelected}>
        {getMarketplaceIcon(market.name, '24')}
        <Flex>
          <ThemedText.BodyPrimary>{market.name}</ThemedText.BodyPrimary>
          <Text variant="body4" color="$neutral2">
            {market.fee}% fee
          </Text>
        </Flex>
      </Flex>

      <Checkbox checked={isSelected} onPress={toggleSelected} variant="branded" />
    </Flex>
  )
}

const HeaderButtonContentWrapper = styled.div`
  display: flex;
`

const MarketIcon = styled.div<{ index: number; totalSelected: number }>`
  height: 20px;
  width: 20px;
  margin-right: 8px;
  outline: 1px solid ${({ theme }) => theme.surface3};
  border-radius: 4px;
  z-index: ${({ index, totalSelected }) => totalSelected - index};
  margin-left: ${({ index }) => `${index === 0 ? 0 : -18}px`};
`

const Chevron = styled(ChevronUpIcon)<{ isOpen: boolean }>`
  height: 20px;
  width: 20px;
  fill: ${({ theme }) => theme.neutral1};
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

export const SelectMarketplacesDropdown = ({
  setSelectedMarkets,
  selectedMarkets,
}: {
  setSelectedMarkets: Dispatch<ListingMarket[]>
  selectedMarkets: ListingMarket[]
}) => {
  const [isOpen, toggleIsOpen] = useReducer((s) => !s, false)
  const colors = useSporeColors()
  const dropdownDisplayText = useMemo(
    () => (selectedMarkets.length === 1 ? selectedMarkets[0].name : 'Multiple'),
    [selectedMarkets],
  )
  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, () => isOpen && toggleIsOpen())
  return (
    <ModalWrapper ref={ref}>
      <Flex
        row
        onPress={toggleIsOpen}
        p="$padding12"
        borderRadius="$rounded12"
        width={180}
        justifyContent="space-between"
        backgroundColor="$surface3"
        cursor="pointer"
        hoverStyle={{
          opacity: 0.5,
        }}
        $md={{
          width: 220,
        }}
      >
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

        <Chevron isOpen={isOpen} secondaryColor={colors.neutral1.val} />
      </Flex>
      <Flex
        py="$padding16"
        backgroundColor="$surface1"
        display={isOpen ? 'flex' : 'none'}
        position="absolute"
        top={52}
        width="100%"
        borderRadius="$rounded12"
        gap="$spacing12"
        zIndex={zIndexes.modalBackdrop}
        boxShadow="$deep"
        borderWidth={0.5}
        borderColor="$surface3"
      >
        {ListingMarkets.map((market) => {
          return MarketplaceRow({ market, setSelectedMarkets, selectedMarkets })
        })}
      </Flex>
    </ModalWrapper>
  )
}
