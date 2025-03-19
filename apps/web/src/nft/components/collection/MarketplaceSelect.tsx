import { NFTEventName, NFTFilterTypes } from '@uniswap/analytics-events'
import { ChevronUpIcon } from 'nft/components/icons'
import { useCollectionFilters } from 'nft/hooks/useCollectionFilters'
import { TraitPosition, useTraitsOpen } from 'nft/hooks/useTraitsOpen'
import { getMarketplaceIcon } from 'nft/utils'
import { useEffect, useMemo, useState } from 'react'
import { ClickableTamaguiStyle, ThemedText } from 'theme/components'
import { Checkbox, Flex, Text, useSporeColors } from 'ui/src'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'

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
  onClick: (e: any) => void
}) => {
  return (
    <Flex
      row
      onPress={onClick}
      justifyContent="space-between"
      px={10}
      pt="$padding16"
      pb="$padding12"
      cursor="pointer"
      borderRadius="$rounded12"
      hoverStyle={{
        backgroundColor: '$surface2',
      }}
    >
      <ThemedText.BodyPrimary>{title}</ThemedText.BodyPrimary>
      <ThemedText.SubHeaderSmall>{element}</ThemedText.SubHeaderSmall>
    </Flex>
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
  useEffect(() => {
    setCheckboxSelected(isMarketSelected)
  }, [isMarketSelected])
  const handleCheckbox = () => {
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
    <Flex row alignItems="center" gap="$gap8">
      <Checkbox variant="branded" checked={isCheckboxSelected} onCheckedChange={handleCheckbox} />
      <Text variant="body2">{String(count)}</Text>
    </Flex>
  )

  const titleWithLogo = (
    <Flex row gap="$gap8">
      {getMarketplaceIcon(title, '16')}
      {title}
    </Flex>
  )

  return (
    <Flex key={value}>
      <FilterItem title={titleWithLogo} element={checkbox} onClick={handleCheckbox} />
    </Flex>
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
  onClick: (e: any) => void
  isOpen: boolean
}) => {
  const colors = useSporeColors()
  return (
    <>
      <Flex
        my="$padding8"
        width="100%"
        borderColor="surface3"
        borderTopWidth={isOpen ? 1 : 0}
        opacity={isOpen ? 1 : 0}
      />
      <Flex {...ClickableTamaguiStyle} borderRadius={isOpen ? 0 : '$rounded12'}>
        <Flex
          row
          alignItems="center"
          justifyContent="space-between"
          p="$padding12"
          borderRadius="$rounded12"
          maxHeight={48}
          onPress={onClick}
          hoverStyle={{
            backgroundColor: '$surface3',
          }}
        >
          <Text variant="body2">{title}</Text>
          <Flex
            centered
            $platform-web={{
              display: 'inline-block',
            }}
            height="$spacing28"
            width="$spacing28"
            animation="fast"
            rotate={isOpen ? '0deg' : '180deg'}
            mr={-1}
          >
            <ChevronUpIcon fill={colors.neutral2.val} style={{ marginLeft: '-1px' }} />
          </Flex>
        </Flex>
        {isOpen && (
          <Flex pb="$padding8" pl={0}>
            {items}
          </Flex>
        )}
      </Flex>
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
    [addMarket, marketCount, removeMarket, selectedMarkets],
  )

  const onClick = (e: any) => {
    e.preventDefault()
    setOpen(!isOpen)
    setTraitsOpen(TraitPosition.MARKPLACE_INDEX, !isOpen)
  }

  return <FilterDropdown title="Marketplaces" items={MarketplaceItems} onClick={onClick} isOpen={isOpen} />
}
