import { useNavigation } from '@react-navigation/native'
import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { ONE_DAY_MS } from 'utilities/src/time/time'
import { selectBackupReminderLastSeenTs } from 'wallet/src/features/behaviorHistory/selectors'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { hasExternalBackup } from 'wallet/src/features/wallet/accounts/utils'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

const MIN_PORTFOLIO_VALUE_FOR_BACKUP_REMINDER = 100 // $100 USD
const BACKUP_REMINDER_COOLDOWN_MS = ONE_DAY_MS

export function useOpenBackupReminderModal(activeAccount: Account): void {
  const navigation = useNavigation()
  const activeAddress = useActiveAccountAddress()
  const { data: portfolioData } = usePortfolioTotalValue({
    evmAddress: activeAddress ?? undefined,
  })

  const isBackupReminderModalOpen = navigation
    .getState()
    ?.routes.some((route) => route.name === ModalName.BackupReminder)
  const isBackupReminderWarningModalOpen = navigation
    .getState()
    ?.routes.some((route) => route.name === ModalName.BackupReminderWarning)

  const backupReminderLastSeenTs = useSelector(selectBackupReminderLastSeenTs)
  const externalBackups = hasExternalBackup(activeAccount)

  const isSignerAccount = activeAccount.type === AccountType.SignerMnemonic

  // Check portfolio value threshold
  const portfolioValue = portfolioData?.balanceUSD ?? 0
  const hasMinimumPortfolioValue = portfolioValue >= MIN_PORTFOLIO_VALUE_FOR_BACKUP_REMINDER

  // Check if 24 hours have passed since last seen
  const now = Date.now()
  const timeSinceLastSeen = backupReminderLastSeenTs ? now - backupReminderLastSeenTs : Infinity
  const has24HoursPassed = timeSinceLastSeen >= BACKUP_REMINDER_COOLDOWN_MS

  const shouldOpenBackupReminderModal =
    !isBackupReminderModalOpen &&
    !isBackupReminderWarningModalOpen &&
    isSignerAccount &&
    !externalBackups &&
    hasMinimumPortfolioValue &&
    has24HoursPassed

  useEffect(() => {
    if (shouldOpenBackupReminderModal) {
      const timeoutId = setTimeout(() => {
        navigation.navigate(ModalName.BackupReminder as never)
      }, 1000)

      return () => clearTimeout(timeoutId)
    }

    return undefined
  }, [shouldOpenBackupReminderModal, navigation])
}
