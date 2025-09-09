import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { calculateTotalBalancesUsdPerChainRest, useTotalBalancesUsdPerChain } from 'uniswap/src/data/balances/utils'
import { reportBalancesForAnalytics } from 'uniswap/src/features/accounts/reportBalancesForAnalytics'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { usePortfolioBalancesQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useGetPortfolioQuery } from 'uniswap/src/data/rest/getPortfolio'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { usePortfolioValueModifiers } from 'uniswap/src/features/dataApi/balances/balances'
import { useRestPortfolioValueModifier } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { MobileAppsFlyerEvents } from 'uniswap/src/features/telemetry/constants'
import { sendAppsFlyerEvent } from 'uniswap/src/features/telemetry/send'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { logger } from 'utilities/src/logger/logger'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { useInterval } from 'utilities/src/time/timing'
import { useAccountBalances } from 'wallet/src/features/accounts/useAccountListData'
import {
  selectLastBalancesReport,
  selectLastBalancesReportValue,
  selectWalletIsFunded,
} from 'wallet/src/features/telemetry/selectors'
import { recordBalancesReport, recordWalletFunded, shouldReportBalances } from 'wallet/src/features/telemetry/slice'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { useAccounts } from 'wallet/src/features/wallet/hooks'

const BALANCE_REPORT_INTERVAL = ONE_MINUTE_MS

/**
 * Reports balances at most every 24 hours, checking every 15 seconds when app is open
 */
export function useLastBalancesReporter({ isOnboarded }: { isOnboarded: boolean }): void {
  const dispatch = useDispatch()

  const account = useWallet().evmAccount
  const accounts = useAccounts()
  const lastBalancesReport = useSelector(selectLastBalancesReport)
  const lastBalancesReportValue = useSelector(selectLastBalancesReportValue)
  const walletIsFunded = useSelector(selectWalletIsFunded)

  const signerAccountAddresses = useMemo(() => {
    return Object.values(accounts)
      .filter((a: Account) => a.type === AccountType.SignerMnemonic)
      .map((a) => a.address)
  }, [accounts])

  const { balances: signerAccountBalances, totalBalance: signerAccountsTotalBalance } = useAccountBalances({
    addresses: signerAccountAddresses,
    fetchPolicy: 'cache-first',
  })

  const { gqlChains, chains: chainIds } = useEnabledChains()
  const address = account?.address
  const valueModifiers = usePortfolioValueModifiers(address)
  const modifier = useRestPortfolioValueModifier(address)
  const isRestEnabled = useFeatureFlag(FeatureFlags.GqlToRestBalances)

  const portfolioBalancesGraphQLQuery = usePortfolioBalancesQuery({
    fetchPolicy: 'cache-first',
    variables: account?.address ? { ownerAddress: account.address, chains: gqlChains, valueModifiers } : undefined,
    skip: isRestEnabled || !account?.address,
  })

  const { data: portfolioBalancesRestData } = useGetPortfolioQuery({
    input: { evmAddress: address, chainIds, modifier },
    enabled: isRestEnabled && !!address,
  })

  const totalBalancesUsdPerChainGraphQL = useTotalBalancesUsdPerChain(portfolioBalancesGraphQLQuery)
  const totalBalancesUsdPerChainREST = calculateTotalBalancesUsdPerChainRest(portfolioBalancesRestData)

  const totalBalancesUsdPerChain = isRestEnabled ? totalBalancesUsdPerChainREST : totalBalancesUsdPerChainGraphQL

  useEffect(() => {
    if (!walletIsFunded && signerAccountsTotalBalance) {
      // Only trigger the first time a funded wallet is detected
      dispatch(recordWalletFunded())
      sendAppsFlyerEvent(MobileAppsFlyerEvents.WalletFunded, { sumOfFunds: signerAccountsTotalBalance }).catch(
        (error) => logger.debug('hooks', 'useLastBalancesReporter', error),
      )
    }
  }, [dispatch, signerAccountsTotalBalance, walletIsFunded])

  const reporter = (): void => {
    if (
      isOnboarded &&
      shouldReportBalances({
        lastBalancesReport,
        lastBalancesReportValue,
        signerAccountAddresses,
        signerAccountValues: signerAccountBalances,
        signerAccountsTotalBalance,
      })
    ) {
      reportBalancesForAnalytics({
        balances: signerAccountBalances,
        totalBalancesUsd: signerAccountsTotalBalance,
        totalBalancesUsdPerChain,
        wallet: account?.address,
        wallets: signerAccountAddresses,
        isViewOnly: account?.accountType === AccountType.Readonly,
      })
      // record that a report has been sent
      dispatch(recordBalancesReport({ totalBalance: signerAccountsTotalBalance }))
    }
  }

  useInterval(reporter, BALANCE_REPORT_INTERVAL, true)
}
