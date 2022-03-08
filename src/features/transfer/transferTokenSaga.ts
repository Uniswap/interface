import { BigNumber, BigNumberish, providers } from 'ethers'
import ERC20_ABI from 'src/abis/erc20.json'
import { Erc20 } from 'src/abis/types'
import { getContractManager, getProvider } from 'src/app/walletContext'
import { NULL_ADDRESS } from 'src/constants/accounts'
import { ContractManager } from 'src/features/contracts/ContractManager'
import { sendTransaction } from 'src/features/transactions/sendTransaction'
import {
  TransactionOptions,
  TransactionType,
  TransactionTypeInfo,
} from 'src/features/transactions/types'
import { TransferTokenParams } from 'src/features/transfer/types'
import { logger } from 'src/utils/logger'
import { createMonitoredSaga } from 'src/utils/saga'
import { call } from 'typed-redux-saga'

export function* transferToken(params: TransferTokenParams) {
  const { account, chainId, tokenAddress, amountInWei } = params
  const provider = yield* call(getProvider, chainId)
  const contractManager = yield* call(getContractManager)

  // NULL_ADDRESS represents a native (e.g. Eth) transfer
  let transactionRequest: providers.TransactionRequest
  if (tokenAddress === NULL_ADDRESS) {
    transactionRequest = yield* call(prepareNativeTransfer, params, provider)
  } else {
    transactionRequest = yield* call(prepareTokenTransfer, params, provider, contractManager)
  }

  const typeInfo: TransactionTypeInfo = {
    type: TransactionType.Send,
    currencyAmountRaw: amountInWei,
  }

  const options: TransactionOptions = {
    request: transactionRequest,
    fetchBalanceOnSuccess: true,
  }

  yield* call(sendTransaction, {
    chainId,
    account,
    options,
    typeInfo,
  })

  logger.debug('transferToken', '', 'Transfer complete')
}

async function prepareNativeTransfer(params: TransferTokenParams, provider: providers.Provider) {
  const { account, toAddress, amountInWei } = params
  const currentBalance = await provider.getBalance(account.address)
  validateTransferAmount(amountInWei, currentBalance)
  const transactionRequest: providers.TransactionRequest = {
    from: account.address,
    to: toAddress,
    value: amountInWei,
  }
  return transactionRequest
}

async function prepareTokenTransfer(
  params: TransferTokenParams,
  provider: providers.Provider,
  contractManager: ContractManager
) {
  const { account, toAddress, chainId, tokenAddress, amountInWei } = params
  const tokenContract = contractManager.getOrCreateContract<Erc20>(
    chainId,
    tokenAddress,
    provider,
    ERC20_ABI
  )
  const currentBalance = await tokenContract.balanceOf(account.address)
  validateTransferAmount(amountInWei, currentBalance)
  const transactionRequest = await tokenContract.populateTransaction.transfer(
    toAddress,
    amountInWei
  )
  return transactionRequest
}

function validateTransferAmount(amountInWei: string, currentBalance: BigNumberish) {
  const amount = BigNumber.from(amountInWei)
  if (amount.lte(0)) {
    logger.error('transferToken', 'validateTransferAmount', 'Invalid transfer amount')
    throw new Error('Invalid transfer amount')
  }
  if (BigNumber.from(amountInWei).gt(currentBalance)) {
    logger.error('transferToken', 'validateTransferAmount', 'Balance insufficient for transfer')
    throw new Error('Insufficient balance')
  }
}

export const {
  name: transferTokenSagaName,
  wrappedSaga: transferTokenSaga,
  reducer: transferTokenReducer,
  actions: transferTokenActions,
} = createMonitoredSaga<TransferTokenParams>(transferToken, 'transferToken')
