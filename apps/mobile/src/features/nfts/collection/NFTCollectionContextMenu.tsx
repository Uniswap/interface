import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeSyntheticEvent, Share } from 'react-native'
import ContextMenu, { ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { TripleDot } from 'src/components/icons/TripleDot'
import { NFTCollectionData } from 'src/features/nfts/collection/NFTCollectionHeader'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName, ShareableEntity } from 'src/features/telemetry/constants'
import { getNftCollectionUrl, getTwitterLink, openUri } from 'src/utils/linking'
import { ColorTokens, Flex } from 'ui/src'
import { theme as FixedTheme } from 'ui/src/theme/restyle'
import { logger } from 'utilities/src/logger/logger'

type MenuOption = {
  title: string
  action: () => Promise<void>
}

const ICON_SIZE = FixedTheme.iconSizes.icon16
const ICON_PADDING = FixedTheme.spacing.spacing8

export function NFTCollectionContextMenu({
  data,
  collectionAddress,
  showButtonOutline = false,
  iconColor = '$neutral2',
}: {
  data: NFTCollectionData
  collectionAddress?: Maybe<string>
  showButtonOutline?: boolean
  iconColor?: ColorTokens
}): Nullable<JSX.Element> {
  const { t } = useTranslation()

  const twitterURL = data?.twitterName ? getTwitterLink(data.twitterName) : undefined
  const homepageUrl = data?.homepageUrl
  const shareURL = getNftCollectionUrl(collectionAddress)

  const onSocialPress = async (): Promise<void> => {
    if (!twitterURL) return
    await openUri(twitterURL)
  }

  const openExplorerLink = async (): Promise<void> => {
    if (!homepageUrl) return
    await openUri(homepageUrl)
  }

  const onSharePress = useCallback(async () => {
    if (!shareURL) return
    try {
      await Share.share({
        message: shareURL,
      })
      sendMobileAnalyticsEvent(MobileEventName.ShareButtonClicked, {
        entity: ShareableEntity.NftCollection,
        url: shareURL,
      })
    } catch (error) {
      logger.error(error, { tags: { file: 'NFTCollectionContextMenu', function: 'onSharePress' } })
    }
  }, [shareURL])

  const menuActions: MenuOption[] = [
    twitterURL
      ? {
          title: 'Twitter',
          action: onSocialPress,
        }
      : undefined,
    homepageUrl
      ? {
          title: t('Collection website'),
          action: openExplorerLink,
        }
      : undefined,
    shareURL
      ? {
          title: t('Share'),
          action: onSharePress,
        }
      : undefined,
  ].filter((option): option is MenuOption => !!option)

  // Only display menu if valid options from data response, otherwise return empty
  // element for spacing purposes
  if (!homepageUrl && !twitterURL)
    return <Flex gap="$none" style={{ padding: ICON_PADDING }} width={ICON_SIZE} />

  return (
    <ContextMenu
      actions={menuActions}
      dropdownMenuMode={true}
      onPress={async (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>): Promise<void> => {
        await menuActions[e.nativeEvent.index]?.action()
      }}>
      <TouchableArea
        hapticFeedback
        backgroundColor={showButtonOutline ? 'sporeBlack' : 'none'}
        borderRadius="roundedFull"
        style={{ padding: ICON_PADDING }}>
        <Flex centered grow height={ICON_SIZE} width={ICON_SIZE}>
          <TripleDot color={iconColor} size={3.5} />
        </Flex>
      </TouchableArea>
    </ContextMenu>
  )
}
