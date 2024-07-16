import { URL } from 'react-native-url-polyfill'
import { expectSaga } from 'redux-saga-test-plan'
import { handleSwapLink } from 'src/features/deepLinking/handleSwapLinkSaga'
import { openModal } from 'src/features/modals/modalSlice'
import { DAI, UNI } from 'uniswap/src/constants/tokens'
import { AssetType } from 'uniswap/src/entities/assets'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { CurrencyField, TransactionState } from 'uniswap/src/features/transactions/transactionState/types'
import { UniverseChainId, WalletChainId } from 'uniswap/src/types/chains'
import { signerMnemonicAccount } from 'wallet/src/test/fixtures'

const account = signerMnemonicAccount()

const formSwapUrl = (
  userAddress?: Address,
  chain?: WalletChainId | number,
  inputAddress?: string,
  outputAddress?: string,
  currencyField?: string,
  amount?: string,
): URL =>
  new URL(
    `https://uniswap.org/app?screen=swap
&userAddress=${userAddress}
&inputCurrencyId=${chain}-${inputAddress}
&outputCurrencyId=${chain}-${outputAddress}
&currencyField=${currencyField}
&amount=${amount}`.trim(),
  )

const formTransactionState = (
  chain?: WalletChainId,
  inputAddress?: string,
  outputAddress?: string,
  currencyField?: string,
  amount?: string,
): {
  input: {
    address: string | undefined
    chainId: WalletChainId | undefined
    type: AssetType
  }
  output: {
    address: string | undefined
    chainId: WalletChainId | undefined
    type: AssetType
  }
  exactCurrencyField: string | undefined
  exactAmountToken: string | undefined
} => ({
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
  exactAmountToken: amount,
})

const swapUrl = formSwapUrl(
  account.address,
  UniverseChainId.Mainnet,
  DAI.address,
  UNI[UniverseChainId.Mainnet].address,
  'input',
  '100',
)

const invalidOutputCurrencySwapUrl = formSwapUrl(
  account.address,
  UniverseChainId.Mainnet,
  DAI.address,
  undefined,
  'input',
  '100',
)

const invalidInputTokenSwapURl = formSwapUrl(
  account.address,
  UniverseChainId.Mainnet,
  '0x00',
  UNI[UniverseChainId.Mainnet].address,
  'input',
  '100',
)

const invalidChainSwapUrl = formSwapUrl(
  account.address,
  23,
  DAI.address,
  UNI[UniverseChainId.Mainnet].address,
  'input',
  '100',
)

const invalidAmountSwapUrl = formSwapUrl(
  account.address,
  UniverseChainId.Mainnet,
  DAI.address,
  UNI[UniverseChainId.Mainnet].address,
  'input',
  'not a number',
)

const invalidCurrencyFieldSwapUrl = formSwapUrl(
  account.address,
  UniverseChainId.Mainnet,
  DAI.address,
  UNI[UniverseChainId.Mainnet].address,
  'token1',
  '100',
)

const swapFormState = formTransactionState(
  UniverseChainId.Mainnet,
  DAI.address,
  UNI[UniverseChainId.Mainnet].address,
  'input',
  '100',
) as TransactionState

describe(handleSwapLink, () => {
  describe('valid inputs', () => {
    it('Navigates to the swap screen with all params if all inputs are valid', () => {
      return expectSaga(handleSwapLink, swapUrl)
        .put(openModal({ name: ModalName.Swap, initialState: swapFormState }))
        .silentRun()
    })
  })

  describe('invalid inputs', () => {
    beforeAll(() => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined)
    })

    it('Navigates to an empty swap screen if outputCurrency is invalid', () => {
      return expectSaga(handleSwapLink, invalidOutputCurrencySwapUrl)
        .put(openModal({ name: ModalName.Swap }))
        .silentRun()
    })

    it('Navigates to an empty swap screen if inputToken is invalid', () => {
      return expectSaga(handleSwapLink, invalidInputTokenSwapURl)
        .put(openModal({ name: ModalName.Swap }))
        .silentRun()
    })

    it('Navigates to an empty swap screen if the chain is not supported', () => {
      return expectSaga(handleSwapLink, invalidChainSwapUrl)
        .put(openModal({ name: ModalName.Swap }))
        .silentRun()
    })

    it('Navigates to an empty swap screen if the swap amount is invalid', () => {
      return expectSaga(handleSwapLink, invalidAmountSwapUrl)
        .put(openModal({ name: ModalName.Swap }))
        .silentRun()
    })

    it('Navigates to an empty swap screen if currency field is invalid', () => {
      return expectSaga(handleSwapLink, invalidCurrencyFieldSwapUrl)
        .put(openModal({ name: ModalName.Swap }))
        .silentRun()
    })
  })
})
