import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ViewProps } from 'react-native'
import ContextMenu from 'react-native-context-menu-view'
import { useDispatch } from 'react-redux'
import { useEagerExternalProfileNavigation } from 'src/app/navigation/hooks'
import RemoveButton from 'src/components/explore/RemoveButton'
import { disableOnPress } from 'src/utils/disableOnPress'
import { Flex, TouchableArea, useIsDarkMode, useShadowPropsShort, useSporeColors } from 'ui/src'
import { borderRadii, iconSizes } from 'ui/src/theme'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { DisplayNameType } from 'uniswap/src/features/accounts/types'
import { useAvatar } from 'uniswap/src/features/address/avatar'
import { removeWatchedAddress } from 'uniswap/src/features/favorites/slice'
import { isIOS } from 'utilities/src/platform'
import { DisplayNameText } from 'wallet/src/components/accounts/DisplayNameText'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'

export type FavoriteWalletCardProps = {
  address: Address
  isEditing?: boolean
  setIsEditing: (update: boolean) => void
} & ViewProps

function FavoriteWalletCard({ address, isEditing, setIsEditing, ...rest }: FavoriteWalletCardProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()

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
      { title: t('explore.wallets.favorite.action.remove'), systemIcon: 'heart.fill' },
      { title: t('explore.wallets.favorite.action.edit'), systemIcon: 'square.and.pencil' },
    ]
  }, [t])

  const shadowProps = useShadowPropsShort()

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
      {...rest}
    >
      <TouchableArea
        overflow={isIOS ? 'hidden' : 'visible'}
        activeOpacity={isEditing ? 1 : undefined}
        backgroundColor={isDarkMode ? '$surface2' : '$surface1'}
        borderColor={colors.surface3.val}
        borderRadius="$rounded16"
        borderWidth={isDarkMode ? '$none' : '$spacing1'}
        disabled={isEditing}
        m="$spacing4"
        testID="favorite-wallet-card"
        onLongPress={disableOnPress}
        onPress={(): void => {
          navigate(address)
        }}
        onPressIn={async (): Promise<void> => {
          await preload(address)
        }}
        {...shadowProps}
      >
        <Flex row gap="$spacing4" justifyContent="space-between" p="$spacing12">
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
      </TouchableArea>
    </ContextMenu>
  )
}

export default memo(FavoriteWalletCard)
