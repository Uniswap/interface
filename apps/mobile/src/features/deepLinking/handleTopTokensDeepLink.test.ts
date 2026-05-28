import { NavigationContainerRef } from '@react-navigation/native'
import { expectSaga } from 'redux-saga-test-plan'
import { exploreNavigationRef } from 'src/app/navigation/navigationRef'
import { navigate } from 'src/app/navigation/rootNavigation'
import { ExploreStackParamList } from 'src/app/navigation/types'
import { handleTopTokensDeepLink } from 'src/features/deepLinking/handleTopTokensDeepLink'
import { dismissAllModalsBeforeNavigation } from 'src/features/deepLinking/utils'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { logger } from 'utilities/src/logger/logger'

// Mock the navigation ref
jest.mock('src/app/navigation/navigationRef', () => ({
  exploreNavigationRef: {
    current: null,
  },
}))

// Mock the logger
jest.mock('utilities/src/logger/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}))

// Mock the dismissAllModalsBeforeNavigation function
jest.mock('src/features/deepLinking/utils', () => ({
  dismissAllModalsBeforeNavigation: jest.fn(),
}))

describe('handleTopTokensDeepLink', () => {
  const unichainExploreUrl = 'https://app.uniswap.org/explore/tokens/unichain'
  const unichainChainId = UniverseChainId.Unichain

  const mockedExploreNavigationRef = exploreNavigationRef as jest.Mocked<typeof exploreNavigationRef>
  const mockedLogger = logger as jest.Mocked<typeof logger>

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset navigation ref state
    mockedExploreNavigationRef.current = null
  })

  it('should navigate to explore modal with deep link parameters', () => {
    return expectSaga(handleTopTokensDeepLink, { chainId: unichainChainId, url: unichainExploreUrl })
      .call(dismissAllModalsBeforeNavigation)
      .call(navigate, ModalName.Explore, {
        screen: MobileScreens.Explore,
        params: {
          showFavorites: false,
          orderByMetric: undefined,
          chainId: unichainChainId,
        },
      })
      .run()
  })

  it('should handle valid metric parameter in URL', () => {
    const urlWithMetric = 'https://app.uniswap.org/explore/tokens/unichain?metric=volume'
    return expectSaga(handleTopTokensDeepLink, { chainId: unichainChainId, url: urlWithMetric })
      .call(dismissAllModalsBeforeNavigation)
      .call(navigate, ModalName.Explore, {
        screen: MobileScreens.Explore,
        params: {
          showFavorites: false,
          orderByMetric: 'VOLUME',
          chainId: unichainChainId,
        },
      })
      .run()
  })

  it('should navigate to explore modal without chainId', () => {
    const urlWithoutChainId = 'https://app.uniswap.org/explore/tokens'
    return expectSaga(handleTopTokensDeepLink, { chainId: undefined, url: urlWithoutChainId })
      .call(dismissAllModalsBeforeNavigation)
      .call(navigate, ModalName.Explore, {
        screen: MobileScreens.Explore,
        params: {
          showFavorites: false,
          orderByMetric: undefined,
          chainId: undefined,
        },
      })
      .run()
  })

  it('should handle metric parameter in URL without chainId', () => {
    const urlWithMetricNoChainId = 'https://app.uniswap.org/explore/tokens?metric=market_cap'
    return expectSaga(handleTopTokensDeepLink, { chainId: undefined, url: urlWithMetricNoChainId })
      .call(dismissAllModalsBeforeNavigation)
      .call(navigate, ModalName.Explore, {
        screen: MobileScreens.Explore,
        params: {
          showFavorites: false,
          orderByMetric: 'MARKET_CAP',
          chainId: undefined,
        },
      })
      .run()
  })

  it('should use exploreNavigationRef when it is focused', async () => {
    // Setup the navigation ref to be focused
    const mockNavigate = jest.fn()
    const mockIsFocused = jest.fn().mockReturnValue(true)
    mockedExploreNavigationRef.current = {
      isFocused: mockIsFocused,
      navigate: mockNavigate,
    } as unknown as NavigationContainerRef<ExploreStackParamList>

    const urlWithMetric = 'https://app.uniswap.org/explore/tokens/unichain?metric=volume'

    await expectSaga(handleTopTokensDeepLink, { chainId: unichainChainId, url: urlWithMetric })
      .not.call(dismissAllModalsBeforeNavigation)
      .not.call(navigate, ModalName.Explore, expect.anything())
      .run()

    // Verify that the navigation ref's navigate method was called with correct parameters
    expect(mockNavigate).toHaveBeenCalledWith(MobileScreens.Explore, {
      showFavorites: false,
      orderByMetric: 'VOLUME',
      chainId: unichainChainId,
    })
  })

  describe('error handling', () => {
    it('should continue execution when navigation throws error and log it', async () => {
      // Mock navigate to throw an error
      const navigateError = new Error('Navigation failed')

      await expectSaga(handleTopTokensDeepLink, { chainId: unichainChainId, url: unichainExploreUrl })
        .provide({
          call: (effect, next) => {
            if (effect.fn === navigate) {
              throw navigateError
            }
            return next()
          },
        })
        .call(dismissAllModalsBeforeNavigation)
        .call(mockedLogger.error, navigateError, {
          tags: { file: 'handleDeepLinkSaga', function: 'handleTopTokensDeepLink' },
          extra: { chainId: unichainChainId, url: unichainExploreUrl },
        })
        .run({ silenceTimeout: true })
    })

    it('should continue execution when exploreNavigationRef.navigate throws error and log it', async () => {
      // Setup the navigation ref to be focused and throw an error
      const navError = new Error('Navigation ref failed')
      const mockNavigate = jest.fn().mockImplementation(() => {
        throw navError
      })
      const mockIsFocused = jest.fn().mockReturnValue(true)
      mockedExploreNavigationRef.current = {
        isFocused: mockIsFocused,
        navigate: mockNavigate,
      } as unknown as NavigationContainerRef<ExploreStackParamList>

      await expectSaga(handleTopTokensDeepLink, { chainId: unichainChainId, url: unichainExploreUrl })
        .not.call(dismissAllModalsBeforeNavigation)
        .call(mockedLogger.error, navError, {
          tags: { file: 'handleDeepLinkSaga', function: 'handleTopTokensDeepLink' },
          extra: { chainId: unichainChainId, url: unichainExploreUrl },
        })
        .run({ silenceTimeout: true })
    })
  })

  describe('metric validation', () => {
    it('should handle invalid metric values and set orderByMetric to undefined', () => {
      const urlWithInvalidMetric = 'https://app.uniswap.org/explore/tokens/unichain?metric=invalid_metric'
      return expectSaga(handleTopTokensDeepLink, { chainId: unichainChainId, url: urlWithInvalidMetric })
        .call(dismissAllModalsBeforeNavigation)
        .call(navigate, ModalName.Explore, {
          screen: MobileScreens.Explore,
          params: {
            showFavorites: false,
            orderByMetric: undefined,
            chainId: unichainChainId,
          },
        })
        .run()
    })

    it('should handle empty metric parameter and set orderByMetric to undefined', () => {
      const urlWithEmptyMetric = 'https://app.uniswap.org/explore/tokens/unichain?metric='
      return expectSaga(handleTopTokensDeepLink, { chainId: unichainChainId, url: urlWithEmptyMetric })
        .call(dismissAllModalsBeforeNavigation)
        .call(navigate, ModalName.Explore, {
          screen: MobileScreens.Explore,
          params: {
            showFavorites: false,
            orderByMetric: undefined,
            chainId: unichainChainId,
          },
        })
        .run()
    })

    it('should handle case-insensitive valid metrics', () => {
      const testCases = [
        {
          url: 'https://app.uniswap.org/explore/tokens/unichain?metric=total_value_locked',
          expected: 'TOTAL_VALUE_LOCKED',
        },
        { url: 'https://app.uniswap.org/explore/tokens/unichain?metric=market_cap', expected: 'MARKET_CAP' },
        {
          url: 'https://app.uniswap.org/explore/tokens/unichain?metric=price_percent_change_1_day_asc',
          expected: 'PRICE_PERCENT_CHANGE_1_DAY_ASC',
        },
        {
          url: 'https://app.uniswap.org/explore/tokens/unichain?metric=price_percent_change_1_day_desc',
          expected: 'PRICE_PERCENT_CHANGE_1_DAY_DESC',
        },
      ]

      return Promise.all(
        testCases.map(({ url, expected }) =>
          expectSaga(handleTopTokensDeepLink, { chainId: unichainChainId, url })
            .call(dismissAllModalsBeforeNavigation)
            .call(navigate, ModalName.Explore, {
              screen: MobileScreens.Explore,
              params: {
                showFavorites: false,
                orderByMetric: expected,
                chainId: unichainChainId,
              },
            })
            .run(),
        ),
      )
    })

    it('should reject TRENDING metric (excluded CustomRankingType)', () => {
      const urlWithTrendingMetric = 'https://app.uniswap.org/explore/tokens/unichain?metric=trending'
      return expectSaga(handleTopTokensDeepLink, { chainId: unichainChainId, url: urlWithTrendingMetric })
        .call(dismissAllModalsBeforeNavigation)
        .call(navigate, ModalName.Explore, {
          screen: MobileScreens.Explore,
          params: {
            showFavorites: false,
            orderByMetric: undefined,
            chainId: unichainChainId,
          },
        })
        .run()
    })

    it('should handle mixed case metrics correctly', () => {
      const urlWithMixedCaseMetric = 'https://app.uniswap.org/explore/tokens/unichain?metric=VoLuMe'
      return expectSaga(handleTopTokensDeepLink, { chainId: unichainChainId, url: urlWithMixedCaseMetric })
        .call(dismissAllModalsBeforeNavigation)
        .call(navigate, ModalName.Explore, {
          screen: MobileScreens.Explore,
          params: {
            showFavorites: false,
            orderByMetric: 'VOLUME',
            chainId: unichainChainId,
          },
        })
        .run()
    })

    it('should handle numeric metric values as invalid', () => {
      const urlWithNumericMetric = 'https://app.uniswap.org/explore/tokens/unichain?metric=123'
      return expectSaga(handleTopTokensDeepLink, { chainId: unichainChainId, url: urlWithNumericMetric })
        .call(dismissAllModalsBeforeNavigation)
        .call(navigate, ModalName.Explore, {
          screen: MobileScreens.Explore,
          params: {
            showFavorites: false,
            orderByMetric: undefined,
            chainId: unichainChainId,
          },
        })
        .run()
    })

    it('should handle special characters in metric as invalid', () => {
      const urlWithSpecialCharsMetric = 'https://app.uniswap.org/explore/tokens/unichain?metric=volume@#$'
      return expectSaga(handleTopTokensDeepLink, { chainId: unichainChainId, url: urlWithSpecialCharsMetric })
        .call(dismissAllModalsBeforeNavigation)
        .call(navigate, ModalName.Explore, {
          screen: MobileScreens.Explore,
          params: {
            showFavorites: false,
            orderByMetric: undefined,
            chainId: unichainChainId,
          },
        })
        .run()
    })

    it('should handle various invalid metric formats', () => {
      const testCases = [
        { url: 'https://app.uniswap.org/explore/tokens/unichain?metric=true', desc: 'boolean-like' },
        { url: 'https://app.uniswap.org/explore/tokens/unichain?metric=volume,market_cap', desc: 'array-like' },
        {
          url: "https://app.uniswap.org/explore/tokens/unichain?metric=volume'; DROP TABLE--",
          desc: 'SQL injection-like',
        },
        { url: `https://app.uniswap.org/explore/tokens/unichain?metric=${'a'.repeat(100)}`, desc: 'very long' },
      ]

      return Promise.all(
        testCases.map(({ url }) =>
          expectSaga(handleTopTokensDeepLink, { chainId: unichainChainId, url })
            .call(dismissAllModalsBeforeNavigation)
            .call(navigate, ModalName.Explore, {
              screen: MobileScreens.Explore,
              params: {
                showFavorites: false,
                orderByMetric: undefined,
                chainId: unichainChainId,
              },
            })
            .run(),
        ),
      )
    })

    it('should handle URL encoded metric values correctly', () => {
      const urlWithEncodedMetric = 'https://app.uniswap.org/explore/tokens/unichain?metric=MARKET%5FCAP'
      return expectSaga(handleTopTokensDeepLink, { chainId: unichainChainId, url: urlWithEncodedMetric })
        .call(dismissAllModalsBeforeNavigation)
        .call(navigate, ModalName.Explore, {
          screen: MobileScreens.Explore,
          params: {
            showFavorites: false,
            orderByMetric: 'MARKET_CAP',
            chainId: unichainChainId,
          },
        })
        .run()
    })
  })

  describe('getValidRankingType function edge cases', () => {
    it('should return undefined for falsy metrics (null, empty, whitespace)', () => {
      const testCases = [
        'https://app.uniswap.org/explore/tokens/unichain?other=value', // null metric
        'https://app.uniswap.org/explore/tokens/unichain?metric=', // empty
        'https://app.uniswap.org/explore/tokens/unichain?metric=%20%20%20', // whitespace
      ]

      return Promise.all(
        testCases.map((url) =>
          expectSaga(handleTopTokensDeepLink, { chainId: unichainChainId, url })
            .call(dismissAllModalsBeforeNavigation)
            .call(navigate, ModalName.Explore, {
              screen: MobileScreens.Explore,
              params: {
                showFavorites: false,
                orderByMetric: undefined,
                chainId: unichainChainId,
              },
            })
            .run(),
        ),
      )
    })

    it('should convert valid lowercase metric to uppercase', () => {
      const urlWithLowercaseMetric = 'https://app.uniswap.org/explore/tokens/unichain?metric=volume'
      return expectSaga(handleTopTokensDeepLink, { chainId: unichainChainId, url: urlWithLowercaseMetric })
        .call(dismissAllModalsBeforeNavigation)
        .call(navigate, ModalName.Explore, {
          screen: MobileScreens.Explore,
          params: {
            showFavorites: false,
            orderByMetric: 'VOLUME',
            chainId: unichainChainId,
          },
        })
        .run()
    })

    it('should handle mixed case metric conversion', () => {
      const urlWithMixedCaseMetric = 'https://app.uniswap.org/explore/tokens/unichain?metric=mArKeT_cAp'
      return expectSaga(handleTopTokensDeepLink, { chainId: unichainChainId, url: urlWithMixedCaseMetric })
        .call(dismissAllModalsBeforeNavigation)
        .call(navigate, ModalName.Explore, {
          screen: MobileScreens.Explore,
          params: {
            showFavorites: false,
            orderByMetric: 'MARKET_CAP',
            chainId: unichainChainId,
          },
        })
        .run()
    })

    it('should return undefined for unsupported metric values', () => {
      const urlWithUnsupportedMetric = 'https://app.uniswap.org/explore/tokens/unichain?metric=unsupported_metric'
      return expectSaga(handleTopTokensDeepLink, { chainId: unichainChainId, url: urlWithUnsupportedMetric })
        .call(dismissAllModalsBeforeNavigation)
        .call(navigate, ModalName.Explore, {
          screen: MobileScreens.Explore,
          params: {
            showFavorites: false,
            orderByMetric: undefined,
            chainId: unichainChainId,
          },
        })
        .run()
    })

    it('should reject TRENDING metric in any case format', () => {
      const testCases = [
        'https://app.uniswap.org/explore/tokens/unichain?metric=trending',
        'https://app.uniswap.org/explore/tokens/unichain?metric=TrEnDiNg',
      ]

      return Promise.all(
        testCases.map((url) =>
          expectSaga(handleTopTokensDeepLink, { chainId: unichainChainId, url })
            .call(dismissAllModalsBeforeNavigation)
            .call(navigate, ModalName.Explore, {
              screen: MobileScreens.Explore,
              params: {
                showFavorites: false,
                orderByMetric: undefined,
                chainId: unichainChainId,
              },
            })
            .run(),
        ),
      )
    })

    it('should handle valid RankingType values - all uppercase variants', () => {
      const validMetrics = ['VOLUME', 'MARKET_CAP', 'TOTAL_VALUE_LOCKED']

      return Promise.all(
        validMetrics.map((metric) => {
          const urlWithMetric = `https://app.uniswap.org/explore/tokens/unichain?metric=${metric}`
          return expectSaga(handleTopTokensDeepLink, { chainId: unichainChainId, url: urlWithMetric })
            .call(dismissAllModalsBeforeNavigation)
            .call(navigate, ModalName.Explore, {
              screen: MobileScreens.Explore,
              params: {
                showFavorites: false,
                orderByMetric: metric,
                chainId: unichainChainId,
              },
            })
            .run()
        }),
      )
    })

    it('should handle valid CustomRankingType values except TRENDING', () => {
      const validCustomMetrics = ['PRICE_PERCENT_CHANGE_1_DAY_ASC', 'PRICE_PERCENT_CHANGE_1_DAY_DESC']

      return Promise.all(
        validCustomMetrics.map((metric) => {
          const urlWithMetric = `https://app.uniswap.org/explore/tokens/unichain?metric=${metric}`
          return expectSaga(handleTopTokensDeepLink, { chainId: unichainChainId, url: urlWithMetric })
            .call(dismissAllModalsBeforeNavigation)
            .call(navigate, ModalName.Explore, {
              screen: MobileScreens.Explore,
              params: {
                showFavorites: false,
                orderByMetric: metric,
                chainId: unichainChainId,
              },
            })
            .run()
        }),
      )
    })
  })

  describe('URL edge cases', () => {
    it('should handle URL without search params', () => {
      const basicUrl = 'https://app.uniswap.org/explore/tokens/unichain'
      return expectSaga(handleTopTokensDeepLink, { chainId: unichainChainId, url: basicUrl })
        .call(dismissAllModalsBeforeNavigation)
        .call(navigate, ModalName.Explore, {
          screen: MobileScreens.Explore,
          params: {
            showFavorites: false,
            orderByMetric: undefined,
            chainId: unichainChainId,
          },
        })
        .run()
    })

    it('should handle URL with multiple query parameters', () => {
      const urlWithMultipleParams = 'https://app.uniswap.org/explore/tokens/unichain?metric=volume&other=value&foo=bar'
      return expectSaga(handleTopTokensDeepLink, { chainId: unichainChainId, url: urlWithMultipleParams })
        .call(dismissAllModalsBeforeNavigation)
        .call(navigate, ModalName.Explore, {
          screen: MobileScreens.Explore,
          params: {
            showFavorites: false,
            orderByMetric: 'VOLUME',
            chainId: unichainChainId,
          },
        })
        .run()
    })

    it('should handle URL with fragment identifier', () => {
      const urlWithFragment = 'https://app.uniswap.org/explore/tokens/unichain?metric=market_cap#section'
      return expectSaga(handleTopTokensDeepLink, { chainId: unichainChainId, url: urlWithFragment })
        .call(dismissAllModalsBeforeNavigation)
        .call(navigate, ModalName.Explore, {
          screen: MobileScreens.Explore,
          params: {
            showFavorites: false,
            orderByMetric: 'MARKET_CAP',
            chainId: unichainChainId,
          },
        })
        .run()
    })
  })
})
