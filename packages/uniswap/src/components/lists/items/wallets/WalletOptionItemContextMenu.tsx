import React, { ReactNode, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Heart } from 'ui/src/components/icons/Heart'
import { HeartSlash } from 'ui/src/components/icons/HeartSlash'
import { ContextMenu, MenuOptionItem } from 'uniswap/src/components/menus/ContextMenuV2'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { selectWatchedAddressSet } from 'uniswap/src/features/favorites/selectors'
import { useToggleWatchedWalletCallback } from 'uniswap/src/features/favorites/useToggleWatchedWalletCallback'

interface WalletOptionItemContextMenuProps {
  children: ReactNode
  address: Address
  isOpen: boolean
  openMenu?: () => void
  closeMenu: () => void
}

function _WalletOptionItemContextMenu({
  children,
  address,
  isOpen,
  openMenu,
  closeMenu,
}: WalletOptionItemContextMenuProps): JSX.Element {
  const { t } = useTranslation()

  const isFavorited = useSelector(selectWatchedAddressSet).has(address)
  const toggleFavoriteWallet = useToggleWatchedWalletCallback(address)

  const dropdownOptions: MenuOptionItem[] = useMemo(
    () => [
      {
        onPress: toggleFavoriteWallet,
        label: isFavorited ? t('explore.wallets.favorite.action.remove') : t('explore.wallets.favorite.action.add'),
        Icon: isFavorited ? HeartSlash : Heart,
        iconColor: '$neutral2',
      },
    ],
    [isFavorited, t, toggleFavoriteWallet],
  )

  return (
    <ContextMenu
      menuItems={dropdownOptions}
      triggerMode={ContextMenuTriggerMode.Secondary}
      isOpen={isOpen}
      closeMenu={closeMenu}
      openMenu={openMenu}
    >
      {children}
    </ContextMenu>
  )
}

export const WalletOptionItemContextMenu = React.memo(_WalletOptionItemContextMenu)
