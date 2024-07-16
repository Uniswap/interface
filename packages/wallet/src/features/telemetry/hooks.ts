import { useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { MobileAppsFlyerEvents, MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent, sendAppsFlyerEvent } from 'uniswap/src/features/telemetry/send'
import { logger } from 'utilities/src/logger/logger'
import { areSameDays } from 'utilities/src/time/date'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useInterval } from 'utilities/src/time/timing'
import { useAccountList } from 'wallet/src/features/accounts/hooks'
import {
  selectAllowAnalytics,
  selectLastBalancesReport,
  selectLastBalancesReportValue,
  selectLastHeartbeat,
  selectWalletIsFunded,
} from 'wallet/src/features/telemetry/selectors'
import {
  recordBalancesReport,
  recordHeartbeat,
  recordWalletFunded,
  shouldReportBalances,
} from 'wallet/src/features/telemetry/slice'
import { Account, AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useAccounts } from 'wallet/src/features/wallet/hooks'
import { useAppSelector } from 'wallet/src/state'

export function useLastBalancesReporter(): void {
  const dispatch = useDispatch()

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

  useEffect(() => {
    const sumOfFunds = signerAccountValues.reduce((a, b) => a + b, 0)
    if (!walletIsFunded && sumOfFunds) {
      // Only trigger the first time a funded wallet is detected
      dispatch(recordWalletFunded())
      sendAppsFlyerEvent(MobileAppsFlyerEvents.WalletFunded, { sumOfFunds }).catch((error) =>
        logger.debug('hooks', 'useLastBalancesReporter', error),
      )
    }
  }, [dispatch, signerAccountValues, walletIsFunded])

  const reporter = (): void => {
    if (
      shouldReportBalances(lastBalancesReport, lastBalancesReportValue, signerAccountAddresses, signerAccountValues)
    ) {
      const totalBalance = signerAccountValues.reduce((a, b) => a + b, 0)

      sendAnalyticsEvent(MobileEventName.BalancesReport, {
        total_balances_usd: totalBalance,
        wallets: signerAccountAddresses,
        balances: signerAccountValues,
      })
      // record that a report has been sent
      dispatch(recordBalancesReport({ totalBalance }))
    }
  }

  useInterval(reporter, ONE_SECOND_MS * 15, true)
}

// Returns a function that checks if the app needs to send a heartbeat action to record anonymous DAU
// Only logs when the user has allowing product analytics off and a heartbeat has not been sent for the user's local day
export function useHeartbeatReporter(): void {
  const dispatch = useDispatch()
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

  useInterval(reporter, ONE_SECOND_MS * 15, true)
}
