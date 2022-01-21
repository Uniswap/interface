import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { getProvider, getSignerManager } from 'src/app/walletContext'
import { SWAP_ROUTER_ADDRESSES } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { sendTransaction, signAndSendTransaction } from 'src/features/transactions/sendTransaction'
import { addTransaction } from 'src/features/transactions/slice'
import {
  ApproveTransactionInfo,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { AccountType, ReadOnlyAccount } from 'src/features/wallet/accounts/types'
import { account, provider, signerManager, tokenContract } from 'src/test/fixtures'

const txTypeInfo: ApproveTransactionInfo = {
  type: TransactionType.APPROVE,
  tokenAddress: tokenContract.address,
  spender: SWAP_ROUTER_ADDRESSES[ChainId.RINKEBY],
}

const populatedTx = { from: '0x123', to: '0x456', value: '0x0', data: '0x789' }

const sendParams = {
  chainId: ChainId.MAINNET,
  account,
  options: { request: populatedTx },
  typeInfo: txTypeInfo,
}

const transactionReceipt = {
  transactionHash: '0x123',
  blockHash: '0x123',
  blockNumber: 1,
  transactionIndex: 1,
  confirmations: 1,
  status: 1,
}

const transactionResponse = {
  hash: '0x123',
  wait: jest.fn(() => transactionReceipt),
}

describe(sendTransaction, () => {
  let dateNowSpy: any

  beforeAll(() => {
    // Lock Time
    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => 1487076708000)
  })

  afterAll(() => {
    // Unlock Time
    dateNowSpy?.mockRestore()
  })

  it('Sends valid transactions successfully', () => {
    return expectSaga(sendTransaction, sendParams)
      .provide([
        [call(getProvider, sendParams.chainId), provider],
        [call(getSignerManager), signerManager],
        [
          call(signAndSendTransaction, sendParams, provider as any, signerManager),
          transactionResponse,
        ],
      ])
      .put(
        addTransaction({
          chainId: sendParams.chainId,
          hash: transactionResponse.hash,
          typeInfo: txTypeInfo,
          from: sendParams.account.address,
          status: TransactionStatus.Pending,
          addedTime: Date.now(),
          options: {
            request: {
              chainId: sendParams.chainId,
              to: populatedTx.to,
              from: populatedTx.from,
              data: populatedTx.data,
              value: populatedTx.value,
              type: undefined,
              nonce: undefined,
              gasLimit: undefined,
              gasPrice: undefined,
              maxPriorityFeePerGas: undefined,
              maxFeePerGas: undefined,
            },
          },
        })
      )
      .silentRun()
  })

  it('Fails for readonly accounts', () => {
    const readOnlyAccount: ReadOnlyAccount = {
      type: AccountType.readonly,
      address: '0xabc',
      name: 'readonly',
    }
    const params = {
      ...sendParams,
      account: readOnlyAccount,
    }
    return expectSaga(sendTransaction, params)
      .throws(new Error('Account must support signing'))
      .silentRun()
  })
})
