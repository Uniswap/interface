import { useContext, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { ITraceContext, TraceContext } from 'src/components/telemetry/Trace'
import { useAccountListQuery } from 'src/data/__generated__/types-and-hooks'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import {
  selectLastBalancesReport,
  selectLastBalancesReportValue,
} from 'src/features/telemetry/selectors'
import { recordBalancesReport, shouldReportBalances } from 'src/features/telemetry/slice'
import { Account, AccountType } from 'src/features/wallet/accounts/types'
import { useAccounts } from 'src/features/wallet/hooks'

export function useTrace(trace?: ITraceContext): ITraceContext {
  const parentTrace = useContext(TraceContext)
  return useMemo(() => ({ ...parentTrace, ...trace }), [parentTrace, trace])
}

export function useLastBalancesReporter(): () => void {
  const dispatch = useAppDispatch()

  const accounts = useAccounts()
  const lastBalancesReport = useAppSelector(selectLastBalancesReport)
  const lastBalancesReportValue = useAppSelector(selectLastBalancesReportValue)

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

      sendAnalyticsEvent(MobileEventName.BalancesReport, {
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
