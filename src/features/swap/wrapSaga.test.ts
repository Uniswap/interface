import { CurrencyAmount, Ether } from '@uniswap/sdk-core'
import { Signer } from 'ethers'
import { testSaga } from 'redux-saga-test-plan'
import { getSignerManager, getWalletProviders } from 'src/app/walletContext'
import { ChainId } from 'src/constants/chains'
import { fetchBalancesActions } from 'src/features/balances/fetchBalances'
import { getWethContract, Params, wrap } from 'src/features/swap/wrapSaga'
import { addTransaction, finalizeTransaction } from 'src/features/transactions/sagaHelpers'
import { TransactionType, WrapTransactionInfo } from 'src/features/transactions/types'
import { account, provider, providerManager, signerManager, wethContract } from 'src/test/fixtures'

const mockTransactionResponse = {
  wait: jest.fn(),
}
const mockTransactionReceipt = {}

const wrapTxInfo: WrapTransactionInfo = {
  type: TransactionType.WRAP,
  unwrapped: false,
  currencyAmountRaw: '200000',
}

const unwrapTxInfo: WrapTransactionInfo = {
  ...wrapTxInfo,
  unwrapped: true,
}

const params: Params = {
  account,
  inputCurrencyAmount: CurrencyAmount.fromRawAmount(Ether.onChain(ChainId.RINKEBY), '200000'),
}

let signer: Signer
let connectedSigner: Signer

describe(wrap, () => {
  beforeAll(async () => {
    signer = await signerManager.getSignerForAccount(account)
    connectedSigner = signer.connect(provider)
  })

  it('successfully wrap native eth', () => {
    testSaga(wrap, params)
      .next()
      .call(getSignerManager)
      .next(signerManager)
      .call(getWalletProviders)
      .next(providerManager)
      .call([signerManager, signerManager.getSignerForAccount], account)
      .next(signer)
      .call([signer, signer.connect], provider)
      .next(connectedSigner)
      .call(getWethContract, ChainId.RINKEBY, connectedSigner)
      .next(wethContract)
      .call(wethContract.deposit, {
        value: `0x30d40`,
      })
      .next(mockTransactionResponse)
      .call(addTransaction, mockTransactionResponse, wrapTxInfo)
      .next(mockTransactionResponse)
      .call(mockTransactionResponse.wait)
      .next(mockTransactionReceipt)
      .call(finalizeTransaction, mockTransactionResponse, mockTransactionReceipt)
      .next()
      .put(fetchBalancesActions.trigger(account.address))
      .next()
      .isDone()
  })

  it('successfully unwraps to native eth', () => {
    const unwrapParams: Params = {
      ...params,
      inputCurrencyAmount: CurrencyAmount.fromRawAmount(
        Ether.onChain(ChainId.RINKEBY).wrapped,
        '200000'
      ),
    }
    testSaga(wrap, unwrapParams)
      .next()
      .call(getSignerManager)
      .next(signerManager)
      .call(getWalletProviders)
      .next(providerManager)
      .call([signerManager, signerManager.getSignerForAccount], account)
      .next(signer)
      .call([signer, signer.connect], provider)
      .next(connectedSigner)
      .call(getWethContract, ChainId.RINKEBY, connectedSigner)
      .next(wethContract)
      .call(wethContract.withdraw, `0x30d40`)
      .next(mockTransactionResponse)
      .call(addTransaction, mockTransactionResponse, unwrapTxInfo)
      .next(mockTransactionResponse)
      .call(mockTransactionResponse.wait)
      .next(mockTransactionReceipt)
      .call(finalizeTransaction, mockTransactionResponse, mockTransactionReceipt)
      .next()
      .put(fetchBalancesActions.trigger(account.address))
      .next()
      .isDone()
  })
})
