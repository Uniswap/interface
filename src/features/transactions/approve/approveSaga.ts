import { BigNumber } from 'ethers'
import ERC20_ABI from 'src/abis/erc20.json'
import { Erc20 } from 'src/abis/types'
import { getContractManager, getProvider } from 'src/app/walletContext'
import { ChainId } from 'src/constants/chains'
import { FeeInfo } from 'src/features/gas/types'
import { getTxGasSettings } from 'src/features/gas/utils'
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
  approveAmount: BigNumber
  inputTokenAddress: string
  spender: Address
  gasFeeEstimate: FeeInfo | null
}

export function* maybeApprove(params: ApproveParams) {
  const { account, approveAmount, chainId, inputTokenAddress, spender, gasFeeEstimate } = params

  if (!gasFeeEstimate) {
    return false
  }

  const contractManager = yield* call(getContractManager)
  const provider = yield* call(getProvider, chainId)
  const contract = contractManager.getOrCreateContract<Erc20>(
    chainId,
    inputTokenAddress,
    provider,
    ERC20_ABI
  )

  const gasSettings = getTxGasSettings(gasFeeEstimate)

  try {
    // For whatever reason Ethers throws for L2s if we don't convert strings to hex strings
    const populatedTx = yield* call(
      contract.populateTransaction.approve,
      spender,
      approveAmount,
      gasSettings
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
    throw new Error('Provided SwapRouter contract is not approved to spend tokens')
  }
}
