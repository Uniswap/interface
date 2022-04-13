import { call } from '@redux-saga/core/effects'
import { URL } from 'react-native-url-polyfill'
import { expectSaga } from 'redux-saga-test-plan'
import { navigate } from 'src/app/navigation/rootNavigation'
import { ChainId } from 'src/constants/chains'
import { DAI, UNI } from 'src/constants/tokens'
import { AssetType } from 'src/entities/assets'
import { handleSwapLink, parseAndValidateSwapParams } from 'src/features/deepLinking/handleSwapLink'
import {
  CurrencyField,
  TransactionState,
} from 'src/features/transactions/transactionState/transactionState'
import { Screens } from 'src/screens/Screens'
import { account } from 'src/test/fixtures'

const formSwapUrl = (
  userAddress?: Address,
  chain?: ChainId | number,
  inputAddress?: string,
  outputAddress?: string,
  currencyField?: string,
  amount?: string
) =>
  new URL(
    `uniswap://?screen=swap
&userAddress=${userAddress}
&inputCurrency=${chain}-${inputAddress}
&outputCurrency=${chain}-${outputAddress}
&currencyField=${currencyField}
&amount=${amount}`.trim()
  )

const formTransactionState = (
  chain?: ChainId,
  inputAddress?: string,
  outputAddress?: string,
  currencyField?: string,
  amount?: string
) => ({
  [CurrencyField.INPUT]: {
    address: inputAddress,
    chainId: chain,
    type: AssetType.Currency,
  },
  [CurrencyField.OUTPUT]: {
    address: outputAddress,
    chainId: chain,
    type: AssetType.Currency,
  },
  exactCurrencyField: !currencyField
    ? currencyField
    : currencyField.toLowerCase() === 'output'
    ? CurrencyField.OUTPUT
    : CurrencyField.INPUT,
  exactAmount: amount,
})

const swapUrl = formSwapUrl(
  account.address,
  ChainId.Mainnet,
  DAI.address,
  UNI[ChainId.Mainnet].address,
  'input',
  '100'
)

const invalidOutputCurrencySwapUrl = formSwapUrl(
  account.address,
  ChainId.Mainnet,
  DAI.address,
  undefined,
  'input',
  '100'
)

const invalidInputTokenSwapURl = formSwapUrl(
  account.address,
  ChainId.Mainnet,
  '0x00',
  UNI[ChainId.Mainnet].address,
  'input',
  '100'
)

const invalidChainSwapUrl = formSwapUrl(
  account.address,
  23,
  DAI.address,
  UNI[ChainId.Mainnet].address,
  'input',
  '100'
)

const invalidAmountSwapUrl = formSwapUrl(
  account.address,
  ChainId.Mainnet,
  DAI.address,
  UNI[ChainId.Mainnet].address,
  'input',
  'not a number'
)

const invalidCurrencyFieldSwapUrl = formSwapUrl(
  account.address,
  ChainId.Mainnet,
  DAI.address,
  UNI[ChainId.Mainnet].address,
  'token1',
  '100'
)

const swapFormState = formTransactionState(
  ChainId.Mainnet,
  DAI.address,
  UNI[ChainId.Mainnet].address,
  'input',
  '100'
) as TransactionState

describe(handleSwapLink, () => {
  it('Navigates to the swap screen with all params if all inputs are valid', () => {
    return expectSaga(handleSwapLink, swapUrl)
      .provide([[call(navigate, Screens.Swap, { swapFormState }), undefined]])
      .call(parseAndValidateSwapParams, swapUrl)
      .silentRun()
  })

  it('Navigates to an empty swap screen if outputCurrency is invalid', () => {
    return expectSaga(handleSwapLink, invalidOutputCurrencySwapUrl)
      .provide([[call(navigate, Screens.Swap), undefined]])
      .call(parseAndValidateSwapParams, invalidOutputCurrencySwapUrl)
      .silentRun()
  })

  it('Navigates to an empty swap screen if inputToken is invalid', () => {
    return expectSaga(handleSwapLink, invalidInputTokenSwapURl)
      .provide([[call(navigate, Screens.Swap), undefined]])
      .call(parseAndValidateSwapParams, invalidInputTokenSwapURl)
      .silentRun()
  })

  it('Navigates to an empty swap screen if the chain is not supported', () => {
    return expectSaga(handleSwapLink, invalidChainSwapUrl)
      .provide([[call(navigate, Screens.Swap), undefined]])
      .call(parseAndValidateSwapParams, invalidChainSwapUrl)
      .silentRun()
  })

  it('Navigates to an empty swap screen if the swap amount is invalid', () => {
    return expectSaga(handleSwapLink, invalidAmountSwapUrl)
      .provide([[call(navigate, Screens.Swap), undefined]])
      .call(parseAndValidateSwapParams, invalidAmountSwapUrl)
      .silentRun()
  })

  it('Navigates to an empty swap screen if currency field is invalid', () => {
    return expectSaga(handleSwapLink, invalidCurrencyFieldSwapUrl)
      .provide([[call(navigate, Screens.Swap), undefined]])
      .call(parseAndValidateSwapParams, invalidCurrencyFieldSwapUrl)
      .silentRun()
  })
})
