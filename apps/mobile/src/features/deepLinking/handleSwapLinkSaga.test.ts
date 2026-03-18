import { URL } from 'react-native-url-polyfill'
import { expectSaga } from 'redux-saga-test-plan'
import { navigate } from 'src/app/navigation/rootNavigation'
import { handleSwapLink } from 'src/features/deepLinking/handleSwapLinkSaga'
import { parseSwapLinkMobileFormatOrThrow } from 'src/features/deepLinking/parseSwapLink'
import { DAI, UNI, USDC_UNICHAIN_SEPOLIA } from 'uniswap/src/constants/tokens'
import { AssetType } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { signerMnemonicAccount } from 'wallet/src/test/fixtures'

jest.mock('src/app/navigation/rootNavigation', () => ({
  navigate: jest.fn(),
}))

jest.mock('uniswap/src/features/settings/saga', () => ({
  *getEnabledChainIdsSaga(
    _platform?: Platform,
  ): Generator<undefined, { isTestnetModeEnabled: boolean; chains: never[]; defaultChainId: number }> {
    yield
    return {
      isTestnetModeEnabled: false,
      chains: [],
      defaultChainId: 1,
    }
  },
}))

const account = signerMnemonicAccount()

function formSwapUrl({
  userAddress,
  chain,
  inputAddress,
  outputAddress,
  currencyField,
  amount,
}: {
  userAddress?: Address
  chain?: UniverseChainId | number
  inputAddress?: string
  outputAddress?: string
  currencyField?: string
  amount?: string
}): URL {
  return new URL(
    `https://uniswap.org/app?screen=swap
&userAddress=${userAddress}
&inputCurrencyId=${chain}-${inputAddress}
&outputCurrencyId=${chain}-${outputAddress}
&currencyField=${currencyField}
&amount=${amount}`.trim(),
  )
}

const swapUrl = formSwapUrl({
  userAddress: account.address,
  chain: UniverseChainId.Mainnet,
  inputAddress: DAI.address,
  outputAddress: UNI[UniverseChainId.Mainnet].address,
  currencyField: 'input',
  amount: '100',
})

const testnetSwapUrl = formSwapUrl({
  userAddress: account.address,
  chain: UniverseChainId.Sepolia,
  inputAddress: USDC_UNICHAIN_SEPOLIA.address,
  outputAddress: UNI[UniverseChainId.Sepolia].address,
  currencyField: 'input',
  amount: '100',
})

const invalidOutputCurrencySwapUrl = formSwapUrl({
  userAddress: account.address,
  chain: UniverseChainId.Mainnet,
  inputAddress: DAI.address,
  outputAddress: undefined,
  currencyField: 'input',
  amount: '100',
})

const invalidInputTokenSwapURl = formSwapUrl({
  userAddress: account.address,
  chain: UniverseChainId.Mainnet,
  inputAddress: '0x00',
  outputAddress: UNI[UniverseChainId.Mainnet].address,
  currencyField: 'input',
  amount: '100',
})

const invalidChainSwapUrl = formSwapUrl({
  userAddress: account.address,
  chain: 23,
  inputAddress: DAI.address,
  outputAddress: UNI[UniverseChainId.Mainnet].address,
  currencyField: 'input',
  amount: '100',
})

const invalidAmountSwapUrl = formSwapUrl({
  userAddress: account.address,
  chain: UniverseChainId.Mainnet,
  inputAddress: DAI.address,
  outputAddress: UNI[UniverseChainId.Mainnet].address,
  currencyField: 'input',
  amount: 'not a number',
})

const invalidCurrencyFieldSwapUrl = formSwapUrl({
  userAddress: account.address,
  chain: UniverseChainId.Mainnet,
  inputAddress: DAI.address,
  outputAddress: UNI[UniverseChainId.Mainnet].address,
  currencyField: 'token1',
  amount: '100',
})

describe(handleSwapLink, () => {
  const mockNavigate = navigate as jest.MockedFunction<typeof navigate>

  beforeEach(() => {
    mockNavigate.mockClear()
  })

  describe('valid inputs', () => {
    it('Navigates to the swap screen with all params if all inputs are valid; testnet mode aligned', async () => {
      await expectSaga(handleSwapLink, swapUrl, parseSwapLinkMobileFormatOrThrow).silentRun()
      expect(mockNavigate).toHaveBeenCalledWith(
        ModalName.Swap,
        expect.objectContaining({
          input: {
            address: DAI.address,
            chainId: UniverseChainId.Mainnet,
            type: AssetType.Currency,
          },
          output: {
            address: UNI[UniverseChainId.Mainnet].address,
            chainId: UniverseChainId.Mainnet,
            type: AssetType.Currency,
          },
          exactCurrencyField: 'input',
          exactAmountToken: '100',
        }),
      )
    })
    it('Navigates to the swap screen with all params if all inputs are valid; testnet mode not aligned', async () => {
      await expectSaga(handleSwapLink, testnetSwapUrl, parseSwapLinkMobileFormatOrThrow).silentRun()
      expect(mockNavigate).toHaveBeenCalledWith(
        ModalName.Swap,
        expect.objectContaining({
          input: {
            address: USDC_UNICHAIN_SEPOLIA.address,
            chainId: UniverseChainId.Sepolia,
            type: AssetType.Currency,
          },
          output: {
            address: UNI[UniverseChainId.Sepolia].address,
            chainId: UniverseChainId.Sepolia,
            type: AssetType.Currency,
          },
          exactCurrencyField: 'input',
          exactAmountToken: '100',
        }),
      )
    })
  })

  describe('invalid inputs', () => {
    beforeAll(() => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined)
    })

    it('Navigates to an empty swap screen if outputCurrency is invalid', async () => {
      await expectSaga(handleSwapLink, invalidOutputCurrencySwapUrl, parseSwapLinkMobileFormatOrThrow).silentRun()
      expect(mockNavigate).toHaveBeenCalledWith(ModalName.Swap)
    })

    it('Navigates to an empty swap screen if inputToken is invalid', async () => {
      await expectSaga(handleSwapLink, invalidInputTokenSwapURl, parseSwapLinkMobileFormatOrThrow).silentRun()
      expect(mockNavigate).toHaveBeenCalledWith(ModalName.Swap)
    })

    it('Navigates to an empty swap screen if the chain is not supported', async () => {
      await expectSaga(handleSwapLink, invalidChainSwapUrl, parseSwapLinkMobileFormatOrThrow).silentRun()
      expect(mockNavigate).toHaveBeenCalledWith(ModalName.Swap)
    })

    it('Navigates to an empty swap screen if the swap amount is invalid', async () => {
      await expectSaga(handleSwapLink, invalidAmountSwapUrl, parseSwapLinkMobileFormatOrThrow).silentRun()
      expect(mockNavigate).toHaveBeenCalledWith(ModalName.Swap)
    })

    it('Navigates to an empty swap screen if currency field is invalid', async () => {
      await expectSaga(handleSwapLink, invalidCurrencyFieldSwapUrl, parseSwapLinkMobileFormatOrThrow).silentRun()
      expect(mockNavigate).toHaveBeenCalledWith(ModalName.Swap)
    })
  })
})
