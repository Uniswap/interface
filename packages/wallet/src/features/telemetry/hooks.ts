import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { useTotalBalancesUsdPerChain } from 'uniswap/src/data/balances/utils'
import { usePortfolioBalancesQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { AccountType } from 'uniswap/src/features/accounts/types'
// eslint-disable-next-line no-restricted-imports
import { usePortfolioValueModifiers } from 'uniswap/src/features/dataApi/balances'
import { useEnabledChains } from 'uniswap/src/features/settings/hooks'
import { MobileAppsFlyerEvents, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
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
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { useAccounts } from 'wallet/src/features/wallet/hooks'

export function useLastBalancesReporter(): void {
  const dispatch = useDispatch()

  const account = useAccountMeta()
  const accounts = useAccounts()
  const lastBalancesReport = useSelector(selectLastBalancesReport)
  const lastBalancesReportValue = useSelector(selectLastBalancesReportValue)
  const walletIsFunded = useSelector(selectWalletIsFunded)

  const signerAccountAddresses = useMemo(() => {
    return Object.values(accounts)
      .filter((a: Account) => a.type === AccountType.SignerMnemonic)
      .map((a) => a.address)
  }, [accounts])

  const { data } = useAccountList({
    addresses: signerAccountAddresses,
    fetchPolicy: 'cache-first',
  })

  const { gqlChains } = useEnabledChains()
  const valueModifiers = usePortfolioValueModifiers(account?.address)

  const portfolioBalancesQuery = usePortfolioBalancesQuery({
    fetchPolicy: 'cache-only',
    variables: account?.address ? { ownerAddress: account.address, chains: gqlChains, valueModifiers } : undefined,
  })
  const totalBalancesUsdPerChain = useTotalBalancesUsdPerChain(portfolioBalancesQuery)

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

      sendAnalyticsEvent(UniswapEventName.BalancesReport, {
        total_balances_usd: totalBalance,
        wallets: signerAccountAddresses,
        balances: signerAccountValues,
      })

      // Send a report per chain
      if (totalBalancesUsdPerChain && account?.address) {
        sendAnalyticsEvent(UniswapEventName.BalancesReportPerChain, {
          total_balances_usd_per_chain: totalBalancesUsdPerChain,
          wallet: account.address,
        })
      }
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
  const allowAnalytics = useSelector(selectAllowAnalytics)
  const lastHeartbeat = useSelector(selectLastHeartbeat)

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
