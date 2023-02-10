import React from 'react'
import { useTranslation } from 'react-i18next'
import { NativeSyntheticEvent } from 'react-native'
import ContextMenu, { ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view'
import { useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { TripleDot } from 'src/components/icons/TripleDot'
import { Flex } from 'src/components/layout/Flex'
import { NFTCollectionData } from 'src/features/nfts/collection/NFTCollectionHeader'
import { Theme } from 'src/styles/theme'
import { getTwitterLink, openUri } from 'src/utils/linking'

type MenuOption = {
  title: string
  action: () => void
  systemIcon: string
}

export function NFTCollectionContextMenu({
  data,
  showButtonOutline = false,
  iconColor = 'textSecondary',
}: {
  data: NFTCollectionData
  showButtonOutline?: boolean
  iconColor?: keyof Theme['colors']
}): Nullable<JSX.Element> {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const twitterURL = data?.twitterName ? getTwitterLink(data.twitterName) : undefined
  const homepageUrl = data?.homepageUrl

  const onSocialPress = (): void => {
    if (!twitterURL) return
    openUri(twitterURL)
  }

  const openExplorerLink = (): void => {
    if (!homepageUrl) return
    openUri(homepageUrl)
  }

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
          title: t('Collection Website'),
          action: openExplorerLink,
        }
      : undefined,
  ].filter((option): option is MenuOption => !!option)

  // Only display menu if valid options from data response
  if (!homepageUrl && !twitterURL) return null

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
        padding="spacing8">
        <Flex centered grow height={theme.iconSizes.icon16} width={theme.iconSizes.icon16}>
          <TripleDot color={iconColor} size={3.5} />
        </Flex>
      </TouchableArea>
    </ContextMenu>
  )
}
