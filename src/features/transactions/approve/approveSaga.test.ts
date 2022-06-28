import { BigNumber } from '@ethersproject/bignumber'
import { MaxUint256 } from '@ethersproject/constants'
import { call } from '@redux-saga/core/effects'
import { expectSaga } from 'redux-saga-test-plan'
import { getContractManager, getProvider } from 'src/app/walletContext'
import { SWAP_ROUTER_ADDRESSES } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { DAI } from 'src/constants/tokens'
import { ApproveParams, maybeApprove } from 'src/features/transactions/approve/approveSaga'
import { sendTransaction } from 'src/features/transactions/sendTransaction'
import { TransactionType } from 'src/features/transactions/types'
import { account, mockProvider } from 'src/test/fixtures'

describe(maybeApprove, () => {
  it('skips approval when gasLimit is 0', async () => {
    const approveParams: ApproveParams = {
      account,
      chainId: ChainId.Rinkeby,
      approveAmount: BigNumber.from(1),
      inputTokenAddress: DAI.address,
      spender: SWAP_ROUTER_ADDRESSES[ChainId.Rinkeby],
      gasLimit: '0',
      gasPrice: '45',
    }

    await expectSaga(maybeApprove, approveParams).silentRun()
  })

  it('submits an approve tx with inifine approval', async () => {
    const approveParams: ApproveParams = {
      account,
      chainId: ChainId.Rinkeby,
      approveAmount: MaxUint256,
      inputTokenAddress: DAI.address,
      spender: SWAP_ROUTER_ADDRESSES[ChainId.Rinkeby],
      gasLimit: '45000',
      gasPrice: '45',
    }

    const mockContractManager = {
      getOrCreateContract: jest.fn(() => mockTokenContract),
    }

    const tx = {
      to: approveParams.inputTokenAddress,
      from: approveParams.spender,
      nonce: 1,
      gasLimit: BigNumber.from(approveParams.gasLimit),
      gasPrice: BigNumber.from(approveParams.gasPrice),
      data: '0x1230101013',
      chainId: approveParams.chainId,
      maxFeePerGas: BigNumber.from(approveParams.gasPrice),
      maxPriorityFeePerGas: BigNumber.from(0),
    }

    const mockTokenContract = {
      address: DAI.address,
      populateTransaction: {
        approve: jest.fn(() => tx),
      },
    }

    await expectSaga(maybeApprove, approveParams)
      .provide([
        [call(getContractManager), mockContractManager],
        [call(getProvider, approveParams.chainId), mockProvider],
        [
          call(sendTransaction, {
            chainId: approveParams.chainId,
            account: approveParams.account,
            options: { request: tx },
            typeInfo: {
              type: TransactionType.Approve,
              tokenAddress: approveParams.inputTokenAddress,
              spender: approveParams.spender,
            },
          }),
          undefined,
        ],
      ])
      .call(
        mockTokenContract.populateTransaction.approve,
        SWAP_ROUTER_ADDRESSES[approveParams.chainId],
        MaxUint256,
        { gasLimit: approveParams.gasLimit, gasPrice: approveParams.gasPrice }
      )
      .silentRun()
  })

  it('submits an approve tx with a specific approve amount', async () => {
    const approveParams: ApproveParams = {
      account,
      chainId: ChainId.Rinkeby,
      approveAmount: BigNumber.from(1),
      inputTokenAddress: DAI.address,
      spender: SWAP_ROUTER_ADDRESSES[ChainId.Rinkeby],
      gasLimit: '45000',
      gasPrice: '45',
    }

    const mockContractManager = {
      getOrCreateContract: jest.fn(() => mockTokenContract),
    }

    const tx = {
      to: approveParams.inputTokenAddress,
      from: approveParams.spender,
      nonce: 1,
      gasLimit: BigNumber.from(approveParams.gasLimit),
      gasPrice: BigNumber.from(approveParams.gasPrice),
      data: '0x1230101013',
      chainId: approveParams.chainId,
      maxFeePerGas: BigNumber.from(approveParams.gasPrice),
      maxPriorityFeePerGas: BigNumber.from(0),
    }

    const mockTokenContract = {
      address: DAI.address,
      populateTransaction: {
        approve: jest.fn(() => tx),
      },
    }

    await expectSaga(maybeApprove, approveParams)
      .provide([
        [call(getContractManager), mockContractManager],
        [call(getProvider, approveParams.chainId), mockProvider],
        [
          call(sendTransaction, {
            chainId: approveParams.chainId,
            account: approveParams.account,
            options: { request: tx },
            typeInfo: {
              type: TransactionType.Approve,
              tokenAddress: approveParams.inputTokenAddress,
              spender: approveParams.spender,
            },
          }),
          undefined,
        ],
      ])
      .call(
        mockTokenContract.populateTransaction.approve,
        SWAP_ROUTER_ADDRESSES[approveParams.chainId],
        BigNumber.from(approveParams.approveAmount),
        { gasLimit: approveParams.gasLimit, gasPrice: approveParams.gasPrice }
      )
      .silentRun()
  })
})
