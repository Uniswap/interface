import { ImpactFeedbackStyle } from 'expo-haptics'
import { default as React, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ViewProps } from 'react-native'
import ContextMenu from 'react-native-context-menu-view'
import { useAppDispatch } from 'src/app/hooks'
import { useEagerExternalProfileNavigation } from 'src/app/navigation/hooks'
import { AccountIcon } from 'src/components/AccountIcon'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import RemoveButton from 'src/components/explore/RemoveButton'
import { Box, Flex } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Text } from 'src/components/Text'
import { removeWatchedAddress } from 'src/features/favorites/slice'
import { flex, theme } from 'ui/src/theme/restyle'
import { useENSAvatar } from 'wallet/src/features/ens/api'
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
    return <AccountIcon address={address} avatarUri={avatar} size={theme.iconSizes.icon20} />
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
      style={{ borderRadius: theme.borderRadii.rounded16 }}
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
        borderRadius="rounded16"
        hapticStyle={ImpactFeedbackStyle.Light}
        m="spacing4"
        onPress={(): void => {
          navigate(address)
        }}
        onPressIn={async (): Promise<void> => {
          await preload(address)
        }}>
        <BaseCard.Shadow>
          <Flex row gap="spacing4" justifyContent="space-between">
            <Flex row shrink alignItems="center" gap="spacing8">
              {icon}
              <Text
                adjustsFontSizeToFit={displayName?.type === 'address'}
                color="neutral1"
                numberOfLines={1}
                style={flex.shrink}
                variant="bodyLarge">
                {displayName?.name}
              </Text>
            </Flex>
            {isEditing ? (
              <RemoveButton onPress={onRemove} />
            ) : (
              <Box height={theme.imageSizes.image24} />
            )}
          </Flex>
        </BaseCard.Shadow>
      </TouchableArea>
    </ContextMenu>
  )
}
