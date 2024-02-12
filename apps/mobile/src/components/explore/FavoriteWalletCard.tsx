import { ImpactFeedbackStyle } from 'expo-haptics'
import { default as React, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ViewProps } from 'react-native'
import ContextMenu from 'react-native-context-menu-view'
import { useAppDispatch } from 'src/app/hooks'
import { useEagerExternalProfileNavigation } from 'src/app/navigation/hooks'
import RemoveButton from 'src/components/explore/RemoveButton'
import { disableOnPress } from 'src/utils/disableOnPress'
import { Flex, TouchableArea } from 'ui/src'
import { borderRadii, iconSizes } from 'ui/src/theme'
import { AccountIcon } from 'wallet/src/components/accounts/AccountIcon'
import { DisplayNameText } from 'wallet/src/components/accounts/DisplayNameText'
import { BaseCard } from 'wallet/src/components/BaseCard/BaseCard'
import { removeWatchedAddress } from 'wallet/src/features/favorites/slice'
import { useAvatar, useDisplayName } from 'wallet/src/features/wallet/hooks'
import { DisplayNameType } from 'wallet/src/features/wallet/types'

type FavoriteWalletCardProps = {
  address: Address
  isEditing?: boolean
  setIsEditing: (update: boolean) => void
} & ViewProps

export default function FavoriteWalletCard({
  address,
  isEditing,
  setIsEditing,
  ...rest
}: FavoriteWalletCardProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { preload, navigate } = useEagerExternalProfileNavigation()

  const displayName = useDisplayName(address)
  const { avatar } = useAvatar(address)

  const icon = useMemo(() => {
    return <AccountIcon address={address} avatarUri={avatar} size={iconSizes.icon20} />
  }, [address, avatar])

  const onRemove = useCallback(() => {
    dispatch(removeWatchedAddress({ address }))
  }, [address, dispatch])

  /// Options for long press context menu
  const menuActions = useMemo(() => {
    return [
      { title: t('Remove favorite'), systemIcon: 'heart.fill' },
      { title: t('Edit favorites'), systemIcon: 'square.and.pencil' },
    ]
  }, [t])

  return (
    <ContextMenu
      actions={menuActions}
      disabled={isEditing}
      style={{ borderRadius: borderRadii.rounded16 }}
      onPress={(e): void => {
        // Emitted index based on order of menu action array
        // remove favorite action
        if (e.nativeEvent.index === 0) {
          onRemove()
        }
        // Edit mode toggle action
        if (e.nativeEvent.index === 1) {
          setIsEditing(true)
        }
      }}
      {...rest}>
      <TouchableArea
        hapticFeedback
        borderRadius="$rounded16"
        hapticStyle={ImpactFeedbackStyle.Light}
        m="$spacing4"
        onLongPress={disableOnPress}
        onPress={(): void => {
          navigate(address)
        }}
        onPressIn={async (): Promise<void> => {
          await preload(address)
        }}>
        <BaseCard.Shadow>
          <Flex row gap="$spacing4" justifyContent="space-between">
            <Flex row shrink alignItems="center" gap="$spacing8">
              {icon}
              <DisplayNameText
                displayName={displayName}
                textProps={{
                  adjustsFontSizeToFit: displayName?.type === DisplayNameType.Address,
                  variant: 'body1',
                }}
              />
            </Flex>
            <RemoveButton visible={isEditing} onPress={onRemove} />
          </Flex>
        </BaseCard.Shadow>
      </TouchableArea>
    </ContextMenu>
  )
}
