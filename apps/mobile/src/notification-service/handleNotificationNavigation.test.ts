export {}

const mockNavigate = jest.fn()
const mockIsReady = jest.fn()

jest.mock('src/app/navigation/navigationRef', () => ({
  navigationRef: {
    navigate: mockNavigate,
    isReady: mockIsReady,
  },
}))

const mockGetState = jest.fn()
jest.mock('src/app/store', () => ({
  store: {
    getState: (): unknown => mockGetState(),
  },
}))

const mockOpenUri = jest.fn()
jest.mock('uniswap/src/utils/linking', () => ({
  openUri: mockOpenUri,
}))

const mockLoggerWarn = jest.fn()
const mockLoggerError = jest.fn()
jest.mock('utilities/src/logger/logger', () => ({
  getLogger: (): { warn: jest.Mock; error: jest.Mock } => ({
    warn: mockLoggerWarn,
    error: mockLoggerError,
  }),
}))

describe('handleNotificationNavigation', () => {
  let handleNotificationNavigation: typeof import('./handleNotificationNavigation').handleNotificationNavigation

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()

    // Re-setup mocks after resetModules
    jest.doMock('src/app/navigation/navigationRef', () => ({
      navigationRef: {
        navigate: mockNavigate,
        isReady: mockIsReady,
      },
    }))
    jest.doMock('src/app/store', () => ({
      store: {
        getState: (): unknown => mockGetState(),
      },
    }))
    jest.doMock('uniswap/src/utils/linking', () => ({
      openUri: mockOpenUri,
    }))
    jest.doMock('utilities/src/logger/logger', () => ({
      getLogger: (): { warn: jest.Mock; error: jest.Mock } => ({
        warn: mockLoggerWarn,
        error: mockLoggerError,
      }),
    }))

    handleNotificationNavigation = require('./handleNotificationNavigation').handleNotificationNavigation
    mockIsReady.mockReturnValue(true)
  })

  describe('navigation readiness', () => {
    it('returns early and logs warning when navigation is not ready', () => {
      mockIsReady.mockReturnValue(false)

      handleNotificationNavigation('https://example.com')

      expect(mockLoggerWarn).toHaveBeenCalledWith(
        'handleNotificationNavigation',
        'handleNotificationNavigation',
        'Navigation not ready',
        { url: 'https://example.com' },
      )
      expect(mockNavigate).not.toHaveBeenCalled()
      expect(mockOpenUri).not.toHaveBeenCalled()
    })
  })

  describe('mobile:// protocol handling', () => {
    describe('swap navigation', () => {
      it('navigates to swap with outputChain pre-filling output currency', () => {
        handleNotificationNavigation('mobile://swap?outputChain=unichain')

        expect(mockNavigate).toHaveBeenCalledWith('swap-modal', {
          input: null,
          output: {
            address: expect.any(String),
            chainId: 130, // Unichain
            type: 'currency',
          },
          exactCurrencyField: 'input',
          exactAmountToken: '',
          selectingCurrencyField: 'output', // defaults to output
          selectingCurrencyChainId: undefined,
        })
      })

      it('navigates to swap with inputChain pre-filling input currency', () => {
        handleNotificationNavigation('mobile://swap?inputChain=arbitrum')

        expect(mockNavigate).toHaveBeenCalledWith('swap-modal', {
          input: {
            address: expect.any(String),
            chainId: 42161, // Arbitrum
            type: 'currency',
          },
          output: null,
          exactCurrencyField: 'input',
          exactAmountToken: '',
          selectingCurrencyField: 'output',
          selectingCurrencyChainId: undefined,
        })
      })

      it('navigates to swap with both inputChain and outputChain', () => {
        handleNotificationNavigation('mobile://swap?inputChain=base&outputChain=optimism')

        expect(mockNavigate).toHaveBeenCalledWith('swap-modal', {
          input: {
            address: expect.any(String),
            chainId: 8453, // Base
            type: 'currency',
          },
          output: {
            address: expect.any(String),
            chainId: 10, // Optimism
            type: 'currency',
          },
          exactCurrencyField: 'input',
          exactAmountToken: '',
          selectingCurrencyField: 'output',
          selectingCurrencyChainId: undefined,
        })
      })

      it('navigates to swap with no pre-filled currencies when no params', () => {
        handleNotificationNavigation('mobile://swap')

        expect(mockNavigate).toHaveBeenCalledWith('swap-modal', {
          input: null,
          output: null,
          exactCurrencyField: 'input',
          exactAmountToken: '',
          selectingCurrencyField: 'output',
          selectingCurrencyChainId: undefined,
        })
      })

      it('ignores unknown chain names', () => {
        handleNotificationNavigation('mobile://swap?inputChain=unknownchain')

        expect(mockNavigate).toHaveBeenCalledWith('swap-modal', {
          input: null, // Unknown chain results in null
          output: null,
          exactCurrencyField: 'input',
          exactAmountToken: '',
          selectingCurrencyField: 'output',
          selectingCurrencyChainId: undefined,
        })
      })

      it('handles case-insensitive chain names', () => {
        handleNotificationNavigation('mobile://swap?outputChain=UNICHAIN')

        expect(mockNavigate).toHaveBeenCalledWith('swap-modal', {
          input: null,
          output: {
            address: expect.any(String),
            chainId: 130, // Unichain
            type: 'currency',
          },
          exactCurrencyField: 'input',
          exactAmountToken: '',
          selectingCurrencyField: 'output',
          selectingCurrencyChainId: undefined,
        })
      })

      it('opens input selector when selectingField=input', () => {
        handleNotificationNavigation('mobile://swap?outputChain=unichain&selectingField=input')

        expect(mockNavigate).toHaveBeenCalledWith('swap-modal', {
          input: null,
          output: {
            address: expect.any(String),
            chainId: 130, // Unichain
            type: 'currency',
          },
          exactCurrencyField: 'input',
          exactAmountToken: '',
          selectingCurrencyField: 'input', // Opens input selector
          selectingCurrencyChainId: undefined,
        })
      })

      it('filters token selector by selectingChain', () => {
        handleNotificationNavigation('mobile://swap?selectingField=input&selectingChain=mainnet')

        expect(mockNavigate).toHaveBeenCalledWith('swap-modal', {
          input: null,
          output: null,
          exactCurrencyField: 'input',
          exactAmountToken: '',
          selectingCurrencyField: 'input',
          selectingCurrencyChainId: 1, // Mainnet filter on selector
        })
      })

      it('supports full bridging flow: outputChain + selectingField=input', () => {
        // Bridge to Unichain: OUTPUT is Unichain native, INPUT selector opens for user to pick source
        handleNotificationNavigation('mobile://swap?outputChain=unichain&selectingField=input')

        expect(mockNavigate).toHaveBeenCalledWith('swap-modal', {
          input: null,
          output: {
            address: expect.any(String),
            chainId: 130,
            type: 'currency',
          },
          exactCurrencyField: 'input',
          exactAmountToken: '',
          selectingCurrencyField: 'input',
          selectingCurrencyChainId: undefined,
        })
      })
    })

    describe('explore navigation', () => {
      it('navigates to explore screen with chain pre-selection', () => {
        handleNotificationNavigation('mobile://explore?chain=monad')

        expect(mockNavigate).toHaveBeenCalledWith('explore-modal', {
          screen: 'Explore',
          params: { chainId: 143 }, // Monad chain ID
        })
      })

      it('navigates to explore screen without chain when no param', () => {
        handleNotificationNavigation('mobile://explore')

        expect(mockNavigate).toHaveBeenCalledWith('explore-modal', {
          screen: 'Explore',
          params: { chainId: undefined },
        })
      })

      it('handles case-insensitive chain names for explore', () => {
        handleNotificationNavigation('mobile://explore?chain=MONAD')

        expect(mockNavigate).toHaveBeenCalledWith('explore-modal', {
          screen: 'Explore',
          params: { chainId: 143 },
        })
      })

      it('handles unknown chain names gracefully', () => {
        handleNotificationNavigation('mobile://explore?chain=unknownchain')

        expect(mockNavigate).toHaveBeenCalledWith('explore-modal', {
          screen: 'Explore',
          params: { chainId: undefined },
        })
      })
    })

    describe('backup navigation', () => {
      it('navigates to backup flow with correct params', () => {
        handleNotificationNavigation('mobile://backup')

        expect(mockNavigate).toHaveBeenCalledWith('OnboardingStack', {
          screen: 'OnboardingBackup',
          params: {
            importType: 'BackupOnly',
            entryPoint: 'BackupCard',
          },
        })
      })
    })

    it('navigates to stack and screen for two-part path', () => {
      handleNotificationNavigation('mobile://SettingsStack/SettingsViewSeedPhrase')

      expect(mockNavigate).toHaveBeenCalledWith('SettingsStack', { screen: 'SettingsViewSeedPhrase' })
    })

    it('navigates to single screen for one-part path', () => {
      handleNotificationNavigation('mobile://Home')

      expect(mockNavigate).toHaveBeenCalledWith('Home')
    })

    it('handles paths with trailing slashes', () => {
      handleNotificationNavigation('mobile://SettingsStack/Settings/')

      expect(mockNavigate).toHaveBeenCalledWith('SettingsStack', { screen: 'Settings' })
    })

    it('handles paths with multiple segments (uses first two)', () => {
      handleNotificationNavigation('mobile://SettingsStack/Settings/SubScreen')

      expect(mockNavigate).toHaveBeenCalledWith('SettingsStack', { screen: 'Settings' })
    })

    it('does not navigate for empty path after prefix', () => {
      handleNotificationNavigation('mobile://')

      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('does not call openUri for mobile:// URLs', () => {
      handleNotificationNavigation('mobile://SettingsStack/Settings')

      expect(mockOpenUri).not.toHaveBeenCalled()
    })
  })

  describe('unitag:// protocol handling', () => {
    const mockActiveAddress = '0x1234567890abcdef1234567890abcdef12345678'

    beforeEach(() => {
      mockGetState.mockReturnValue({
        wallet: {
          activeAccountAddress: mockActiveAddress,
        },
      })
    })

    it('navigates to UnitagStack with ClaimUnitag screen and params', () => {
      handleNotificationNavigation('unitag://ClaimUnitag')

      expect(mockNavigate).toHaveBeenCalledWith('UnitagStack', {
        screen: 'ClaimUnitag',
        params: {
          entryPoint: 'Home',
          address: mockActiveAddress,
        },
      })
    })

    it('logs warning and does not navigate when no active address', () => {
      mockGetState.mockReturnValue({
        wallet: {
          activeAccountAddress: null,
        },
      })

      handleNotificationNavigation('unitag://ClaimUnitag')

      expect(mockLoggerWarn).toHaveBeenCalledWith(
        'handleNotificationNavigation',
        'handleUnitagNavigation',
        'No active address for unitag navigation',
        { url: 'unitag://ClaimUnitag' },
      )
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('logs warning for unknown unitag screen', () => {
      handleNotificationNavigation('unitag://UnknownScreen')

      expect(mockLoggerWarn).toHaveBeenCalledWith(
        'handleNotificationNavigation',
        'handleUnitagNavigation',
        'Unknown unitag screen',
        { url: 'unitag://UnknownScreen', screen: 'UnknownScreen' },
      )
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('does not call openUri for unitag:// URLs', () => {
      handleNotificationNavigation('unitag://ClaimUnitag')

      expect(mockOpenUri).not.toHaveBeenCalled()
    })
  })

  describe('external URL handling', () => {
    it('opens https:// URLs in browser', () => {
      mockOpenUri.mockResolvedValue(undefined)

      handleNotificationNavigation('https://example.com')

      expect(mockOpenUri).toHaveBeenCalledWith({ uri: 'https://example.com' })
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('opens http:// URLs in browser', () => {
      mockOpenUri.mockResolvedValue(undefined)

      handleNotificationNavigation('http://example.com')

      expect(mockOpenUri).toHaveBeenCalledWith({ uri: 'http://example.com' })
    })

    it('opens URLs with query parameters', () => {
      mockOpenUri.mockResolvedValue(undefined)

      handleNotificationNavigation('https://example.com/path?foo=bar&baz=qux')

      expect(mockOpenUri).toHaveBeenCalledWith({ uri: 'https://example.com/path?foo=bar&baz=qux' })
    })

    it('logs error when openUri fails', async () => {
      const error = new Error('Failed to open URL')
      mockOpenUri.mockRejectedValue(error)

      handleNotificationNavigation('https://example.com')

      // Wait for the promise rejection to be handled
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(mockLoggerError).toHaveBeenCalledWith(error, {
        tags: { file: 'handleNotificationNavigation', function: 'handleNotificationNavigation' },
        extra: { url: 'https://example.com' },
      })
    })

    it('opens Uniswap explore URLs', () => {
      mockOpenUri.mockResolvedValue(undefined)

      handleNotificationNavigation('https://app.uniswap.org/explore/tokens/monad')

      expect(mockOpenUri).toHaveBeenCalledWith({ uri: 'https://app.uniswap.org/explore/tokens/monad' })
    })
  })

  describe('edge cases', () => {
    it('handles unknown protocol as external URL', () => {
      mockOpenUri.mockResolvedValue(undefined)

      handleNotificationNavigation('custom://something')

      expect(mockOpenUri).toHaveBeenCalledWith({ uri: 'custom://something' })
    })

    it('handles empty string URL', () => {
      mockOpenUri.mockResolvedValue(undefined)

      handleNotificationNavigation('')

      // Empty string is treated as external URL
      expect(mockOpenUri).toHaveBeenCalledWith({ uri: '' })
    })

    it('handles URL with only protocol prefix mobile://', () => {
      handleNotificationNavigation('mobile://')

      // Empty path results in empty parts array, so no navigation
      expect(mockNavigate).not.toHaveBeenCalled()
      expect(mockOpenUri).not.toHaveBeenCalled()
    })
  })
})
