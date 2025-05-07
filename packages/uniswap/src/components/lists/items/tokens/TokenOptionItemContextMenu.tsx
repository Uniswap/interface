import { Currency } from '@uniswap/sdk-core'
import React, { ReactNode, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { CopyAlt } from 'ui/src/components/icons/CopyAlt'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { ContextMenu, MenuOptionItem } from 'uniswap/src/components/menus/ContextMenuV2'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/types'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { currencyAddress, currencyId } from 'uniswap/src/utils/currencyId'
import { isWeb } from 'utilities/src/platform'

const COPY_ADDRESS_CLOSE_DELAY = 400

interface TokenOptionItemContextMenuProps {
  children: ReactNode
  currency: Currency
  isOpen: boolean
  openMenu?: () => void
  closeMenu: () => void
}

function _TokenOptionItemContextMenu({
  children,
  currency,
  isOpen,
  openMenu,
  closeMenu,
}: TokenOptionItemContextMenuProps): JSX.Element {
  const { t } = useTranslation()
  const { navigateToTokenDetails } = useUniswapContext()
  const dispatch = useDispatch()
  const { isTestnetModeEnabled } = useEnabledChains()

  const [copied, setCopied] = useState(false)

  const onNavigateToTokenDetails = useCallback(() => {
    if (isTestnetModeEnabled) {
      return
    }
    closeMenu()
    navigateToTokenDetails(currencyId(currency))
  }, [isTestnetModeEnabled, navigateToTokenDetails, currency, closeMenu])

  const onCopyAddress = useCallback(async (): Promise<void> => {
    await setClipboard(currencyAddress(currency))
    if (!isWeb) {
      dispatch(
        pushNotification({
          type: AppNotificationType.Copied,
          copyType: CopyNotificationType.Address,
        }),
      )
    }
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, COPY_ADDRESS_CLOSE_DELAY)
  }, [dispatch, currency])

  const dropdownOptions: MenuOptionItem[] = useMemo(
    () => [
      {
        onPress: onCopyAddress,
        disabled: currency.isNative,
        label: copied ? t('notification.copied.address') : t('common.copy.address'),
        Icon: copied ? CheckCircleFilled : CopyAlt,
        closeDelay: COPY_ADDRESS_CLOSE_DELAY,
        iconColor: copied ? '$statusSuccess' : '$neutral2',
      },
      {
        onPress: onNavigateToTokenDetails,
        label: t('token.details'),
        Icon: InfoCircleFilled,
        iconColor: '$neutral2',
      },
    ],
    [onCopyAddress, currency.isNative, copied, t, onNavigateToTokenDetails],
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

export const TokenOptionItemContextMenu = React.memo(_TokenOptionItemContextMenu)
