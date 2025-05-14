import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { WalletStatus } from 'wallet/src/features/smartWallet/types'

export function useTranslateSmartWalletStatus(): (status: WalletStatus) => string {
  const { t } = useTranslation()

  return useCallback(
    (status: WalletStatus): string => {
      switch (status) {
        case WalletStatus.Active:
          return t('settings.setting.smartWallet.status.active')
        case WalletStatus.Inactive:
          return t('settings.setting.smartWallet.status.inactive')
        case WalletStatus.Unavailable:
          return t('settings.setting.smartWallet.status.unavailable')
        default:
          return status
      }
    },
    [t],
  )
}
