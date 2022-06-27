import { MaxUint256 } from '@ethersproject/constants'
import { call, select } from '@redux-saga/core/effects'
import { AnyAction, Dispatch } from '@reduxjs/toolkit'
import { BigNumber, providers } from 'ethers'
import { expectSaga } from 'redux-saga-test-plan'
import { getContractManager, getProvider } from 'src/app/walletContext'
import { NATIVE_ADDRESS, SWAP_ROUTER_ADDRESSES } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { DAI } from 'src/constants/tokens'
import { computeGasFee } from 'src/features/gas/computeGasFee'
import {
  ApproveGasEstimateParmams,
  estimateGas,
  SwapGasEstimateParams,
} from 'src/features/gas/estimateGasSaga'
import { FeeType } from 'src/features/gas/types'
import { TransactionType } from 'src/features/transactions/types'
import { selectActiveAccountAddress } from 'src/features/wallet/selectors'
import { mockProvider } from 'src/test/fixtures'

const mockTransactionDispatch = jest.fn() as Dispatch<AnyAction>
const mockAddress = '0x123000123'

const approveGasEstimateRequest: ApproveGasEstimateParmams = {
  txType: TransactionType.Approve,
  chainId: ChainId.Mainnet,
  transactionStateDispatch: mockTransactionDispatch,
  tokenAddress: DAI.address,
  txAmount: '1000',
}

const swapGasEstimateRequest: SwapGasEstimateParams = {
  txType: TransactionType.Swap,
  chainId: ChainId.Mainnet,
  transactionStateDispatch: mockTransactionDispatch,
  callData: '0xcalldata',
  gasUseEstimate: '100000',
  value: '0',
}

const createAction = (payload: any) => ({
  payload,
  type: '',
})

describe('estimateGasSaga', () => {
  it('Estimates gas for an approve tx', async () => {
    const mockContractManager = {
      getOrCreateContract: jest.fn(() => mockTokenContract),
    }

    const mockTokenContract = {
      allowance: jest.fn(() => BigNumber.from(0)),
      estimateGas: {
        approve: jest.fn(() => BigNumber.from(46000)),
      },
    }

    await expectSaga(estimateGas, createAction(approveGasEstimateRequest))
      .provide([
        [select(selectActiveAccountAddress), mockAddress],
        [call(getProvider, approveGasEstimateRequest.chainId), mockProvider],
        [call(getContractManager), mockContractManager],
      ])
      .call(
        mockTokenContract.estimateGas.approve,
        SWAP_ROUTER_ADDRESSES[approveGasEstimateRequest.chainId],
        MaxUint256,
        { from: mockAddress }
      )
      .silentRun()
  })

  it('Estimates gas for an approve tx that already has a sufficient allowance', async () => {
    const mockContractManager = {
      getOrCreateContract: jest.fn(() => mockTokenContract),
    }

    const mockTokenContract = {
      allowance: jest.fn(() => BigNumber.from(1000000000)),
      estimateGas: {
        approve: jest.fn(() => BigNumber.from(46000)),
      },
    }

    await expectSaga(estimateGas, createAction(approveGasEstimateRequest))
      .provide([
        [select(selectActiveAccountAddress), mockAddress],
        [call(getProvider, approveGasEstimateRequest.chainId), mockProvider],
        [call(getContractManager), mockContractManager],
      ])
      .silentRun()
  })

  it('Estimates gas for an approve tx of a native currency', async () => {
    const nativeApproveRequest = { ...approveGasEstimateRequest }
    nativeApproveRequest.tokenAddress = NATIVE_ADDRESS

    await expectSaga(estimateGas, createAction(nativeApproveRequest))
      .provide([
        [select(selectActiveAccountAddress), mockAddress],
        [call(getProvider, approveGasEstimateRequest.chainId), mockProvider],
      ])
      .silentRun()
  })

  it('Estimates gas for a swap tx', async () => {
    const mockTx: providers.TransactionRequest = {
      from: mockAddress,
      to: SWAP_ROUTER_ADDRESSES[swapGasEstimateRequest.chainId],
      data: swapGasEstimateRequest.callData,
    }

    const mockFeeInfo = {
      type: FeeType.Eip1559,
      gasLimit: '95000',
      feeDetails: {
        currentBaseFeePerGas: '35',
        maxBaseFeePerGas: '50',
        maxPriorityFeePerGas: { normal: '0', fast: '2', urgent: '5' },
      },
    }

    await expectSaga(estimateGas, createAction(swapGasEstimateRequest))
      .provide([
        [select(selectActiveAccountAddress), mockAddress],
        [call(getProvider, approveGasEstimateRequest.chainId), mockProvider],
        [
          call(
            computeGasFee,
            swapGasEstimateRequest.chainId,
            mockTx,
            mockProvider as unknown as providers.JsonRpcProvider,
            swapGasEstimateRequest.gasUseEstimate
          ),
          mockFeeInfo,
        ],
      ])
      .call(
        computeGasFee,
        swapGasEstimateRequest.chainId,
        mockTx,
        mockProvider,
        swapGasEstimateRequest.gasUseEstimate
      )
      .silentRun()
  })
})
