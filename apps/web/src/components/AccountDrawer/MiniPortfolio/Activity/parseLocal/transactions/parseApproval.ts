import { UniverseChainId } from '@universe/chains'
import { fetchCurrency } from 'uniswap/src/features/tokens/fetchCurrencyInfo'
import type { ApproveTransactionInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import i18n from 'uniswap/src/i18n'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { getActivityTitle } from '~/components/AccountDrawer/MiniPortfolio/Activity/constants'
import type { Activity } from '~/components/AccountDrawer/MiniPortfolio/Activity/types'

export async function parseApproval({
  approval,
  chainId,
  status,
}: {
  approval: ApproveTransactionInfo
  chainId: UniverseChainId
  status: TransactionStatus
}): Promise<Partial<Activity>> {
  const currency = await fetchCurrency(buildCurrencyId(chainId, approval.tokenAddress))
  const descriptor = currency?.symbol ?? currency?.name ?? approval.tokenSymbol ?? i18n.t('common.unknown')
  return {
    title: getActivityTitle({
      type: TransactionType.Approve,
      status,
      alternate: BigInt(approval.approvalAmount!) === 0n, // use alternate if it's a revoke
    }),
    descriptor,
    currencies: [currency],
  }
}
