import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeSyntheticEvent, Share } from 'react-native'
import ContextMenu, { ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view'
import { TripleDot } from 'src/components/icons/TripleDot'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName, ShareableEntity } from 'src/features/telemetry/constants'
import { disableOnPress } from 'src/utils/disableOnPress'
import { ColorTokens, Flex, TouchableArea } from 'ui/src'
import { iconSizes, spacing } from 'ui/src/theme'
import { logger } from 'utilities/src/logger/logger'
import { getNftCollectionUrl, getTwitterLink, openUri } from 'wallet/src/utils/linking'
import { NFTCollectionData } from './types'

type MenuOption = {
  title: string
  action: () => Promise<void>
}

const ICON_SIZE = iconSizes.icon16
const ICON_PADDING = spacing.spacing8

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
    if (!twitterURL) {
      return
    }
    await openUri(twitterURL)
  }

  const openExplorerLink = async (): Promise<void> => {
    if (!homepageUrl) {
      return
    }
    await openUri(homepageUrl)
  }

  const onSharePress = useCallback(async () => {
    if (!shareURL) {
      return
    }
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
          title: t('tokens.nfts.link.collection'),
          action: openExplorerLink,
        }
      : undefined,
    shareURL
      ? {
          title: t('common.button.share'),
          action: onSharePress,
        }
      : undefined,
  ].filter((option): option is MenuOption => !!option)

  // Only display menu if valid options from data response, otherwise return empty
  // element for spacing purposes
  if (!homepageUrl && !twitterURL) {
    return <Flex style={{ padding: ICON_PADDING }} width={ICON_SIZE} />
  }

  return (
    <ContextMenu
      actions={menuActions}
      dropdownMenuMode={true}
      onPress={async (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>): Promise<void> => {
        await menuActions[e.nativeEvent.index]?.action()
      }}>
      <TouchableArea
        hapticFeedback
        backgroundColor={showButtonOutline ? '$scrim' : '$transparent'}
        borderRadius="$roundedFull"
        style={{ padding: ICON_PADDING }}
        onLongPress={disableOnPress}
        onPress={disableOnPress}>
        <Flex centered grow height={ICON_SIZE} width={ICON_SIZE}>
          <TripleDot color={iconColor} size={3.5} />
        </Flex>
      </TouchableArea>
    </ContextMenu>
  )
}
