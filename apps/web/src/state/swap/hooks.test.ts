import { UNI_ADDRESSES } from '@uniswap/sdk-core'
import { Field } from 'components/swap/constants'
import { MATIC_POLYGON, UNI } from 'constants/tokens'
import { parse } from 'qs'
import { queryParametersToCurrencyState, useInitialCurrencyState } from 'state/swap/hooks'
import { queryParametersToSwapState } from 'state/swap/types'
import { ETH_MAINNET } from 'test-utils/constants'
import { mocked } from 'test-utils/mocked'
import { renderHook, waitFor } from 'test-utils/render'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { UniverseChainId } from 'uniswap/src/types/chains'

jest.mock('uniswap/src/features/gating/hooks', () => {
  return {
    useFeatureFlag: jest.fn(),
  }
})

describe('hooks', () => {
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
        outputCurrencyId: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        inputCurrencyId: 'ETH',
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
        outputCurrencyId: '0x6fd9d7AD17242c41f7131d257212c54A0e816691',
        inputCurrencyId: 'ETH',
        chainId: 10,
      })
    })

    test('does not duplicate eth for invalid output token', () => {
      expect(
        queryParametersToCurrencyState(
          parse('?outputCurrency=invalid', { parseArrays: false, ignoreQueryPrefix: true }),
        ),
      ).toEqual({
        inputCurrencyId: undefined,
        outputCurrencyId: undefined,
      })
    })

    test('output ETH only', () => {
      expect(
        queryParametersToCurrencyState(
          parse('?outputCurrency=eth&exactAmount=20.5', { parseArrays: false, ignoreQueryPrefix: true }),
        ),
      ).toEqual({
        outputCurrencyId: 'ETH',
        inputCurrencyId: undefined,
      })
    })

    test('output ETH only, lowercase', () => {
      expect(
        queryParametersToCurrencyState(
          parse('?outputcurrency=eth&exactAmount=20.5', { parseArrays: false, ignoreQueryPrefix: true }),
        ),
      ).toEqual({
        outputCurrencyId: 'ETH',
        inputCurrencyId: undefined,
      })
    })
  })

  describe('#queryParametersToSwapState', () => {
    test('currency amounts', () => {
      expect(
        queryParametersToSwapState(
          parse('?exactAmount=20.5&exactField=output', { parseArrays: false, ignoreQueryPrefix: true }),
        ),
      ).toEqual({
        typedValue: '20.5',
        independentField: Field.OUTPUT,
      })
    })
  })

  describe('#useInitialCurrencyState', () => {
    mocked(useFeatureFlag).mockImplementation((f) => f === FeatureFlags.MultichainUX)

    describe('Disconnected wallet', () => {
      test('optimism output UNI', () => {
        jest.mock('hooks/useParsedQueryString', () => ({
          useParsedQueryString: () => ({
            inputCurrency: undefined,
            outputCurrency: UNI_ADDRESSES[UniverseChainId.Optimism],
            chainId: 10,
          }),
        }))

        const {
          result: {
            current: { initialInputCurrency, initialOutputCurrency, initialChainId },
          },
        } = renderHook(() => useInitialCurrencyState())

        waitFor(() => {
          expect(initialInputCurrency).toEqual(undefined)
          expect(initialOutputCurrency?.symbol).toEqual('UNI')
          expect(initialChainId).toEqual(10)
        })
      })

      test('optimism input ETH, output UNI', () => {
        jest.mock('hooks/useParsedQueryString', () => ({
          useParsedQueryString: () => ({
            inputCurrency: 'ETH',
            outputCurrency: UNI_ADDRESSES[UniverseChainId.Optimism],
            chainId: 10,
          }),
        }))

        const {
          result: {
            current: { initialInputCurrency, initialOutputCurrency, initialChainId },
          },
        } = renderHook(() => useInitialCurrencyState())

        waitFor(() => {
          expect(initialInputCurrency?.isNative).toEqual(true)
          expect(initialOutputCurrency?.symbol).toEqual('UNI')
          expect(initialChainId).toEqual(10)
        })
      })

      test('empty query should default to ETH mainnet', () => {
        jest.mock('hooks/useParsedQueryString', () => ({
          useParsedQueryString: () => ({
            inputCurrency: undefined,
            outputCurrency: undefined,
            chainId: undefined,
          }),
        }))

        const {
          result: {
            current: { initialInputCurrency, initialOutputCurrency, initialChainId },
          },
        } = renderHook(() => useInitialCurrencyState())

        waitFor(() => {
          expect(initialInputCurrency?.isNative).toEqual(true)
          expect(initialOutputCurrency).not.toBeDefined()
          expect(initialChainId).toEqual(1)
        })
      })
    })

    describe('Connected wallet with balance', () => {
      jest.mock('graphql/data/apollo/TokenBalancesProvider', () => ({
        useTokenBalancesQuery: () => ({
          data: {
            portfolios: [
              {
                tokenBalances: [
                  {
                    token: MATIC_POLYGON,
                    denominatedValue: {
                      value: 1000,
                    },
                  },
                  {
                    token: ETH_MAINNET,
                    denominatedValue: {
                      value: 800,
                    },
                  },
                  {
                    token: UNI[UniverseChainId.Optimism],
                    denominatedValue: {
                      value: 500,
                    },
                  },
                ],
              },
            ],
          },
        }),
      }))

      test('optimism output UNI', () => {
        jest.mock('hooks/useParsedQueryString', () => ({
          useParsedQueryString: () => ({
            inputCurrency: undefined,
            outputCurrency: UNI_ADDRESSES[UniverseChainId.Optimism],
            chainId: 10,
          }),
        }))

        const {
          result: {
            current: { initialInputCurrency, initialOutputCurrency, initialChainId },
          },
        } = renderHook(() => useInitialCurrencyState())

        waitFor(() => {
          expect(initialInputCurrency).toEqual(undefined)
          expect(initialOutputCurrency?.symbol).toEqual('UNI')
          expect(initialChainId).toEqual(10)
        })
      })

      test('mainnet', () => {
        jest.mock('hooks/useParsedQueryString', () => ({
          useParsedQueryString: () => ({
            inputCurrency: undefined,
            outputCurrency: undefined,
            chainId: 1,
          }),
        }))

        const {
          result: {
            current: { initialInputCurrency, initialOutputCurrency, initialChainId },
          },
        } = renderHook(() => useInitialCurrencyState())

        waitFor(() => {
          expect(initialInputCurrency?.isNative).toEqual(true)
          expect(initialOutputCurrency).not.toBeDefined()
          expect(initialChainId).toEqual(1)
        })
      })

      test('optimism input ETH, output UNI', () => {
        jest.mock('hooks/useParsedQueryString', () => ({
          useParsedQueryString: () => ({
            inputCurrency: 'ETH',
            outputCurrency: UNI_ADDRESSES[UniverseChainId.Optimism],
            chainId: 10,
          }),
        }))

        const {
          result: {
            current: { initialInputCurrency, initialOutputCurrency, initialChainId },
          },
        } = renderHook(() => useInitialCurrencyState())

        waitFor(() => {
          expect(initialInputCurrency?.isNative).toEqual(true)
          expect(initialOutputCurrency?.symbol).toEqual('UNI')
          expect(initialChainId).toEqual(10)
        })
      })

      test('empty query should show highest balance native token', () => {
        jest.mock('hooks/useParsedQueryString', () => ({
          useParsedQueryString: () => ({
            inputCurrency: undefined,
            outputCurrency: undefined,
            chainId: undefined,
          }),
        }))

        const {
          result: {
            current: { initialInputCurrency, initialOutputCurrency, initialChainId },
          },
        } = renderHook(() => useInitialCurrencyState())

        waitFor(() => {
          expect(initialInputCurrency?.isNative).toEqual(true)
          expect(initialOutputCurrency).not.toBeDefined()
          expect(initialChainId).toEqual(137)
        })
      })
    })
  })
})
