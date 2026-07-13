import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getEarnVaultDisplayCurrencyId } from 'uniswap/src/features/earn/utils'
import {
  DepositTransactionInfo,
  WithdrawTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { CurrencyId } from 'uniswap/src/types/currency'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

export function getDepositWithdrawDisplayCurrencyId({
  chainId,
  typeInfo,
}: {
  chainId: UniverseChainId
  typeInfo: DepositTransactionInfo | WithdrawTransactionInfo
}): CurrencyId {
  const currencyId = buildCurrencyId(chainId, typeInfo.tokenAddress)

  return typeInfo.isVault ? getEarnVaultDisplayCurrencyId(currencyId) : currencyId
}
