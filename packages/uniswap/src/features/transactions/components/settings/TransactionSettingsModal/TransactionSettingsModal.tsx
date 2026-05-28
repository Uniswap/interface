import { isWebApp } from '@universe/environment'
import { TransactionSettingsModalInterface } from 'uniswap/src/features/transactions/components/settings/TransactionSettingsModal/TransactionSettingsModalInterface'
import { TransactionSettingsModalWallet } from 'uniswap/src/features/transactions/components/settings/TransactionSettingsModal/TransactionSettingsModalWallet'
import { TransactionSettingsModalProps } from 'uniswap/src/features/transactions/components/settings/TransactionSettingsModal/types'

export function TransactionSettingsModal(props: TransactionSettingsModalProps): JSX.Element {
  if (isWebApp) {
    return <TransactionSettingsModalInterface {...props} />
  }
  return <TransactionSettingsModalWallet {...props} />
}
