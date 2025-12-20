import {
  createSwapTransactionState,
  parseSwapLinkMobileFormatOrThrow,
  parseSwapLinkWebFormatOrThrow,
} from 'src/features/deepLinking/parseSwapLink'
import { AssetType } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyField } from 'uniswap/src/types/currency'

describe('parseSwapLink', () => {
  describe('Mobile format', () => {
    it('should parse valid mobile format link', () => {
      // Using USDC address on mainnet
      const url = new URL(
        'https://uniswap.org/mobile-redirect?screen=swap&inputCurrencyId=1-0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee&outputCurrencyId=1-0xdAC17F958D2ee523a2206206994597C13D831ec7&currencyField=input&amount=100',
      )

      const result = parseSwapLinkMobileFormatOrThrow(url)

      expect(result.inputAsset?.chainId).toBe(UniverseChainId.Mainnet)
      expect(result.exactCurrencyField).toBe(CurrencyField.INPUT)
      expect(result.exactAmountToken).toBe('100')
    })

    it('should handle missing inputCurrencyId', () => {
      const url = new URL(
        'https://uniswap.org/mobile-redirect?screen=swap&outputCurrencyId=1-0xdAC17F958D2ee523a2206206994597C13D831ec7&currencyField=input&amount=100',
      )

      expect(() => parseSwapLinkMobileFormatOrThrow(url)).toThrow('Not mobile format - missing currencyId parameters')
    })
  })

  describe('Universal format', () => {
    it('should parse valid web format link', () => {
      const url = new URL(
        'https://app.uniswap.org/swap?inputCurrency=ETH&outputCurrency=0xdAC17F958D2ee523a2206206994597C13D831ec7&chain=ethereum&value=1.5&field=INPUT',
      )

      const result = parseSwapLinkWebFormatOrThrow(url)

      expect(result.inputAsset?.chainId).toBe(UniverseChainId.Mainnet)
      expect(result.exactCurrencyField).toBe(CurrencyField.INPUT)
      expect(result.exactAmountToken).toBe('1.5')
    })

    it('should handle ETH as native currency', () => {
      const url = new URL(
        'https://app.uniswap.org/swap?inputCurrency=ETH&outputCurrency=0xdAC17F958D2ee523a2206206994597C13D831ec7&chain=ethereum',
      )

      const result = parseSwapLinkWebFormatOrThrow(url)

      // Should use native address for ETH
      expect(result.inputAsset?.address).toBe('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')
    })

    it('should handle cross-chain swaps', () => {
      const url = new URL(
        'https://app.uniswap.org/swap?inputCurrency=ETH&chain=ethereum&outputCurrency=0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39&outputChain=polygon',
      )

      const result = parseSwapLinkWebFormatOrThrow(url)

      expect(result.inputAsset?.chainId).toBe(UniverseChainId.Mainnet)
      expect(result.outputAsset?.chainId).toBe(UniverseChainId.Polygon)
    })

    it('should handle missing currencies', () => {
      const url = new URL('https://app.uniswap.org/swap?chain=ethereum')

      expect(() => parseSwapLinkWebFormatOrThrow(url)).toThrow('Not web format - missing currency parameters')
    })

    it('should handle only input currency provided', () => {
      const url = new URL('https://app.uniswap.org/swap?inputCurrency=ETH&chain=ethereum')

      const result = parseSwapLinkWebFormatOrThrow(url)

      expect(result.inputAsset).toBeDefined()
      expect(result.inputAsset?.address).toBe('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')
      expect(result.inputAsset?.chainId).toBe(UniverseChainId.Mainnet)
      expect(result.outputAsset).toBeNull()
    })

    it('should handle only output currency provided', () => {
      const url = new URL(
        'https://app.uniswap.org/swap?outputCurrency=0xdAC17F958D2ee523a2206206994597C13D831ec7&chain=ethereum',
      )

      const result = parseSwapLinkWebFormatOrThrow(url)

      expect(result.outputAsset).toBeDefined()
      expect(result.outputAsset?.address).toBe('0xdAC17F958D2ee523a2206206994597C13D831ec7')
      expect(result.outputAsset?.chainId).toBe(UniverseChainId.Mainnet)
      expect(result.inputAsset).toBeNull()
    })

    it('should handle invalid field values', () => {
      const url = new URL(
        'https://app.uniswap.org/swap?inputCurrency=ETH&outputCurrency=0xdAC17F958D2ee523a2206206994597C13D831ec7&field=INVALID',
      )

      expect(() => parseSwapLinkWebFormatOrThrow(url)).toThrow('Invalid field. Must be either `INPUT` or `OUTPUT`')
    })
  })

  describe('createSwapTransactionState', () => {
    it('should create valid transaction state with both assets', () => {
      const params = {
        inputAsset: {
          address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          chainId: UniverseChainId.Mainnet,
          type: AssetType.Currency as AssetType.Currency,
        },
        outputAsset: {
          address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          chainId: UniverseChainId.Mainnet,
          type: AssetType.Currency as AssetType.Currency,
        },
        exactCurrencyField: CurrencyField.INPUT,
        exactAmountToken: '1.5',
      }

      const state = createSwapTransactionState(params)

      expect(state[CurrencyField.INPUT]).toBe(params.inputAsset)
      expect(state[CurrencyField.OUTPUT]).toBe(params.outputAsset)
      expect(state.exactCurrencyField).toBe(CurrencyField.INPUT)
      expect(state.exactAmountToken).toBe('1.5')
    })

    it('should create valid transaction state with only input asset', () => {
      const params = {
        inputAsset: {
          address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          chainId: UniverseChainId.Mainnet,
          type: AssetType.Currency as AssetType.Currency,
        },
        outputAsset: null,
        exactCurrencyField: CurrencyField.INPUT,
        exactAmountToken: '1.5',
      }

      const state = createSwapTransactionState(params)

      expect(state[CurrencyField.INPUT]).toBe(params.inputAsset)
      expect(state[CurrencyField.OUTPUT]).toBeNull()
      expect(state.exactCurrencyField).toBe(CurrencyField.INPUT)
      expect(state.exactAmountToken).toBe('1.5')
    })

    it('should create valid transaction state with only output asset', () => {
      const params = {
        inputAsset: null,
        outputAsset: {
          address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          chainId: UniverseChainId.Mainnet,
          type: AssetType.Currency as AssetType.Currency,
        },
        exactCurrencyField: CurrencyField.OUTPUT,
        exactAmountToken: '100',
      }

      const state = createSwapTransactionState(params)

      expect(state[CurrencyField.INPUT]).toBeNull()
      expect(state[CurrencyField.OUTPUT]).toBe(params.outputAsset)
      expect(state.exactCurrencyField).toBe(CurrencyField.OUTPUT)
      expect(state.exactAmountToken).toBe('100')
    })
  })

  describe('Mobile format with testnets', () => {
    it('should parse valid Sepolia testnet link', () => {
      // Using Sepolia testnet chain ID (11155111) and valid USDC address
      const url = new URL(
        `https://uniswap.org/mobile-redirect?screen=swap&inputCurrencyId=${UniverseChainId.Sepolia}-0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee&outputCurrencyId=${UniverseChainId.Sepolia}-0x1c7d4b196cb0c7b01d743fbc6116a902379c7238&currencyField=input&amount=1.5`,
      )

      const result = parseSwapLinkMobileFormatOrThrow(url)

      expect(result.inputAsset?.chainId).toBe(UniverseChainId.Sepolia)
      expect(result.outputAsset?.chainId).toBe(UniverseChainId.Sepolia)
      expect(result.exactCurrencyField).toBe(CurrencyField.INPUT)
      expect(result.exactAmountToken).toBe('1.5')
    })

    it('should parse valid UnichainSepolia link', () => {
      const url = new URL(
        `https://uniswap.org/mobile-redirect?screen=swap&inputCurrencyId=${UniverseChainId.UnichainSepolia}-0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee&outputCurrencyId=${UniverseChainId.UnichainSepolia}-0x31d0220469e10c4E71834a79b1f276d740d3768F&currencyField=input&amount=0.5`,
      )

      const result = parseSwapLinkMobileFormatOrThrow(url)

      expect(result.inputAsset?.chainId).toBe(UniverseChainId.UnichainSepolia)
      expect(result.outputAsset?.chainId).toBe(UniverseChainId.UnichainSepolia)
      expect(result.exactCurrencyField).toBe(CurrencyField.INPUT)
      expect(result.exactAmountToken).toBe('0.5')
    })

    it('should reject mixed testnet and mainnet chains', () => {
      // Try to swap from Sepolia (testnet) to Mainnet
      const url = new URL(
        `https://uniswap.org/mobile-redirect?screen=swap&inputCurrencyId=${UniverseChainId.Sepolia}-0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee&outputCurrencyId=${UniverseChainId.Mainnet}-0xdAC17F958D2ee523a2206206994597C13D831ec7&currencyField=input&amount=1`,
      )

      const testFn = (): void => {
        parseSwapLinkMobileFormatOrThrow(url)
      }
      expect(testFn).toThrow('Cannot swap between testnet and mainnet')
    })

    it('should reject mixed mainnet and testnet chains', () => {
      // Try to swap from Mainnet to UnichainSepolia (testnet)
      const url = new URL(
        `https://uniswap.org/mobile-redirect?screen=swap&inputCurrencyId=${UniverseChainId.Mainnet}-0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee&outputCurrencyId=${UniverseChainId.UnichainSepolia}-0x31d0220469e10c4E71834a79b1f276d740d3768F&currencyField=input&amount=1`,
      )

      const testFn = (): void => {
        parseSwapLinkMobileFormatOrThrow(url)
      }
      expect(testFn).toThrow('Cannot swap between testnet and mainnet')
    })
  })

  describe('Web format with testnets', () => {
    it('should parse valid Sepolia testnet link', () => {
      const url = new URL(
        'https://app.uniswap.org/swap?inputCurrency=ETH&outputCurrency=0x1c7d4b196cb0c7b01d743fbc6116a902379c7238&chain=ethereum_sepolia&value=2.5&field=INPUT',
      )

      const result = parseSwapLinkWebFormatOrThrow(url)

      expect(result.inputAsset?.chainId).toBe(UniverseChainId.Sepolia)
      expect(result.outputAsset?.chainId).toBe(UniverseChainId.Sepolia)
      expect(result.exactCurrencyField).toBe(CurrencyField.INPUT)
      expect(result.exactAmountToken).toBe('2.5')
    })

    it('should handle cross-chain testnet swaps', () => {
      const url = new URL(
        'https://app.uniswap.org/swap?inputCurrency=ETH&chain=ethereum_sepolia&outputCurrency=0x31d0220469e10c4E71834a79b1f276d740d3768F&outputChain=astrochain_sepolia&value=1.0',
      )

      const result = parseSwapLinkWebFormatOrThrow(url)

      expect(result.inputAsset?.chainId).toBe(UniverseChainId.Sepolia)
      expect(result.outputAsset?.chainId).toBe(UniverseChainId.UnichainSepolia)
      expect(result.exactAmountToken).toBe('1.0')
    })

    it('should reject mixed testnet and mainnet in web format', () => {
      // Try to swap from Sepolia to Ethereum mainnet
      const url = new URL(
        'https://app.uniswap.org/swap?inputCurrency=ETH&chain=ethereum_sepolia&outputCurrency=0xdAC17F958D2ee523a2206206994597C13D831ec7&outputChain=ethereum',
      )

      const testFn = (): void => {
        parseSwapLinkWebFormatOrThrow(url)
      }
      expect(testFn).toThrow('Cannot swap between testnet and mainnet')
    })

    it('should reject mixed mainnet and testnet in web format', () => {
      // Try to swap from Ethereum mainnet to Sepolia
      const url = new URL(
        'https://app.uniswap.org/swap?inputCurrency=ETH&chain=ethereum&outputCurrency=0x1c7d4b196cb0c7b01d743fbc6116a902379c7238&outputChain=ethereum_sepolia',
      )

      const testFn = (): void => {
        parseSwapLinkWebFormatOrThrow(url)
      }
      expect(testFn).toThrow('Cannot swap between testnet and mainnet')
    })

    it('should handle only input currency on testnet', () => {
      const url = new URL('https://app.uniswap.org/swap?inputCurrency=ETH&chain=ethereum_sepolia')

      const result = parseSwapLinkWebFormatOrThrow(url)

      expect(result.inputAsset).toBeDefined()
      expect(result.inputAsset?.chainId).toBe(UniverseChainId.Sepolia)
      expect(result.inputAsset?.address).toBe('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')
      expect(result.outputAsset).toBeNull()
    })

    it('should handle only output currency on testnet', () => {
      const url = new URL(
        'https://app.uniswap.org/swap?outputCurrency=0x1c7d4b196cb0c7b01d743fbc6116a902379c7238&chain=ethereum_sepolia',
      )

      const result = parseSwapLinkWebFormatOrThrow(url)

      expect(result.outputAsset).toBeDefined()
      expect(result.outputAsset?.chainId).toBe(UniverseChainId.Sepolia)
      expect(result.outputAsset?.address).toBe('0x1c7d4b196cb0c7b01d743fbc6116a902379c7238')
      expect(result.inputAsset).toBeNull()
    })
  })

  describe('Cross-testnet compatibility', () => {
    it('should allow swaps between different testnet chains', () => {
      // Sepolia to UnichainSepolia should work (both testnets)
      const url = new URL(
        `https://uniswap.org/mobile-redirect?screen=swap&inputCurrencyId=${UniverseChainId.Sepolia}-0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee&outputCurrencyId=${UniverseChainId.UnichainSepolia}-0x31d0220469e10c4E71834a79b1f276d740d3768F&currencyField=input&amount=1`,
      )

      const result = parseSwapLinkMobileFormatOrThrow(url)

      expect(result.inputAsset?.chainId).toBe(UniverseChainId.Sepolia)
      expect(result.outputAsset?.chainId).toBe(UniverseChainId.UnichainSepolia)
    })

    it('should allow swaps between UnichainSepolia and Sepolia', () => {
      const url = new URL(
        `https://uniswap.org/mobile-redirect?screen=swap&inputCurrencyId=${UniverseChainId.UnichainSepolia}-0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee&outputCurrencyId=${UniverseChainId.Sepolia}-0x1c7d4b196cb0c7b01d743fbc6116a902379c7238&currencyField=output&amount=50`,
      )

      const result = parseSwapLinkMobileFormatOrThrow(url)

      expect(result.inputAsset?.chainId).toBe(UniverseChainId.UnichainSepolia)
      expect(result.outputAsset?.chainId).toBe(UniverseChainId.Sepolia)
      expect(result.exactCurrencyField).toBe(CurrencyField.OUTPUT)
    })
  })

  describe('Error handling', () => {
    it('should handle parsing errors gracefully for mobile format', () => {
      // URL with malformed parameters
      const url = new URL(
        'https://uniswap.org/mobile-redirect?screen=swap&inputCurrencyId=invalid&outputCurrencyId=also-invalid',
      )

      expect(() => parseSwapLinkMobileFormatOrThrow(url)).toThrow()
    })

    it('should handle parsing errors gracefully for web format', () => {
      // URL with no currency parameters
      const url = new URL('https://example.com/swap?random=param')

      expect(() => parseSwapLinkWebFormatOrThrow(url)).toThrow('Not web format - missing currency parameters')
    })
  })
})
