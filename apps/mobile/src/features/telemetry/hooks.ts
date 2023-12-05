import { useCallback, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import {
  selectLastBalancesReport,
  selectLastBalancesReportValue,
  selectWalletIsFunded,
} from 'src/features/telemetry/selectors'
import {
  recordBalancesReport,
  recordWalletFunded,
  shouldReportBalances,
} from 'src/features/telemetry/slice'
import { useAsyncData } from 'utilities/src/react/hooks'
import { useAccountListQuery } from 'wallet/src/data/__generated__/types-and-hooks'
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

  const { data } = useAccountListQuery({
    variables: { addresses: signerAccountAddresses },
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
