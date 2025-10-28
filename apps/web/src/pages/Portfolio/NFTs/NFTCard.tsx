import { SharedEventName } from '@uniswap/analytics-events'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimateTransition, Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { ArrowUpRight } from 'ui/src/components/icons/ArrowUpRight'
import { MoreHorizontal } from 'ui/src/components/icons/MoreHorizontal'
import { zIndexes } from 'ui/src/theme'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { NftView, NftViewProps } from 'uniswap/src/components/nfts/NftView'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { getOpenseaLink, openUri } from 'uniswap/src/utils/linking'

const FLOAT_UP_ON_HOVER_OFFSET = -4

/**
 * Generates a unique rotation angle for an element based on its ID
 * @param id - Unique identifier for the element
 * @returns CSS custom property object with rotation value
 */
function generateRotationStyle(id: string) {
  // Generate hash from ID
  const hashCode = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)

  // Determine rotation direction (positive or negative)
  const direction = hashCode % 2 === 0 ? 1 : -1

  // Generate rotation amount between 0.5 and 2.5 degrees
  const rotationAmount = 0.5 + (hashCode % 201) / 100 // Range: 0.5 to 2.5
  return direction * rotationAmount
}

type NftCardProps = Omit<NftViewProps, 'onPress'> & {
  owner: Address
  id: string
  onPress?: () => void
}

export function NFTCard(props: NftCardProps): JSX.Element {
  const [isHovered, setIsHovered] = useState(false)
  const colors = useSporeColors()
  const { t } = useTranslation()

  // Generate OpenSea URL for the NFT
  const openseaUrl = useMemo(() => {
    if (props.item.chain && props.item.contractAddress && props.item.tokenId) {
      const chainId = fromGraphQLChain(props.item.chain)
      if (chainId) {
        return getOpenseaLink({
          chainId,
          contractAddress: props.item.contractAddress,
          tokenId: props.item.tokenId,
        })
      }
    }
    return null
  }, [props.item.chain, props.item.contractAddress, props.item.tokenId])

  const handlePress = useCallback(async () => {
    if (openseaUrl) {
      await openUri({ uri: openseaUrl })
    }
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.PortfolioNftItem,
      section: SectionName.PortfolioNftsTab,
      collection_name: props.item.collectionName,
      collection_address: props.item.contractAddress,
      token_id: props.item.tokenId,
    })
    props.onPress?.()
  }, [openseaUrl, props.item.collectionName, props.item.contractAddress, props.item.tokenId, props.onPress])

  return (
    <Flex group="item">
      <TouchableArea
        p="$spacing4"
        borderRadius="$rounded20"
        borderWidth="$spacing1"
        borderColor="$surface3"
        gap="$spacing4"
        $group-item-hover={{
          y: FLOAT_UP_ON_HOVER_OFFSET,
          rotate: `${generateRotationStyle(props.id)}deg`,
          shadowColor: '$shadowColor',
          boxShadow: `0px 4px 12px -3px ${colors.shadowColor.val}, 0px 2px 5px -2px ${colors.shadowColor.val}`,
        }}
        transition="all 0.2s ease-in-out"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onPress={handlePress}
      >
        {/* Context menu trigger icon */}
        {/* TODO: open NFT context menu on click */}
        <TouchableArea
          centered
          position="absolute"
          top="$spacing8"
          right="$spacing8"
          backgroundColor="$surface1"
          borderRadius="$rounded12"
          height={iconSizes.icon32}
          width={iconSizes.icon32}
          hoverStyle={{ backgroundColor: '$surface1Hovered' }}
          zIndex={zIndexes.popover}
          transition="opacity 0.2s ease-in-out"
          opacity={isHovered ? 1 : 0}
          onPress={(event) => event.stopPropagation()}
        >
          <MoreHorizontal size={16} fill={colors.neutral1.val} />
        </TouchableArea>
        <Flex borderRadius="$rounded20" overflow="hidden">
          {/* Let the parent card handle the onPress */}
          <NftView {...props} hoverAnimation={false} onPress={() => {}} />
        </Flex>
        <Flex py="$spacing8" px="$spacing12">
          <Text variant="body3" numberOfLines={1}>
            {props.item.name}
          </Text>
          <AnimateTransition
            animation="fast"
            currentIndex={isHovered ? 1 : 0}
            animationType={isHovered ? 'up' : 'down'}
            distance={4}
          >
            <Flex row alignItems="center" gap="$spacing4" justifyContent="space-between">
              <Text variant="body4" color="$neutral2" numberOfLines={1}>
                {props.item.collectionName}
              </Text>
              {props.item.chain && <NetworkLogo chainId={fromGraphQLChain(props.item.chain)} size={iconSizes.icon12} />}
            </Flex>
            <Flex row alignItems="center" gap="$spacing2">
              <Text variant="body4" color="$neutral2">
                {t('common.opensea.link')}
              </Text>
              <ArrowUpRight size={iconSizes.icon12} color="$neutral2" />
            </Flex>
          </AnimateTransition>
        </Flex>
      </TouchableArea>
    </Flex>
  )
}
