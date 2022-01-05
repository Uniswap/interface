import { Currency, CurrencyAmount, WETH9 } from '@uniswap/sdk-core'
import { Contract, providers, Signer } from 'ethers'
import { Weth } from 'src/abis/types'
import WETH_ABI from 'src/abis/weth.json'
import { getSignerManager, getWalletProviders } from 'src/app/walletContext'
import { ChainId } from 'src/constants/chains'
import { fetchBalancesActions } from 'src/features/balances/fetchBalances'
import { addTransaction, finalizeTransaction } from 'src/features/transactions/sagaHelpers'
import { TransactionType } from 'src/features/transactions/types'
import { Account, AccountType } from 'src/features/wallet/accounts/types'
import { createMonitoredSaga } from 'src/utils/saga'
import { call, put } from 'typed-redux-saga'

export enum WrapType {
  NOT_APPLICABLE,
  WRAP,
  UNWRAP,
}

export type Params = {
  account: Account
  inputCurrencyAmount: CurrencyAmount<Currency>
}

export async function getWethContract(chainId: ChainId, signer: Signer): Promise<Weth> {
  return new Contract(WETH9[chainId].address, WETH_ABI, signer) as Weth
}

export function* wrap(params: Params) {
  const { account, inputCurrencyAmount } = params

  if (account.type === AccountType.readonly) throw new Error('Account must support signing')

  const { chainId } = inputCurrencyAmount.currency

  const signerManager = yield* call(getSignerManager)
  const providerManager = yield* call(getWalletProviders)
  const signer = yield* call([signerManager, signerManager.getSignerForAccount], account)
  const provider = providerManager.getProvider(chainId)
  const connectedSigner = yield* call([signer, signer.connect], provider)

  // TODO(#303): use contract manager to cache contract
  const connectedWethContract = yield* call(getWethContract, chainId, connectedSigner)

  let transactionResponse: providers.TransactionResponse

  if (inputCurrencyAmount.currency.isNative) {
    transactionResponse = yield* call(connectedWethContract.deposit, {
      value: `0x${inputCurrencyAmount.quotient.toString(16)}`,
    })

    yield* call(addTransaction, transactionResponse, {
      type: TransactionType.WRAP,
      unwrapped: false,
      currencyAmountRaw: inputCurrencyAmount.quotient.toString(),
    })
  } else {
    transactionResponse = yield* call(
      connectedWethContract.withdraw,
      `0x${inputCurrencyAmount.quotient.toString(16)}`
    )

    yield* call(addTransaction, transactionResponse, {
      type: TransactionType.WRAP,
      unwrapped: true,
      currencyAmountRaw: inputCurrencyAmount.quotient.toString(),
    })
  }

  const transactionReceipt = yield* call(transactionResponse.wait)

  yield* call(finalizeTransaction, transactionResponse, transactionReceipt)
  yield* put(fetchBalancesActions.trigger(account.address))
}

export const {
  name: tokenWrapSagaName,
  wrappedSaga: tokenWrapSaga,
  reducer: tokenWrapReducer,
  actions: tokenWrapActions,
} = createMonitoredSaga<Params>(wrap, 'wrap')
