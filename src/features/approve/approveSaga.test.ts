import { BigNumber } from '@ethersproject/bignumber'
import { MaxUint256 } from '@ethersproject/constants'
import { Signer } from 'ethers'
import { testSaga } from 'redux-saga-test-plan'
import { getSignerManager, getWalletProviders } from 'src/app/walletContext'
import { SWAP_ROUTER_ADDRESSES } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { GAS_INFLATION_FACTOR } from 'src/constants/gas'
import { ApproveParams, maybeApprove } from 'src/features/approve/approveSaga'
import { addTransaction, finalizeTransaction } from 'src/features/transactions/sagaHelpers'
import { TransactionType } from 'src/features/transactions/types'
import { account, provider, providerManager, signerManager, tokenContract } from 'src/test/fixtures'

const approveParams: ApproveParams = {
  account,
  chainId: ChainId.RINKEBY,
  txAmount: '1',
  contract: tokenContract,
  spender: SWAP_ROUTER_ADDRESSES[ChainId.RINKEBY],
}

let signer: Signer
let connectedSigner: Signer

const transactionResponse = { hash: '0x123', wait: () => {} }
const transactionReceipt = {}

describe(maybeApprove, () => {
  beforeAll(async () => {
    signer = await signerManager.getSignerForAccount(account)
    connectedSigner = signer.connect(provider)
  })

  it('skips approval when allowance is sufficient', () => {
    testSaga(maybeApprove, approveParams)
      .next()
      .call(getSignerManager)
      .next(signerManager)
      .call(getWalletProviders)
      .next(providerManager)
      .call([signerManager, signerManager.getSignerForAccount], account)
      .next(signer)
      .call([signer, signer.connect], provider)
      .next(connectedSigner)
      .call([tokenContract, tokenContract.connect], connectedSigner)
      .next(tokenContract)
      .call(approveParams.contract.allowance, approveParams.account.address, approveParams.spender)
      .next(BigNumber.from(approveParams.txAmount).add('1000'))
      .isDone()
  })

  it('ignores failed allowance check', () => {
    testSaga(maybeApprove, approveParams)
      .next()
      .call(getSignerManager)
      .next(signerManager)
      .call(getWalletProviders)
      .next(providerManager)
      .call([signerManager, signerManager.getSignerForAccount], account)
      .next(signer)
      .call([signer, signer.connect], provider)
      .next(connectedSigner)
      .call([tokenContract, tokenContract.connect], connectedSigner)
      .next(tokenContract)
      .call(approveParams.contract.allowance, approveParams.account.address, approveParams.spender)
      .throw(new Error('Failed to get allowance'))
      .call(approveParams.contract.estimateGas.approve, approveParams.spender, MaxUint256)
  })

  it('approves maximum amount', () => {
    testSaga(maybeApprove, approveParams)
      .next()
      .call(getSignerManager)
      .next(signerManager)
      .call(getWalletProviders)
      .next(providerManager)
      .call([signerManager, signerManager.getSignerForAccount], account)
      .next(signer)
      .call([signer, signer.connect], provider)
      .next(connectedSigner)
      .call([tokenContract, tokenContract.connect], connectedSigner)
      .next(tokenContract)
      .call(approveParams.contract.allowance, approveParams.account.address, approveParams.spender)
      .next(BigNumber.from('0'))
      .call(approveParams.contract.estimateGas.approve, approveParams.spender, MaxUint256)
      .next(BigNumber.from(100_000))
      .call(approveParams.contract.approve, approveParams.spender, MaxUint256, {
        gasLimit: BigNumber.from(100_000).mul(GAS_INFLATION_FACTOR),
      })
      .next(transactionResponse)
      .call(addTransaction, transactionResponse, {
        type: TransactionType.APPROVE,
        tokenAddress: tokenContract.address,
        spender: approveParams.spender,
      })
      .next()
      .call(transactionResponse.wait)
      .next(transactionReceipt)
      .call(finalizeTransaction, transactionResponse, transactionReceipt)
      .next()
      .isDone()
  })

  it('approves exact amount', () => {
    const approvedAmount = BigNumber.from(approveParams.txAmount)
    testSaga(maybeApprove, approveParams)
      .next()
      .call(getSignerManager)
      .next(signerManager)
      .call(getWalletProviders)
      .next(providerManager)
      .call([signerManager, signerManager.getSignerForAccount], account)
      .next(signer)
      .call([signer, signer.connect], provider)
      .next(connectedSigner)
      .call([tokenContract, tokenContract.connect], connectedSigner)
      .next(tokenContract)

      .call(approveParams.contract.allowance, approveParams.account.address, approveParams.spender)
      .next(BigNumber.from('0'))
      .call(approveParams.contract.estimateGas.approve, approveParams.spender, MaxUint256)
      .throw(new Error('Failed to estimate gas'))
      .call(approveParams.contract.estimateGas.approve, approveParams.spender, approvedAmount)
      .next(BigNumber.from(120_000))
      .call(approveParams.contract.approve, approveParams.spender, approvedAmount, {
        gasLimit: BigNumber.from(120_000).mul(GAS_INFLATION_FACTOR),
      })
      .next(transactionResponse)
      .call(addTransaction, transactionResponse, {
        type: TransactionType.APPROVE,
        tokenAddress: tokenContract.address,
        spender: approveParams.spender,
      })
      .next()
      .call(transactionResponse.wait)
      .next(transactionReceipt)
      .call(finalizeTransaction, transactionResponse, transactionReceipt)
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
