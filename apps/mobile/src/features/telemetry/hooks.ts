import { useCallback, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import {
  selectAllowAnalytics,
  selectLastBalancesReport,
  selectLastBalancesReportValue,
  selectLastHeartbeat,
  selectWalletIsFunded,
} from 'src/features/telemetry/selectors'
import {
  recordBalancesReport,
  recordHeartbeat,
  recordWalletFunded,
  shouldReportBalances,
} from 'src/features/telemetry/slice'
import { useAsyncData } from 'utilities/src/react/hooks'
import { areSameDays } from 'utilities/src/time/date'
import { useAccountList } from 'wallet/src/features/accounts/hooks'
import { Account, AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useAccounts } from 'wallet/src/features/wallet/hooks'
import { sendWalletAppsFlyerEvent } from 'wallet/src/telemetry'
import { WalletAppsFlyerEvents } from 'wallet/src/telemetry/constants'

export function useLastBalancesReporter(): () => void {
  const dispatch = useAppDispatch()

  const accounts = useAccounts()
  const lastBalancesReport = useAppSelector(selectLastBalancesReport)
  const lastBalancesReportValue = useAppSelector(selectLastBalancesReportValue)
  const walletIsFunded = useAppSelector(selectWalletIsFunded)

  const signerAccountAddresses = useMemo(() => {
    return Object.values(accounts)
      .filter((a: Account) => a.type === AccountType.SignerMnemonic)
      .map((a) => a.address)
  }, [accounts])

  const { data } = useAccountList({
    addresses: signerAccountAddresses,
    fetchPolicy: 'cache-first',
  })

  const signerAccountValues = useMemo(() => {
    const valuesUnfiltered = data?.portfolios
      ?.map((p) => p?.tokensTotalDenominatedValue?.value)
      .filter((v) => v !== undefined)

    if (valuesUnfiltered === undefined) {
      return []
    }

    return valuesUnfiltered as number[]
  }, [data?.portfolios])

  const triggerAppFundedEvent = useCallback(async (): Promise<void> => {
    const sumOfFunds = signerAccountValues.reduce((a, b) => a + b, 0)
    if (!walletIsFunded && sumOfFunds) {
      // Only trigger the first time a funded wallet is detected
      await sendWalletAppsFlyerEvent(WalletAppsFlyerEvents.WalletFunded, { sumOfFunds })
      dispatch(recordWalletFunded())
    }
  }, [dispatch, signerAccountValues, walletIsFunded])

  useAsyncData(triggerAppFundedEvent)

  const reporter = (): void => {
    if (
      shouldReportBalances(
        lastBalancesReport,
        lastBalancesReportValue,
        signerAccountAddresses,
        signerAccountValues
      )
    ) {
      const totalBalance = signerAccountValues.reduce((a, b) => a + b, 0)

      sendMobileAnalyticsEvent(MobileEventName.BalancesReport, {
        total_balances_usd: totalBalance,
        wallets: signerAccountAddresses,
        balances: signerAccountValues,
      })
      // record that a report has been sent
      dispatch(recordBalancesReport({ totalBalance }))
    }
  }

  return reporter
}

// Returns a function that checks if the app needs to send a heartbeat action to record anonymous DAU
// Only logs when the user has allowing product analytics off and a heartbeat has not been sent for the user's local day
export function useHeartbeatReporter(): () => void {
  const dispatch = useAppDispatch()
  const allowAnalytics = useAppSelector(selectAllowAnalytics)
  const lastHeartbeat = useAppSelector(selectLastHeartbeat)

  const nowDate = new Date(Date.now())
  const lastHeartbeatDate = new Date(lastHeartbeat)

  const heartbeatDue = !areSameDays(nowDate, lastHeartbeatDate)

  const reporter = (): void => {
    if (!allowAnalytics && heartbeatDue) {
      dispatch(recordHeartbeat())
    }
  }

  return reporter
}
