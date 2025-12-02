import React from 'react'
import { useTranslation } from 'react-i18next'
import { NativeSyntheticEvent } from 'react-native'
import ContextMenu, { ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view'
import { NFTCollectionData } from 'src/features/nfts/collection/types'
import { ColorTokens, Flex, TouchableArea } from 'ui/src'
import { Ellipsis } from 'ui/src/components/icons/Ellipsis'
import { iconSizes, spacing } from 'ui/src/theme'
import { getTwitterLink, openUri } from 'uniswap/src/utils/linking'
import { noop } from 'utilities/src/react/noop'

type MenuOption = {
  title: string
  action: () => Promise<void>
}

const ICON_SIZE = iconSizes.icon16
const ICON_PADDING = spacing.spacing8

export function NFTCollectionContextMenu({
  data,
  showButtonOutline = false,
  iconColor = '$neutral2',
}: {
  data: Maybe<NFTCollectionData>
  showButtonOutline?: boolean
  iconColor?: ColorTokens
}): Nullable<JSX.Element> {
  const { t } = useTranslation()

  const twitterURL = data?.twitterName ? getTwitterLink(data.twitterName) : undefined
  const homepageUrl = data?.homepageUrl

  const onSocialPress = async (): Promise<void> => {
    if (!twitterURL) {
      return
    }
    await openUri({ uri: twitterURL })
  }

  const openExplorerLink = async (): Promise<void> => {
    if (!homepageUrl) {
      return
    }
    await openUri({ uri: homepageUrl })
  }

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
      }}
    >
      <TouchableArea
        backgroundColor={showButtonOutline ? '$scrim' : '$transparent'}
        borderRadius="$roundedFull"
        style={{ padding: ICON_PADDING }}
        onLongPress={noop}
        onPress={noop}
      >
        <Flex centered grow>
          <Ellipsis color={iconColor} size={ICON_SIZE} />
        </Flex>
      </TouchableArea>
    </ContextMenu>
  )
}
