import { SharedEventName } from '@uniswap/analytics-events'
import { usePortfolioAddress } from 'pages/Portfolio/hooks/usePortfolioAddress'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimateTransition, animationPresets, Flex, Popover, Text, TouchableArea, useSporeColors } from 'ui/src'
import { ArrowUpRight } from 'ui/src/components/icons/ArrowUpRight'
import { MoreHorizontal } from 'ui/src/components/icons/MoreHorizontal'
import { zIndexes } from 'ui/src/theme'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { MenuContent } from 'uniswap/src/components/menus/ContextMenuContent'
import { NftView, NftViewProps } from 'uniswap/src/components/nfts/NftView'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useNFTContextMenuItems } from 'uniswap/src/features/nfts/hooks/useNftContextMenuItems'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { getNftExplorerLink, getOpenseaLink, openUri } from 'uniswap/src/utils/linking'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

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
  const { value: isHovered, setTrue: setIsHovered, setFalse: setIsHoveredFalse } = useBooleanState(false)
  const { value: isPopoverOpen, toggle: togglePopover, setFalse: closePopover } = useBooleanState(false)
  const colors = useSporeColors()
  const { t } = useTranslation()
  const portfolioAddress = usePortfolioAddress()
  const { defaultChainId } = useEnabledChains()

  // Combine hover state and popover open state to keep hovered styles when popover is open
  const isActive = isHovered || isPopoverOpen

  // Active card styles for when hovering or popover is open
  const activeCardStyles = useMemo(
    () => ({
      y: FLOAT_UP_ON_HOVER_OFFSET,
      rotate: `${generateRotationStyle(props.id)}deg`,
      shadowColor: '$shadowColor',
      boxShadow: `0px 4px 12px -3px ${colors.shadowColor.val}, 0px 2px 5px -2px ${colors.shadowColor.val}`,
    }),
    [props.id, colors.shadowColor.val],
  )

  // Generate chainId for the NFT
  const chainId = useMemo(() => {
    if (props.item.chain) {
      return fromGraphQLChain(props.item.chain) ?? undefined
    }
    return undefined
  }, [props.item.chain])

  // Generate OpenSea URL for the NFT
  const openseaUrl = useMemo(() => {
    if (chainId && props.item.contractAddress && props.item.tokenId) {
      return getOpenseaLink({
        chainId,
        contractAddress: props.item.contractAddress,
        tokenId: props.item.tokenId,
      })
    }
    return null
  }, [chainId, props.item.contractAddress, props.item.tokenId])

  // Generate explorer URL for the NFT (fallback when no OpenSea)
  const explorerUrl = useMemo(() => {
    if (!openseaUrl && chainId && props.item.contractAddress && props.item.tokenId) {
      return getNftExplorerLink({
        chainId,
        fallbackChainId: defaultChainId,
        contractAddress: props.item.contractAddress,
        tokenId: props.item.tokenId,
      })
    }
    return null
  }, [openseaUrl, chainId, props.item.contractAddress, props.item.tokenId, defaultChainId])

  // Generate context menu items
  const menuItems = useNFTContextMenuItems({
    contractAddress: props.item.contractAddress,
    tokenId: props.item.tokenId,
    owner: props.owner,
    walletAddresses: [portfolioAddress],
    isSpam: props.item.isSpam,
    showNotification: false,
    chainId,
  })

  const handlePress = useCallback(
    async (event?: any) => {
      // Prefer OpenSea URL, fall back to block explorer if no OpenSea URL available
      const url = openseaUrl || explorerUrl
      if (url) {
        await openUri({ uri: url })
      }
      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        element: ElementName.PortfolioNftItem,
        section: SectionName.PortfolioNftsTab,
        collection_name: props.item.collectionName,
        collection_address: props.item.contractAddress,
        token_id: props.item.tokenId,
      })
      props.onPress?.()
    },
    [openseaUrl, explorerUrl, props.item.collectionName, props.item.contractAddress, props.item.tokenId, props.onPress],
  )

  return (
    <Flex group="item">
      <TouchableArea
        p="$spacing4"
        borderRadius="$rounded16"
        borderWidth="$spacing1"
        borderColor="$surface3"
        gap="$spacing4"
        transition="all 0.2s ease-in-out"
        {...(isActive ? activeCardStyles : {})}
        onMouseEnter={setIsHovered}
        onMouseLeave={setIsHoveredFalse}
        onPress={handlePress}
      >
        {/* Context menu trigger icon */}
        <Flex position="absolute" top="$spacing8" right="$spacing8" onPress={(e) => e.stopPropagation()}>
          <Popover
            allowFlip
            strategy="absolute"
            placement="bottom-end"
            open={isPopoverOpen}
            onOpenChange={togglePopover}
          >
            <Popover.Trigger>
              <TouchableArea
                centered
                backgroundColor="$surface1"
                borderRadius="$rounded12"
                height={iconSizes.icon32}
                width={iconSizes.icon32}
                hoverStyle={{ backgroundColor: '$surface1Hovered' }}
                zIndex={zIndexes.popover}
                transition="opacity 0.2s ease-in-out"
                opacity={isActive ? 1 : 0}
              >
                <MoreHorizontal size="$icon.16" fill={colors.neutral1.val} />
              </TouchableArea>
            </Popover.Trigger>
            <Popover.Content
              backgroundColor="transparent"
              animation="quick"
              zIndex={zIndexes.modal}
              {...animationPresets.fadeInDownOutUp}
            >
              <MenuContent items={menuItems} handleCloseMenu={closePopover} />
            </Popover.Content>
          </Popover>
        </Flex>
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
            currentIndex={isActive ? 1 : 0}
            animationType={isActive ? 'up' : 'down'}
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
                {openseaUrl ? t('common.opensea.link') : t('common.viewOnExplorer')}
              </Text>
              <ArrowUpRight size={iconSizes.icon12} color="$neutral2" />
            </Flex>
          </AnimateTransition>
        </Flex>
      </TouchableArea>
    </Flex>
  )
}
