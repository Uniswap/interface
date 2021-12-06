import { MaxUint256 } from '@ethersproject/constants'
import { BigNumber, providers } from 'ethers'
import { Erc20 } from 'src/abis/types'
import { getSignerManager, getWalletProviders } from 'src/app/walletContext'
import { ChainId } from 'src/constants/chains'
import { GAS_INFLATION_FACTOR } from 'src/constants/gas'
import { addTransaction, finalizeTransaction } from 'src/features/transactions/sagaHelpers'
import { TransactionType } from 'src/features/transactions/types'
import { Account, AccountType } from 'src/features/wallet/accounts/types'
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

  if (account.type === AccountType.readonly) throw new Error('Account must support signing')

  const signerManager = yield* call(getSignerManager)
  const providerManager = yield* call(getWalletProviders)
  const signer = yield* call([signerManager, signerManager.getSignerForAccount], account)
  const provider = providerManager.getProvider(chainId)
  const connectedSigner = yield* call([signer, signer.connect], provider)
  const signerContract = yield* call([contract, contract.connect], connectedSigner)

  try {
    const allowance = yield* call(signerContract.allowance, account.address, spender)

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
    estimatedGas = yield* call(signerContract.estimateGas.approve, spender, amountToApprove)
  } catch (e) {
    logger.debug(
      'approveSaga',
      'approve',
      'Gas estimation for approve max amount failed (token may restrict approval amounts). Attempting to approve exact'
    )
    amountToApprove = BigNumber.from(txAmount)
    estimatedGas = yield* call(signerContract.estimateGas.approve, spender, amountToApprove)
  }

  try {
    const response: providers.TransactionResponse = yield* call(
      signerContract.approve,
      spender,
      amountToApprove,
      {
        gasLimit: estimatedGas.mul(GAS_INFLATION_FACTOR),
      }
    )

    yield* call(addTransaction, response, {
      type: TransactionType.APPROVE,
      tokenAddress: contract.address,
      spender,
    })

    const receipt = yield* call(response.wait)

    yield* call(finalizeTransaction, response, receipt)

    return true
  } catch (e) {
    logger.error('approveSaga', 'approve', 'Failed to approve:' + e)
    return false
  }
}
