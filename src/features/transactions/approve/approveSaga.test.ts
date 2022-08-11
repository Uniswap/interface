import { BigNumber } from '@ethersproject/bignumber'
import { MaxUint256 } from '@ethersproject/constants'
import { call } from '@redux-saga/core/effects'
import { expectSaga } from 'redux-saga-test-plan'
import { getContractManager, getProvider } from 'src/app/walletContext'
import { SWAP_ROUTER_ADDRESSES } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { DAI } from 'src/constants/tokens'
import { FeeType } from 'src/features/gas/types'
import { getTxGasSettings } from 'src/features/gas/utils'
import { ApproveParams, maybeApprove } from 'src/features/transactions/approve/approveSaga'
import { sendTransaction } from 'src/features/transactions/sendTransaction'
import { TransactionType } from 'src/features/transactions/types'
import { account, mockProvider } from 'src/test/fixtures'

describe(maybeApprove, () => {
  it('skips approval when gasFeeEstimate null', async () => {
    const approveParams: ApproveParams = {
      account,
      chainId: ChainId.Rinkeby,
      approveAmount: BigNumber.from(1),
      inputTokenAddress: DAI.address,
      spender: SWAP_ROUTER_ADDRESSES[ChainId.Rinkeby],
      gasFeeEstimate: null,
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
      gasFeeEstimate: {
        type: FeeType.Eip1559,
        gasLimit: '100000',
        fee: {
          fast: '14508243138800000',
          normal: '14375759517700000',
          urgent: '14639580260700000',
        },
        feeDetails: {
          currentBaseFeePerGas: '120281423397',
          maxBaseFeePerGas: '142082431388',
          maxPriorityFeePerGas: {
            fast: '3000000000',
            normal: '1675163789',
            urgent: '4313371219',
          },
        },
      },
    }

    const mockContractManager = {
      getOrCreateContract: jest.fn(() => mockTokenContract),
    }

    if (!approveParams.gasFeeEstimate) return

    const txGasParams = getTxGasSettings(approveParams.gasFeeEstimate)

    const tx = {
      to: approveParams.inputTokenAddress,
      from: approveParams.spender,
      nonce: 1,
      data: '0x1230101013',
      chainId: approveParams.chainId,
      ...txGasParams,
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
        txGasParams
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
      gasFeeEstimate: {
        type: FeeType.Eip1559,
        gasLimit: '100000',
        fee: {
          fast: '14508243138800000',
          normal: '14375759517700000',
          urgent: '14639580260700000',
        },
        feeDetails: {
          currentBaseFeePerGas: '120281423397',
          maxBaseFeePerGas: '142082431388',
          maxPriorityFeePerGas: {
            fast: '3000000000',
            normal: '1675163789',
            urgent: '4313371219',
          },
        },
      },
    }

    const mockContractManager = {
      getOrCreateContract: jest.fn(() => mockTokenContract),
    }

    if (!approveParams.gasFeeEstimate) return

    const txGasParams = getTxGasSettings(approveParams.gasFeeEstimate)

    const tx = {
      to: approveParams.inputTokenAddress,
      from: approveParams.spender,
      nonce: 1,
      data: '0x1230101013',
      chainId: approveParams.chainId,
      ...txGasParams,
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
        txGasParams
      )
      .silentRun()
  })
})
