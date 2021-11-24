import { MaxUint256 } from '@ethersproject/constants'
import { BigNumber, providers } from 'ethers'
import { Erc20 } from 'src/abis/types'
import { getWalletAccounts } from 'src/app/walletContext'
import { GAS_INFLATION_FACTOR } from 'src/constants/gas'
import { AccountStub, AccountType } from 'src/features/wallet/accounts/types'
import { logger } from 'src/utils/logger'
import { call } from 'typed-redux-saga'

export interface ApproveParams {
  account: AccountStub
  txAmount: string
  contract: Erc20
  requireReceipt?: boolean
  spender: Address
}

export function* maybeApprove(params: ApproveParams) {
  const { account, txAmount, contract, spender, requireReceipt = false } = params

  const accountManager = yield* call(getWalletAccounts)
  const walletAccount = accountManager.getAccount(account.address)

  if (!walletAccount) throw new Error('No account for specified address')
  if (walletAccount.type === AccountType.readonly) throw new Error('Account must support signing')

  try {
    const allowance = yield* call(contract.allowance, walletAccount.address, spender)

    if (allowance.gt(txAmount)) {
      logger.debug('approveSaga', 'approve', 'Token allowance sufficient. Skipping approval')
      return true
    }
  } catch (e) {
    logger.error('approveSaga', 'approve', 'Allowance check fail. Continuing with approval')
  }

  let amountToApprove = MaxUint256
  let estimatedGas: BigNumber
  try {
    estimatedGas = yield* call(contract.estimateGas.approve, spender, amountToApprove)
  } catch (e) {
    logger.debug(
      'approveSaga',
      'approve',
      'Gas estimation for approve max amount failed (token may restrict approval amounts). Attempting to approve exact'
    )
    amountToApprove = BigNumber.from(txAmount)
    estimatedGas = yield* call(contract.estimateGas.approve, spender, amountToApprove)
  }

  try {
    const response: providers.TransactionResponse = yield* call(
      contract.approve,
      spender,
      amountToApprove,
      {
        gasLimit: estimatedGas.mul(GAS_INFLATION_FACTOR),
      }
    )

    if (requireReceipt) {
      yield* call(response.wait)
      return true
    } else {
      return response
    }
  } catch (e) {
    logger.error('approveSaga', 'approve', 'Failed to estimate gas:' + e)
    return false
  }
}
