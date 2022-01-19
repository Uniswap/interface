import { BigNumber } from '@ethersproject/bignumber'
import { MaxUint256 } from '@ethersproject/constants'
import { testSaga } from 'redux-saga-test-plan'
import { SWAP_ROUTER_ADDRESSES } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { GAS_INFLATION_FACTOR } from 'src/constants/gas'
import { ApproveParams, maybeApprove } from 'src/features/approve/approveSaga'
import { sendTransaction } from 'src/features/transactions/sendTransaction'
import { TransactionType } from 'src/features/transactions/types'
import { account, tokenContract } from 'src/test/fixtures'

const approveParams: ApproveParams = {
  account,
  chainId: ChainId.RINKEBY,
  txAmount: '1',
  contract: tokenContract,
  spender: SWAP_ROUTER_ADDRESSES[ChainId.RINKEBY],
}

const approveTxTypeInfo = {
  type: TransactionType.APPROVE,
  tokenAddress: tokenContract.address,
  spender: approveParams.spender,
}

const populatedTx = { from: '0x123', to: '0x456', value: '0x0', data: '0x789' }

describe(maybeApprove, () => {
  it('skips approval when allowance is sufficient', () => {
    testSaga(maybeApprove, approveParams)
      .next()
      .call(approveParams.contract.allowance, approveParams.account.address, approveParams.spender)
      .next(BigNumber.from(approveParams.txAmount).add('1000'))
      .isDone()
  })

  it('ignores failed allowance check', () => {
    testSaga(maybeApprove, approveParams)
      .next()
      .call(approveParams.contract.allowance, approveParams.account.address, approveParams.spender)
      .throw(new Error('Failed to get allowance'))
  })

  it('approves maximum amount', () => {
    testSaga(maybeApprove, approveParams)
      .next()
      .call(approveParams.contract.allowance, approveParams.account.address, approveParams.spender)
      .next(BigNumber.from('0'))
      .call(approveParams.contract.estimateGas.approve, approveParams.spender, MaxUint256)
      .next(BigNumber.from(100_000))
      .call(approveParams.contract.populateTransaction.approve, approveParams.spender, MaxUint256, {
        gasLimit: BigNumber.from(100_000).mul(GAS_INFLATION_FACTOR),
      })
      .next(populatedTx)
      .call(sendTransaction, {
        chainId: approveParams.chainId,
        account: approveParams.account,
        options: { request: populatedTx },
        typeInfo: approveTxTypeInfo,
      })
      .next()
      .isDone()
  })

  it('approves exact amount', () => {
    const approvedAmount = BigNumber.from(approveParams.txAmount)
    testSaga(maybeApprove, approveParams)
      .next()
      .call(approveParams.contract.allowance, approveParams.account.address, approveParams.spender)
      .next(BigNumber.from('0'))
      .call(approveParams.contract.estimateGas.approve, approveParams.spender, MaxUint256)
      .throw(new Error('Failed to estimate gas'))
      .call(approveParams.contract.estimateGas.approve, approveParams.spender, approvedAmount)
      .next(BigNumber.from(120_000))
      .call(
        approveParams.contract.populateTransaction.approve,
        approveParams.spender,
        approvedAmount,
        {
          gasLimit: BigNumber.from(120_000).mul(GAS_INFLATION_FACTOR),
        }
      )
      .next(populatedTx)
      .call(sendTransaction, {
        chainId: approveParams.chainId,
        account: approveParams.account,
        options: { request: populatedTx },
        typeInfo: approveTxTypeInfo,
      })
      .next()
      .isDone()
  })

  // TODO: switch to integration testing with redux-saga-test-poaan
  // The sample `expectSaga` test redux-saga-test-plan does not pass for me.. figure out why
  // xit('skips approval when allowance is sufficient', () => {
  //   return expectSaga(approveSaga)
  //     .provide([
  //       [call(getSignerManager), SignerManager],
  //       [
  //         call(tokenContract.allowance, account.address, approveParams.spender),
  //         approveParams.txAmount.add(10),
  //       ],
  //     ])
  //     .dispatch(approveActions.trigger(approveParams))
  //     .silentRun(50)
  // })
})
