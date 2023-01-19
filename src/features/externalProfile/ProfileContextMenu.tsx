import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeSyntheticEvent } from 'react-native'
import ContextMenu, { ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { TripleDot } from 'src/components/icons/TripleDot'
import { Flex } from 'src/components/layout/Flex'
import { ChainId } from 'src/constants/chains'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import { AppNotificationType } from 'src/features/notifications/types'
import { setClipboard } from 'src/utils/clipboard'
import { ExplorerDataType, getExplorerLink, openUri } from 'src/utils/linking'

export function ProfileContextMenu({ address }: { address: Address }): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const dispatch = useAppDispatch()

  const onPressCopyAddress = useCallback(() => {
    if (!address) return
    dispatch(pushNotification({ type: AppNotificationType.Copied }))
    setClipboard(address)
  }, [address, dispatch])

  const openExplorerLink = useCallback(() => {
    openUri(getExplorerLink(ChainId.Mainnet, address, ExplorerDataType.ADDRESS))
  }, [address])

  const menuActions = useMemo(
    () => [
      {
        title: t('View on Etherscan'),
        action: openExplorerLink,
        systemIcon: 'link',
      },
      {
        title: t('Copy address'),
        action: onPressCopyAddress,
        systemIcon: 'square.on.square',
      },
    ],
    [onPressCopyAddress, openExplorerLink, t]
  )

  return (
    <ContextMenu
      actions={menuActions}
      dropdownMenuMode={true}
      onPress={(e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>): void => {
        menuActions[e.nativeEvent.index]?.action()
      }}>
      <TouchableArea
        backgroundColor="textOnDimTertiary"
        borderRadius="full"
        opacity={0.8}
        padding="xs">
        <Flex centered grow height={theme.iconSizes.sm} width={theme.iconSizes.sm}>
          <TripleDot color="white" size={3.5} />
        </Flex>
      </TouchableArea>
    </ContextMenu>
  )
}
