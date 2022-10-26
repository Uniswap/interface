import { default as React, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ViewProps } from 'react-native'
import ContextMenu from 'react-native-context-menu-view'
import { useAppDispatch } from 'src/app/hooks'
import { useEagerExternalProfileNavigation } from 'src/app/navigation/hooks'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import RemoveButton from 'src/components/explore/RemoveButton'
import { BaseCard } from 'src/components/layout/BaseCard'
import { removeWatchedAddress } from 'src/features/favorites/slice'
import { theme } from 'src/styles/theme'

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
}: FavoriteWalletCardProps) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { preload, navigate } = useEagerExternalProfileNavigation()

  const onRemove = useCallback(
    () => dispatch(removeWatchedAddress({ address })),
    [address, dispatch]
  )

  /// Options for long press context menu
  const menuActions = useMemo(() => {
    return [
      { title: t('Remove favorite'), systemIcon: 'minus' },
      { title: t('Edit favorites'), systemIcon: 'square.and.pencil' },
    ]
  }, [t])

  return (
    <ContextMenu
      actions={menuActions}
      disabled={isEditing}
      style={{ borderRadius: theme.borderRadii.lg }}
      onPress={(e) => {
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
        borderRadius="lg"
        onPress={() => navigate(address)}
        onPressIn={() => preload(address)}>
        <BaseCard.Shadow>
          {isEditing ? (
            <RemoveButton position="absolute" right={-8} top={-8} onPress={onRemove} />
          ) : null}
          <AddressDisplay
            address={address}
            direction="column"
            size={40}
            variant="buttonLabelSmall"
          />
        </BaseCard.Shadow>
      </TouchableArea>
    </ContextMenu>
  )
}
