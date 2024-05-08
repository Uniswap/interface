import { CurrencyAmount } from '@uniswap/sdk-core'
import { testSaga } from 'redux-saga-test-plan'
import { ChainId } from 'wallet/src/constants/chains'
import { NativeCurrency } from 'wallet/src/features/tokens/NativeCurrency'
import { sendTransaction } from 'wallet/src/features/transactions/sendTransactionSaga'
import { wrap, WrapParams } from 'wallet/src/features/transactions/swap/wrapSaga'
import { TransactionType, WrapTransactionInfo } from 'wallet/src/features/transactions/types'
import { ethersTransactionRequest, signerMnemonicAccount } from 'wallet/src/test/fixtures'

const account = signerMnemonicAccount()

const wrapTxInfo: WrapTransactionInfo = {
  type: TransactionType.Wrap,
  unwrapped: false,
  currencyAmountRaw: '200000',
}

const unwrapTxInfo: WrapTransactionInfo = {
  ...wrapTxInfo,
  unwrapped: true,
}

const txRequest = ethersTransactionRequest()

const params: WrapParams = {
  txId: '1',
  account,
  txRequest,
  inputCurrencyAmount: CurrencyAmount.fromRawAmount(
    NativeCurrency.onChain(ChainId.Mainnet),
    '200000'
  ),
}

describe(wrap, () => {
  it('successfully wrap native eth', () => {
    testSaga(wrap, params)
      .next()
      .call(sendTransaction, {
        txId: '1',
        chainId: ChainId.Mainnet,
        account: params.account,
        typeInfo: wrapTxInfo,
        options: { request: txRequest },
      })
      .next()
      .isDone()
  })

  it('successfully unwraps to native eth', () => {
    const unwrapParams: WrapParams = {
      ...params,
      inputCurrencyAmount: CurrencyAmount.fromRawAmount(
        NativeCurrency.onChain(ChainId.Mainnet).wrapped,
        '200000'
      ),
    }
    testSaga(wrap, unwrapParams)
      .next()
      .call(sendTransaction, {
        txId: '1',
        chainId: ChainId.Mainnet,
        account: params.account,
        typeInfo: unwrapTxInfo,
        options: { request: txRequest },
      })
      .next()
      .isDone()
  })
})
