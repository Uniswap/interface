import { ImpactFeedbackStyle } from 'expo-haptics'
import { default as React, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ViewProps } from 'react-native'
import ContextMenu from 'react-native-context-menu-view'
import { useAppDispatch } from 'src/app/hooks'
import { useEagerExternalProfileNavigation } from 'src/app/navigation/hooks'
import { AccountIcon } from 'src/components/AccountIcon'
import RemoveButton from 'src/components/explore/RemoveButton'
import { disableOnPress } from 'src/utils/disableOnPress'
import { Flex, flexStyles, Text, TouchableArea } from 'ui/src'
import { borderRadii, iconSizes, imageSizes } from 'ui/src/theme'
import { BaseCard } from 'wallet/src/components/BaseCard/BaseCard'
import { useENSAvatar } from 'wallet/src/features/ens/api'
import { removeWatchedAddress } from 'wallet/src/features/favorites/slice'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'

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
  const { data: avatar } = useENSAvatar(address)

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
              <Text
                adjustsFontSizeToFit={displayName?.type === 'address'}
                color="$neutral1"
                numberOfLines={1}
                style={flexStyles.shrink}
                variant="body1">
                {displayName?.name}
              </Text>
            </Flex>
            {isEditing ? <RemoveButton onPress={onRemove} /> : <Flex height={imageSizes.image24} />}
          </Flex>
        </BaseCard.Shadow>
      </TouchableArea>
    </ContextMenu>
  )
}
