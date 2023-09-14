import { impactAsync } from 'expo-haptics'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeSyntheticEvent, Share } from 'react-native'
import ContextMenu, { ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view'
import { useAppDispatch } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { TripleDot } from 'src/components/icons/TripleDot'
import { Flex } from 'src/components/layout/Flex'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { setClipboard } from 'src/utils/clipboard'
import { ExplorerDataType, getExplorerLink, getProfileUrl, openUri } from 'src/utils/linking'
import { logger } from 'utilities/src/logger/logger'
import { ChainId } from 'wallet/src/constants/chains'

import { MobileEventName, ShareableEntity } from 'src/features/telemetry/constants'
import { iconSizes } from 'ui/src/theme'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'wallet/src/features/notifications/types'

export function ProfileContextMenu({ address }: { address: Address }): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const onPressCopyAddress = useCallback(async () => {
    if (!address) return
    await impactAsync()
    await setClipboard(address)
    dispatch(
      pushNotification({ type: AppNotificationType.Copied, copyType: CopyNotificationType.Address })
    )
  }, [address, dispatch])

  const openExplorerLink = useCallback(async () => {
    await openUri(getExplorerLink(ChainId.Mainnet, address, ExplorerDataType.ADDRESS))
  }, [address])

  const onPressShare = useCallback(async () => {
    if (!address) return
    try {
      const url = getProfileUrl(address)
      await Share.share({
        message: url,
      })
      sendMobileAnalyticsEvent(MobileEventName.ShareButtonClicked, {
        entity: ShareableEntity.Wallet,
        url,
      })
    } catch (error) {
      logger.error(error, { tags: { file: 'ProfileContextMenu', function: 'onPressShare' } })
    }
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
      {
        title: t('Share'),
        action: onPressShare,
        systemIcon: 'square.and.arrow.up',
      },
    ],
    [onPressCopyAddress, onPressShare, openExplorerLink, t]
  )

  return (
    <ContextMenu
      actions={menuActions}
      dropdownMenuMode={true}
      onPress={async (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>): Promise<void> => {
        await menuActions[e.nativeEvent.index]?.action()
      }}>
      <TouchableArea
        backgroundColor="surface3"
        borderRadius="roundedFull"
        opacity={0.8}
        padding="spacing8">
        <Flex centered grow height={iconSizes.icon16} width={iconSizes.icon16}>
          <TripleDot color="$sporeWhite" size={3.5} />
        </Flex>
      </TouchableArea>
    </ContextMenu>
  )
}
