import { MethodParameters } from '@uniswap/v3-sdk'
import { Signer } from 'ethers'
import { testSaga } from 'redux-saga-test-plan'
import { getSignerManager, getWalletProviders } from 'src/app/walletContext'
import { SWAP_ROUTER_ADDRESSES } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { ApproveParams, maybeApprove } from 'src/features/approve/approveSaga'
import { approveAndSwap, SwapParams } from 'src/features/swap/swapSaga'
import { account, provider, providerManager, signerManager, tokenContract } from 'src/test/fixtures'

const mockTransactionResponse = {
  wait: jest.fn(),
}

const approveParams: ApproveParams = {
  account,
  chainId: ChainId.RINKEBY,
  txAmount: '1',
  contract: tokenContract,
  spender: SWAP_ROUTER_ADDRESSES[ChainId.RINKEBY],
}

const methodParameters: MethodParameters = {
  value: '0x00',
  calldata: '0x01',
}

const swapParams: SwapParams = { ...approveParams, chainId: ChainId.RINKEBY, methodParameters }
const transaction = {
  from: account.address,
  to: SWAP_ROUTER_ADDRESSES[ChainId.RINKEBY],
  data: '0x01',
}
const transactionWithValue = {
  ...transaction,
  value: '0x02',
}

let signer: Signer
let connectedSigner: Signer

describe(approveAndSwap, () => {
  beforeAll(async () => {
    signer = await signerManager.getSignerForAccount(account)
    connectedSigner = signer.connect(provider)
  })

  it('errors out when approval fails', () => {
    testSaga(approveAndSwap, swapParams)
      .next()
      .call(getSignerManager)
      .next(signerManager)
      .call(getWalletProviders)
      .next(providerManager)
      .call([signerManager, signerManager.getSignerForAccount], account)
      .next(signer)
      .call([signer, signer.connect], provider)
      .next(connectedSigner)
      .call(maybeApprove, swapParams)
      .next(/*approved=*/ false)
      .isDone()
  })

  it('sends a transaction and waits on receipt', () => {
    testSaga(approveAndSwap, swapParams)
      .next()
      .call(getSignerManager)
      .next(signerManager)
      .call(getWalletProviders)
      .next(providerManager)
      .call([signerManager, signerManager.getSignerForAccount], account)
      .next(signer)
      .call([signer, signer.connect], provider)
      .next(connectedSigner)
      .call(maybeApprove, swapParams)
      .next(/*approved=*/ true)
      .call([connectedSigner, connectedSigner.populateTransaction], transaction)
      .next(transaction)
      .call([connectedSigner, connectedSigner.signTransaction], transaction)
      .next('0x123')
      .call([provider, provider.sendTransaction], '0x123')
      .next(mockTransactionResponse)
      .call(mockTransactionResponse.wait)
      .next({ transactionHash: '0x123456' })
      .next()
      .isDone()
  })

  it('sends a transaction with value and waits on receipt', () => {
    const params = { ...swapParams, methodParameters: { value: '0x02', calldata: '0x01' } }
    testSaga(approveAndSwap, params)
      .next()
      .call(getSignerManager)
      .next(signerManager)
      .call(getWalletProviders)
      .next(providerManager)
      .call([signerManager, signerManager.getSignerForAccount], account)
      .next(signer)
      .call([signer, signer.connect], provider)
      .next(connectedSigner)
      .call(maybeApprove, params)
      .next(/*approved=*/ true)
      .call([connectedSigner, connectedSigner.populateTransaction], transactionWithValue)
      .next(transactionWithValue)
      .call([connectedSigner, connectedSigner.signTransaction], transactionWithValue)
      .next('0x123')
      .call([provider, provider.sendTransaction], '0x123')
      .next(mockTransactionResponse)
      .call(mockTransactionResponse.wait)
      .next({ transactionHash: '0x123456' })
      .isDone()
  })
})
