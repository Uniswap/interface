import { useCallback, useState } from 'react'
import i18n from 'uniswap/src/i18n'

import {
  runBorrowFlow,
  runRepayFlow,
  runSupplyCollateralFlow,
  runVaultDepositFlow,
  runVaultRedeemFlow,
  runVaultWithdrawFlow,
  runWithdrawCollateralFlow,
  type AssetAmounts,
  type MorphoTrackedTransaction,
} from 'pages/Markets/protocol/morpho/actionFlows'
import type { MorphoAddress, MorphoMarketId, MorphoTokenKey } from 'pages/Markets/protocol/morpho/config'
import { useMorphoProtocolEnvironment } from 'pages/Markets/protocol/morpho/useMorphoProtocolEnvironment'
import { useTransactionAdder } from 'state/transactions/hooks'

function toTrackedTransactions(transactions: MorphoTrackedTransaction[], chainId: number | undefined) {
  return transactions.map((transaction) => ({
    response: transaction.response,
    chainId,
  }))
}

export function useMorphoActionFlows(targetChainId?: number) {
  const environment = useMorphoProtocolEnvironment(targetChainId)
  const addTransaction = useTransactionAdder()
  const [status, setStatus] = useState<string | null>(null)

  const ensureReady = useCallback(async () => {
    if (environment.account.status !== 'connected' || !environment.account.address) {
      throw new Error(i18n.t('common.lendingAction.walletNotConnected'))
    }

    if (environment.account.chainId !== environment.targetChainId) {
      await environment.switchChain(environment.targetChainId)
      setStatus(i18n.t('common.lendingAction.switchedToChainRetry', { chain: environment.targetChainLabel }))
      throw new Error(i18n.t('common.lendingAction.walletNetworkChangedRetry'))
    }

    if (!environment.execution || !environment.isExecutionConfigured) {
      throw new Error(i18n.t('common.lendingAction.executionNotConfigured', { chain: environment.targetChainLabel }))
    }

    if (!environment.routerContract || !environment.morphoContract || !environment.getErc20Contract) {
      throw new Error(i18n.t('common.lendingAction.morphoEnvironmentNotReady'))
    }

    return {
      account: environment.account.address as MorphoAddress,
      routerAddress: environment.execution.routerAddress,
      routerMorphoAddress: environment.execution.morphoAddress,
      routerContract: environment.routerContract,
      morphoContract: environment.morphoContract,
      getErc20Contract: environment.getErc20Contract,
      setStatus,
      onTransaction: (transaction: MorphoTrackedTransaction) => {
        addTransaction(transaction.response, transaction.info)
      },
    }
  }, [addTransaction, environment, setStatus])

  const trackTransactions = useCallback(
    (transactions: MorphoTrackedTransaction[]) => {
      return toTrackedTransactions(transactions, environment.account.chainId)
    },
    [environment.account.chainId],
  )

  const runSupplyCollateral = useCallback(
    async (
      marketId: MorphoMarketId,
      collateralAssetKey: MorphoTokenKey,
      loanAssetKey: MorphoTokenKey,
      amounts: AssetAmounts,
    ) => {
      const ctx = await ensureReady()
      const transactions = await runSupplyCollateralFlow({
        ...ctx,
        marketId,
        collateralAssetKey,
        loanAssetKey,
        amounts,
      })
      return trackTransactions(transactions)
    },
    [ensureReady, trackTransactions],
  )

  const runBorrow = useCallback(
    async (
      marketId: MorphoMarketId,
      collateralAssetKey: MorphoTokenKey,
      loanAssetKey: MorphoTokenKey,
      amounts: AssetAmounts,
    ) => {
      const ctx = await ensureReady()
      const transactions = await runBorrowFlow({ ...ctx, marketId, collateralAssetKey, loanAssetKey, amounts })
      return trackTransactions(transactions)
    },
    [ensureReady, trackTransactions],
  )

  const runRepay = useCallback(
    async (
      marketId: MorphoMarketId,
      collateralAssetKey: MorphoTokenKey,
      loanAssetKey: MorphoTokenKey,
      amounts: AssetAmounts,
    ) => {
      const ctx = await ensureReady()
      const transactions = await runRepayFlow({ ...ctx, marketId, collateralAssetKey, loanAssetKey, amounts })
      return trackTransactions(transactions)
    },
    [ensureReady, trackTransactions],
  )

  const runWithdrawCollateral = useCallback(
    async (
      marketId: MorphoMarketId,
      collateralAssetKey: MorphoTokenKey,
      loanAssetKey: MorphoTokenKey,
      amounts: AssetAmounts,
    ) => {
      const ctx = await ensureReady()
      const transactions = await runWithdrawCollateralFlow({
        ...ctx,
        marketId,
        collateralAssetKey,
        loanAssetKey,
        amounts,
      })
      return trackTransactions(transactions)
    },
    [ensureReady, trackTransactions],
  )

  const runVaultDeposit = useCallback(
    async (vaultAddress: MorphoAddress, assetKey: MorphoTokenKey, amounts: AssetAmounts) => {
      const ctx = await ensureReady()
      const transactions = await runVaultDepositFlow({ ...ctx, vaultAddress, assetKey, amounts })
      return trackTransactions(transactions)
    },
    [ensureReady, trackTransactions],
  )

  const runVaultWithdraw = useCallback(
    async (
      vaultAddress: MorphoAddress,
      assetKey: MorphoTokenKey,
      amounts: AssetAmounts,
      requiredShareAllowance?: bigint,
    ) => {
      const ctx = await ensureReady()
      const transactions = await runVaultWithdrawFlow({
        ...ctx,
        vaultAddress,
        assetKey,
        amounts,
        requiredShareAllowance,
      })
      return trackTransactions(transactions)
    },
    [ensureReady, trackTransactions],
  )

  const runVaultRedeem = useCallback(
    async (vaultAddress: MorphoAddress, assetKey: MorphoTokenKey, shares: bigint) => {
      const ctx = await ensureReady()
      const transactions = await runVaultRedeemFlow({ ...ctx, vaultAddress, assetKey, shares })
      return trackTransactions(transactions)
    },
    [ensureReady, trackTransactions],
  )

  return {
    ...environment,
    status,
    setStatus,
    runSupplyCollateral,
    runBorrow,
    runRepay,
    runWithdrawCollateral,
    runVaultDeposit,
    runVaultWithdraw,
    runVaultRedeem,
  }
}
