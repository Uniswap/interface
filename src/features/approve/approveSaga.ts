import { MaxUint256 } from '@ethersproject/constants'
import { BigNumber } from 'ethers'
import { Erc20 } from 'src/abis/types'
import { ChainId } from 'src/constants/chains'
import { GAS_INFLATION_FACTOR } from 'src/constants/gas'
import { sendTransaction } from 'src/features/transactions/sendTransaction'
import {
  TransactionOptions,
  TransactionType,
  TransactionTypeInfo,
} from 'src/features/transactions/types'
import { Account } from 'src/features/wallet/accounts/types'
import { logger } from 'src/utils/logger'
import { call } from 'typed-redux-saga'

export interface ApproveParams {
  account: Account
  chainId: ChainId
  txAmount: string
  contract: Erc20
  spender: Address
}

export function* maybeApprove(params: ApproveParams) {
  const { account, txAmount, chainId, contract, spender } = params

  try {
    const allowance = yield* call(contract.allowance, account.address, spender)

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

  // TODO move gas estimation out of this saga
  // Tricky in this case as it's being used to determine approval amount
  try {
    const populatedTx = yield* call(
      contract.populateTransaction.approve,
      spender,
      amountToApprove,
      {
        gasLimit: estimatedGas.mul(GAS_INFLATION_FACTOR),
      }
    )

    const typeInfo: TransactionTypeInfo = {
      type: TransactionType.Approve,
      tokenAddress: contract.address,
      spender,
    }

    const options: TransactionOptions = {
      request: populatedTx,
    }

    yield* call(sendTransaction, {
      chainId,
      account,
      options,
      typeInfo,
    })

    return true
  } catch (e) {
    logger.error('approveSaga', 'approve', 'Failed to approve:' + e)
    return false
  }
}
