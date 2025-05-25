import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'

export type TransactionSettingsModalProps = {
  settings: TransactionSettingConfig[]
  defaultTitle?: string
  initialSelectedSetting?: TransactionSettingConfig
  onClose?: () => void
  isOpen: boolean
}
