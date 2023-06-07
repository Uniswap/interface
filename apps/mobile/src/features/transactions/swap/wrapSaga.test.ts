import { CurrencyAmount } from '@uniswap/sdk-core'
import { testSaga } from 'redux-saga-test-plan'
import { sendTransaction } from 'src/features/transactions/sendTransaction'
import { Params, wrap } from 'src/features/transactions/swap/wrapSaga'
import { account } from 'src/test/fixtures'
import { ChainId } from 'wallet/src/constants/chains'
import { NativeCurrency } from 'wallet/src/features/tokens/NativeCurrency'
import { TransactionType, WrapTransactionInfo } from 'wallet/src/features/transactions/types'

const wrapTxInfo: WrapTransactionInfo = {
  type: TransactionType.Wrap,
  unwrapped: false,
  currencyAmountRaw: '200000',
}

const unwrapTxInfo: WrapTransactionInfo = {
  ...wrapTxInfo,
  unwrapped: true,
}

const transaction = {
  from: account.address,
  to: '0xabc',
  data: '0x01',
  chainId: ChainId.Mainnet,
}

const params: Params = {
  txId: '1',
  account,
  txRequest: transaction,
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
        options: { request: transaction },
      })
      .next()
      .isDone()
  })

  it('successfully unwraps to native eth', () => {
    const unwrapParams: Params = {
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
        options: { request: transaction },
      })
      .next()
      .isDone()
  })
})
