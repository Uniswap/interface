import { UNI_ADDRESSES } from '@uniswap/sdk-core'
import { parse } from 'qs'
import { DAI, nativeOnChain, UNI, USDC_OPTIMISM } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyField } from 'uniswap/src/types/currency'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import {
  queryParametersToCurrencyState,
  serializeSwapAddressesToURLParameters,
  serializeSwapStateToURLParameters,
} from '~/pages/Swap/Swap/state/tradeQueryParams'
import { ETH_MAINNET } from '~/test-utils/constants'

describe('tradeQueryParams', () => {
  describe('#queryParametersToCurrencyState', () => {
    test('ETH to DAI on mainnet', () => {
      expect(
        queryParametersToCurrencyState(
          parse(
            '?inputCurrency=ETH&outputCurrency=0x6b175474e89094c44da98b954eedeac495271d0f&exactAmount=20.5&exactField=output',
            { parseArrays: false, ignoreQueryPrefix: true },
          ),
        ),
      ).toEqual({
        outputCurrencyAddress: DAI.address,
        inputCurrencyAddress: 'ETH',
      })
    })

    test('ETH to UNI on optimism', () => {
      expect(
        queryParametersToCurrencyState(
          parse(
            '?inputCurrency=ETH&outputCurrency=0x6fd9d7ad17242c41f7131d257212c54a0e816691&exactAmount=20.5&exactField=output&chain=optimism',
            { parseArrays: false, ignoreQueryPrefix: true },
          ),
        ),
      ).toEqual({
        outputCurrencyAddress: '0x6fd9d7AD17242c41f7131d257212c54A0e816691',
        inputCurrencyAddress: 'ETH',
        chainId: 10,
      })
    })

    test('does not duplicate eth for invalid output token', () => {
      expect(
        queryParametersToCurrencyState(
          parse('?outputCurrency=invalid', { parseArrays: false, ignoreQueryPrefix: true }),
        ),
      ).toEqual({
        inputCurrencyAddress: undefined,
        outputCurrencyAddress: undefined,
      })
    })

    test('output ETH only', () => {
      expect(
        queryParametersToCurrencyState(
          parse('?outputCurrency=eth&value=20.5', { parseArrays: false, ignoreQueryPrefix: true }),
        ),
      ).toEqual({
        outputCurrencyAddress: 'ETH',
        inputCurrencyAddress: undefined,
        value: '20.5',
        field: undefined,
        chainId: undefined,
      })
    })

    test('output ETH only, lowercase', () => {
      expect(
        queryParametersToCurrencyState(
          parse('?outputcurrency=eth&value=20.5', { parseArrays: false, ignoreQueryPrefix: true }),
        ),
      ).toEqual({
        outputCurrencyAddress: 'ETH',
        inputCurrencyAddress: undefined,
        value: '20.5',
        field: undefined,
        chainId: undefined,
      })
    })

    test('no query parameters', () => {
      expect(queryParametersToCurrencyState(parse('', { parseArrays: false, ignoreQueryPrefix: true }))).toEqual({
        inputCurrencyAddress: undefined,
        outputCurrencyAddress: undefined,
        value: undefined,
        field: undefined,
        chainId: undefined,
        outputChainId: undefined,
      })
    })

    test('only chain parameter, no currencies', () => {
      expect(
        queryParametersToCurrencyState(parse('?chain=optimism', { parseArrays: false, ignoreQueryPrefix: true })),
      ).toEqual({
        inputCurrencyAddress: undefined,
        outputCurrencyAddress: undefined,
        value: undefined,
        field: undefined,
        chainId: UniverseChainId.Optimism,
        outputChainId: undefined,
      })
    })

    test('only outputChain parameter, no currencies', () => {
      expect(
        queryParametersToCurrencyState(parse('?outputChain=base', { parseArrays: false, ignoreQueryPrefix: true })),
      ).toEqual({
        inputCurrencyAddress: undefined,
        outputCurrencyAddress: undefined,
        value: undefined,
        field: undefined,
        chainId: undefined,
        outputChainId: UniverseChainId.Base,
      })
    })

    test('both chain and outputChain parameters, no currencies', () => {
      expect(
        queryParametersToCurrencyState(
          parse('?chain=mainnet&outputChain=optimism', { parseArrays: false, ignoreQueryPrefix: true }),
        ),
      ).toEqual({
        inputCurrencyAddress: undefined,
        outputCurrencyAddress: undefined,
        value: undefined,
        field: undefined,
        chainId: UniverseChainId.Mainnet,
        outputChainId: UniverseChainId.Optimism,
      })
    })

    test('outputChain parameter with output currency', () => {
      expect(
        queryParametersToCurrencyState(
          parse(`?outputChain=base&outputCurrency=${DAI.address}`, {
            parseArrays: false,
            ignoreQueryPrefix: true,
          }),
        ),
      ).toEqual({
        inputCurrencyAddress: undefined,
        outputCurrencyAddress: DAI.address,
        value: undefined,
        field: undefined,
        chainId: undefined,
        outputChainId: UniverseChainId.Base,
      })
    })

    test('both chain and outputChain with input and output currencies', () => {
      expect(
        queryParametersToCurrencyState(
          parse(`?chain=mainnet&outputChain=optimism&inputCurrency=ETH&outputCurrency=${USDC_OPTIMISM.address}`, {
            parseArrays: false,
            ignoreQueryPrefix: true,
          }),
        ),
      ).toEqual({
        inputCurrencyAddress: 'ETH',
        outputCurrencyAddress: USDC_OPTIMISM.address,
        value: undefined,
        field: undefined,
        chainId: UniverseChainId.Mainnet,
        outputChainId: UniverseChainId.Optimism,
      })
    })
  })

  describe('URL parameter serialization', () => {
    test('serializeSwapStateToURLParameters handles cross-chain swaps', () => {
      const result = serializeSwapStateToURLParameters({
        chainId: UniverseChainId.Mainnet,
        inputCurrency: nativeOnChain(UniverseChainId.Mainnet),
        outputCurrency: nativeOnChain(UniverseChainId.Optimism),
        typedValue: '1.0',
        independentField: CurrencyField.INPUT,
      })

      expect(result).toBe(
        `?chain=mainnet&outputChain=optimism&inputCurrency=${NATIVE_CHAIN_ID}&outputCurrency=${NATIVE_CHAIN_ID}&value=1.0&field=${CurrencyField.INPUT}`,
      )
    })

    test('serializeSwapStateToURLParameters handles token to token swaps on same chain', () => {
      const result = serializeSwapStateToURLParameters({
        chainId: UniverseChainId.Mainnet,
        inputCurrency: UNI[UniverseChainId.Mainnet],
        outputCurrency: ETH_MAINNET,
        typedValue: '100',
        independentField: CurrencyField.OUTPUT,
      })

      expect(result).toBe(
        `?chain=mainnet&inputCurrency=${UNI_ADDRESSES[UniverseChainId.Mainnet]}&outputCurrency=${NATIVE_CHAIN_ID}&value=100&field=${CurrencyField.OUTPUT}`,
      )
    })

    test('serializeSwapStateToURLParameters omits value and field when no valid input', () => {
      const result = serializeSwapStateToURLParameters({
        chainId: UniverseChainId.Mainnet,
        inputCurrency: UNI[UniverseChainId.Mainnet],
        typedValue: '',
        independentField: CurrencyField.INPUT,
      })

      expect(result).toBe(`?chain=mainnet&inputCurrency=${UNI_ADDRESSES[UniverseChainId.Mainnet]}`)
    })

    test('serializeSwapAddressesToURLParameters handles cross-chain swaps', () => {
      const result = serializeSwapAddressesToURLParameters({
        chainId: UniverseChainId.Mainnet,
        outputChainId: UniverseChainId.Optimism,
        inputTokenAddress: NATIVE_CHAIN_ID,
        outputTokenAddress: NATIVE_CHAIN_ID,
      })

      expect(result).toBe(
        `?chain=mainnet&outputChain=optimism&inputCurrency=${NATIVE_CHAIN_ID}&outputCurrency=${NATIVE_CHAIN_ID}`,
      )
    })

    test('serializeSwapAddressesToURLParameters handles token to token on same chain', () => {
      const result = serializeSwapAddressesToURLParameters({
        chainId: UniverseChainId.Mainnet,
        inputTokenAddress: UNI_ADDRESSES[UniverseChainId.Mainnet],
        outputTokenAddress: NATIVE_CHAIN_ID,
      })

      expect(result).toBe(
        `?chain=mainnet&inputCurrency=${UNI_ADDRESSES[UniverseChainId.Mainnet]}&outputCurrency=${NATIVE_CHAIN_ID}`,
      )
    })

    test('serializeSwapAddressesToURLParameters defaults to mainnet when no chainId provided', () => {
      const result = serializeSwapAddressesToURLParameters({
        inputTokenAddress: NATIVE_CHAIN_ID,
        outputTokenAddress: UNI_ADDRESSES[UniverseChainId.Mainnet],
      })

      expect(result).toBe(`?inputCurrency=${NATIVE_CHAIN_ID}&outputCurrency=${UNI_ADDRESSES[UniverseChainId.Mainnet]}`)
    })

    test('serializeSwapAddressesToURLParameters handles undefined input token', () => {
      const result = serializeSwapAddressesToURLParameters({
        chainId: UniverseChainId.Mainnet,
        outputTokenAddress: UNI_ADDRESSES[UniverseChainId.Mainnet],
      })

      expect(result).toBe(`?chain=mainnet&outputCurrency=${UNI_ADDRESSES[UniverseChainId.Mainnet]}`)
    })

    test('serializeSwapStateToURLParameters handles partial state', () => {
      const result = serializeSwapStateToURLParameters({
        chainId: UniverseChainId.Mainnet,
        inputCurrency: UNI[UniverseChainId.Mainnet],
      })

      expect(result).toBe(`?chain=mainnet&inputCurrency=${UNI_ADDRESSES[UniverseChainId.Mainnet]}`)
    })
  })
})
