import { SharedEventName } from '@uniswap/analytics-events'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { ArrowUpRight } from 'ui/src/components/icons/ArrowUpRight'
import { MoreHorizontal } from 'ui/src/components/icons/MoreHorizontal'
import { zIndexes } from 'ui/src/theme'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { ContextMenu } from 'uniswap/src/components/menus/ContextMenu'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { NftView, NftViewProps } from 'uniswap/src/components/nfts/NftView'
import { useActiveAddresses } from 'uniswap/src/features/accounts/store/hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useNFTContextMenuItems } from 'uniswap/src/features/nfts/hooks/useNftContextMenuItems'
import { getNFTAssetKey } from 'uniswap/src/features/nfts/utils'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { getNftExplorerLink, getOpenseaLink, openUri } from 'uniswap/src/utils/linking'
import { isMobileWeb } from 'utilities/src/platform'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { GroupHoverTransition } from '~/components/GroupHoverTransition'
import { POPUP_MEDIUM_DISMISS_MS } from '~/components/Popups/constants'
import { popupRegistry } from '~/components/Popups/registry'
import { PopupType } from '~/components/Popups/types'
import { usePortfolioAddresses } from '~/pages/Portfolio/hooks/usePortfolioAddresses'
import { generateRotationStyle } from '~/pages/Portfolio/NFTs/generateRotationStyle'
import { filterDefinedWalletAddresses } from '~/utils/filterDefinedWalletAddresses'

const FLOAT_UP_ON_HOVER_OFFSET = -4
const SUBTITLE_HEIGHT = 24

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
  const { isExternalWallet } = usePortfolioAddresses()
  const activeAddresses = useActiveAddresses()
  const { defaultChainId } = useEnabledChains()

  const nftUniqueId = useMemo(
    () => getNFTAssetKey(props.item.contractAddress ?? '', props.item.tokenId ?? ''),
    [props.item.contractAddress, props.item.tokenId],
  )

  const [openPopoverId, setOpenPopoverId] = useState<string | null>(() => getOpenNftPopoverId())
  const isPopoverOpen = openPopoverId === nftUniqueId

  useEffect(() => {
    setOpenPopoverId(getOpenNftPopoverId())
  }, [])

  const handlePopoverOpenChange = useCallback(
    (open: boolean) => {
      const newId = open ? nftUniqueId : null
      setOpenNftPopoverId(newId)
      setOpenPopoverId(newId)
    },
    [nftUniqueId],
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
      boxShadow: `0px 4px 12px -3px ${colors.surface3.val}, 0px 2px 5px -2px ${colors.surface3.val}`,
    }),
    [props.id, colors.surface3.val],
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

  const onCopySuccess = useCallback(() => {
    popupRegistry.addPopup(
      { type: PopupType.Success, message: t('notification.copied.address') },
      `copy-nft-address-${props.item.contractAddress}`,
      POPUP_MEDIUM_DISMISS_MS,
    )
  }, [t, props.item.contractAddress])

  // Generate context menu items
  // When viewing an external wallet, pass empty walletAddresses to hide "hide" and "report spam" options
  const menuItems = useNFTContextMenuItems({
    contractAddress: props.item.contractAddress,
    tokenId: props.item.tokenId,
    owner: props.owner,
    walletAddresses: isExternalWallet
      ? []
      : filterDefinedWalletAddresses([activeAddresses.evmAddress, activeAddresses.svmAddress]),
    isSpam: props.item.isSpam,
    showNotification: false,
    chainId,
    onCopySuccess,
  })

  // Prevents press events from bubbling to parent touchable areas
  const stopPressEventPropagation = useMemo(
    () => ({
      onPressIn: (e: { stopPropagation: () => void }) => e.stopPropagation(),
      onPressOut: (e: { stopPropagation: () => void }) => e.stopPropagation(),
      onPress: (e: { stopPropagation: () => void }) => e.stopPropagation(),
    }),
    [],
  )

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

  const cardTestId = `${TestID.PortfolioNftCardPrefix}${nftUniqueId}`

  return (
    <Flex group="item" testID={cardTestId} data-testid={cardTestId}>
      <TouchableArea
        p="$spacing4"
        borderRadius="$rounded16"
        borderWidth="$spacing1"
        borderColor="$surface3"
        gap="$spacing4"
        transition="all 80ms ease-in-out"
        {...(isActive && !isMobileWeb ? activeCardStyles : {})}
        onMouseEnter={setIsHovered}
        onMouseLeave={setIsHoveredFalse}
        onPress={handlePress}
      >
        {/* Context menu trigger icon */}
        <Flex position="absolute" top="$spacing8" right="$spacing8" {...stopPressEventPropagation}>
          <ContextMenu
            menuItems={menuItems}
            triggerMode={ContextMenuTriggerMode.Primary}
            isOpen={isPopoverOpen}
            closeMenu={closePopover}
            elementName={ElementName.PortfolioNftContextMenu}
            sectionName={SectionName.PortfolioNftsTab}
            trackItemClicks
          >
            <TouchableArea
              centered
              backgroundColor="$surface1"
              borderRadius="$rounded12"
              height="$spacing32"
              width="$spacing32"
              hoverStyle={{ backgroundColor: '$surface1Hovered' }}
              zIndex={zIndexes.popover}
              transition="opacity 80ms ease-in-out"
              opacity={isActive || isMobileWeb ? 1 : 0}
              testID={TestID.PortfolioNftCardContextMenuTrigger}
              onPressIn={(e) => e.stopPropagation()}
              onPressOut={(e) => e.stopPropagation()}
              onPress={(e) => {
                e.stopPropagation()
                isPopoverOpen ? closePopover() : handlePopoverOpenChange(true)
              }}
            >
              <MoreHorizontal size="$icon.16" fill="$neutral1" />
            </TouchableArea>
          </ContextMenu>
        </Flex>
        <Flex borderRadius="$rounded12" overflow="hidden">
          {/* Let the parent card handle the onPress */}
          <NftView {...props} hoverAnimation={false} onPress={() => {}} />
        </Flex>
        <Flex py="$spacing8" px="$spacing12">
          <Text variant="body3" numberOfLines={1} testID={TestID.PortfolioNftCardName}>
            {props.item.name}
          </Text>
          <GroupHoverTransition
            height={SUBTITLE_HEIGHT}
            transition="all 80ms ease-in-out"
            useGroupItemHover
            defaultContent={
              <Flex row alignItems="center" gap="$spacing4" justifyContent="space-between" height={SUBTITLE_HEIGHT}>
                <Text
                  variant="body4"
                  color="$neutral2"
                  numberOfLines={1}
                  testID={TestID.PortfolioNftCardCollectionName}
                >
                  {props.item.collectionName}
                </Text>
                {props.item.chain && chainId && <NetworkLogo chainId={chainId} size={iconSizes.icon12} />}
              </Flex>
            }
            hoverContent={
              <Flex
                row
                alignItems="center"
                gap="$spacing2"
                height={SUBTITLE_HEIGHT}
                testID={TestID.PortfolioNftCardViewOnLink}
              >
                <Text variant="body4" color="$neutral2">
                  {openseaUrl ? t('common.opensea.link') : t('common.viewOnExplorer')}
                </Text>
                <ArrowUpRight size="$icon.12" color="$neutral2" />
              </Flex>
            }
          />
        </Flex>
      </TouchableArea>
    </Flex>
  )
}

export const NFTCard = memo(_NFTCard)

NFTCard.displayName = 'NFTCard'
