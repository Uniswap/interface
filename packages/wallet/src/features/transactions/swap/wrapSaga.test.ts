import { CurrencyAmount } from '@uniswap/sdk-core'
import { testSaga } from 'redux-saga-test-plan'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/types'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import {
  TransactionOriginType,
  TransactionType,
  WrapTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { ethersTransactionRequest } from 'uniswap/src/test/fixtures'
import { sendTransaction } from 'wallet/src/features/transactions/sendTransactionSaga'
import { WrapParams, wrap } from 'wallet/src/features/transactions/swap/wrapSaga'
import { signerMnemonicAccount } from 'wallet/src/test/fixtures'

const account = signerMnemonicAccount()

const wrapTxInfo: WrapTransactionInfo = {
  type: TransactionType.Wrap,
  unwrapped: false,
  currencyAmountRaw: '200000',
  swapTxId: undefined,
  gasEstimates: undefined,
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
  inputCurrencyAmount: CurrencyAmount.fromRawAmount(NativeCurrency.onChain(UniverseChainId.Mainnet), '200000'),
}

describe(wrap, () => {
  it('successfully wrap native eth', () => {
    testSaga(wrap, params)
      .next()
      .call(sendTransaction, {
        txId: '1',
        transactionOriginType: TransactionOriginType.Internal,
        chainId: UniverseChainId.Mainnet,
        account: params.account,
        typeInfo: wrapTxInfo,
        options: { request: txRequest },
      })
      .next()
      .put(pushNotification({ type: AppNotificationType.SwapPending, wrapType: WrapType.Wrap }))
      .next()
      .isDone()
  })

  it('successfully unwraps to native eth', () => {
    const unwrapParams: WrapParams = {
      ...params,
      inputCurrencyAmount: CurrencyAmount.fromRawAmount(
        NativeCurrency.onChain(UniverseChainId.Mainnet).wrapped,
        '200000',
      ),
    }
    testSaga(wrap, unwrapParams)
      .next()
      .call(sendTransaction, {
        txId: '1',
        transactionOriginType: TransactionOriginType.Internal,
        chainId: UniverseChainId.Mainnet,
        account: params.account,
        typeInfo: unwrapTxInfo,
        options: { request: txRequest },
      })
      .next()
      .put(pushNotification({ type: AppNotificationType.SwapPending, wrapType: WrapType.Unwrap }))
      .next()
      .isDone()
  })
})
