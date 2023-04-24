import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeSyntheticEvent, Share } from 'react-native'
import ContextMenu, { ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { TripleDot } from 'src/components/icons/TripleDot'
import { Box } from 'src/components/layout'
import { Flex } from 'src/components/layout/Flex'
import { NFTCollectionData } from 'src/features/nfts/collection/NFTCollectionHeader'
import { theme as FixedTheme, Theme } from 'src/styles/theme'
import { getTwitterLink, getUniswapCollectionUrl, openUri } from 'src/utils/linking'
import { logger } from 'src/utils/logger'

type MenuOption = {
  title: string
  action: () => void
  systemIcon: string
}

const ICON_SIZE = FixedTheme.iconSizes.icon16
const ICON_PADDING = FixedTheme.spacing.spacing8

export function NFTCollectionContextMenu({
  data,
  collectionAddress,
  showButtonOutline = false,
  iconColor = 'textSecondary',
}: {
  data: NFTCollectionData
  collectionAddress?: NullUndefined<string>
  showButtonOutline?: boolean
  iconColor?: keyof Theme['colors']
}): Nullable<JSX.Element> {
  const { t } = useTranslation()

  const twitterURL = data?.twitterName ? getTwitterLink(data.twitterName) : undefined
  const homepageUrl = data?.homepageUrl
  const shareURL = getUniswapCollectionUrl(collectionAddress)

  const onSocialPress = (): void => {
    if (!twitterURL) return
    openUri(twitterURL)
  }

  const openExplorerLink = (): void => {
    if (!homepageUrl) return
    openUri(homepageUrl)
  }

  const onSharePress = useCallback(async () => {
    if (!shareURL) return
    try {
      await Share.share({
        message: shareURL,
      })
    } catch (e) {
      logger.error('NFTCollectionScreen', 'onShare', (e as unknown as Error).message)
    }
  }, [shareURL])

  const menuActions: {
    title: string
    action: () => void
    systemIcon: string
  }[] = [
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
    return <Box style={{ padding: ICON_PADDING }} width={ICON_SIZE} />

  return (
    <ContextMenu
      actions={menuActions}
      dropdownMenuMode={true}
      onPress={(e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>): void => {
        menuActions[e.nativeEvent.index]?.action()
      }}>
      <TouchableArea
        hapticFeedback
        backgroundColor={showButtonOutline ? 'textOnDimTertiary' : 'none'}
        borderRadius="roundedFull"
        style={{ padding: ICON_PADDING }}>
        <Flex centered grow height={ICON_SIZE} width={ICON_SIZE}>
          <TripleDot color={iconColor} size={3.5} />
        </Flex>
      </TouchableArea>
    </ContextMenu>
  )
}
