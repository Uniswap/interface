import { SharedEventName } from '@uniswap/analytics-events'
import { usePortfolioAddresses } from 'pages/Portfolio/hooks/usePortfolioAddresses'
import { generateRotationStyle } from 'pages/Portfolio/NFTs/generateRotationStyle'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
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
import { getNFTAssetKey } from 'uniswap/src/features/nfts/utils'
import { ElementName, SectionName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { getNftExplorerLink, getOpenseaLink, openUri } from 'uniswap/src/utils/linking'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { filterDefinedWalletAddresses } from 'utils/filterDefinedWalletAddresses'

const FLOAT_UP_ON_HOVER_OFFSET = -4

let openNftPopoverId: string | null = null

function getOpenNftPopoverId(): string | null {
  return openNftPopoverId
}

export function setOpenNftPopoverId(id: string | null): void {
  openNftPopoverId = id
}

type NftCardProps = Omit<NftViewProps, 'onPress'> & {
  owner: Address
  id: string
  onPress?: () => void
}

function _NFTCard(props: NftCardProps): JSX.Element {
  const { value: isHovered, setTrue: setIsHovered, setFalse: setIsHoveredFalse } = useBooleanState(false)
  const colors = useSporeColors()
  const { t } = useTranslation()
  const { evmAddress, svmAddress } = usePortfolioAddresses()
  const { defaultChainId } = useEnabledChains()

  const nftUniqueId = useMemo(
    () => getNFTAssetKey(props.item.contractAddress ?? '', props.item.tokenId ?? ''),
    [props.item.contractAddress, props.item.tokenId],
  )

  const [openPopoverId, setOpenPopoverId] = useState<string | null>(() => getOpenNftPopoverId())
  const isPopoverOpen = openPopoverId === nftUniqueId
  const trace = useTrace()

  useEffect(() => {
    setOpenPopoverId(getOpenNftPopoverId())
  }, [])

  // Track menu open
  useEffect(() => {
    if (isPopoverOpen) {
      sendAnalyticsEvent(UniswapEventName.ContextMenuOpened, {
        element: ElementName.PortfolioNftContextMenu,
        section: SectionName.PortfolioNftsTab,
        ...trace,
      })
    }
  }, [isPopoverOpen, trace])

  const handlePopoverOpenChange = useCallback(
    (open: boolean) => {
      const newId = open ? nftUniqueId : null
      setOpenNftPopoverId(newId)
      setOpenPopoverId(newId)

      // Track menu close
      if (!open && isPopoverOpen) {
        sendAnalyticsEvent(UniswapEventName.ContextMenuClosed, {
          element: ElementName.PortfolioNftContextMenu,
          section: SectionName.PortfolioNftsTab,
          ...trace,
        })
      }
    },
    [nftUniqueId, isPopoverOpen, trace],
  )

  const closePopover = useCallback(() => {
    setOpenNftPopoverId(null)
    setOpenPopoverId(null)
  }, [])

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
    walletAddresses: filterDefinedWalletAddresses([evmAddress, svmAddress]),
    isSpam: props.item.isSpam,
    showNotification: false,
    chainId,
  })

  const handlePress = useCallback(
    async (event?: any) => {
      // Prefer OpenSea URL, fall back to block explorer if no OpenSea URL available
      const url = openseaUrl || explorerUrl
      const linkType = openseaUrl ? 'opensea' : 'block_explorer'

      if (url) {
        await openUri({ uri: url })
      }

      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        element: ElementName.PortfolioNftItem,
        section: SectionName.PortfolioNftsTab,
        collection_name: props.item.collectionName,
        collection_address: props.item.contractAddress,
        token_id: props.item.tokenId,
        link_type: linkType,
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
            onOpenChange={handlePopoverOpenChange}
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
              zIndex={zIndexes.popover}
              {...animationPresets.fadeInDownOutUp}
            >
              <MenuContent
                items={menuItems}
                handleCloseMenu={closePopover}
                elementName={ElementName.PortfolioNftContextMenuItem}
                sectionName={SectionName.PortfolioNftsTab}
                trackItemClicks
              />
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
              {props.item.chain && chainId && <NetworkLogo chainId={chainId} size={iconSizes.icon12} />}
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

export const NFTCard = memo(_NFTCard)

NFTCard.displayName = 'NFTCard'
