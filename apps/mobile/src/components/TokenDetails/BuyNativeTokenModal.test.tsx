import { UniverseChainId } from '@universe/chains'
import React from 'react'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { BuyNativeTokenModal } from 'src/components/TokenDetails/BuyNativeTokenModal'
import { renderWithProviders } from 'src/test/render'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import type { Mock } from 'vitest'

vi.mock('src/components/modals/useReactNavigationModal', () => ({
  useReactNavigationModal: (): { onClose: Mock; preventCloseRef: { current: boolean } } => ({
    onClose: vi.fn(),
    preventCloseRef: { current: false },
  }),
}))

vi.mock('wallet/src/features/wallet/hooks', async () => ({
  ...(await vi.importActual('wallet/src/features/wallet/hooks')),
  useActiveAccountAddress: (): string => '0x0000000000000000000000000000000000000001',
}))

const mockUseNativeCurrencyInfo = vi.hoisted(() => vi.fn())
const mockUseCurrencyInfo = vi.hoisted(() => vi.fn())
vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useNativeCurrencyInfo: mockUseNativeCurrencyInfo,
  useCurrencyInfo: mockUseCurrencyInfo,
}))

vi.mock('react-i18next', async () => ({
  ...(await vi.importActual('react-i18next')),
  useTranslation: (): { t: (key: string, params?: { nativeTokenName: string; chainName: string }) => string } => ({
    t: (key, params) =>
      key === 'token.zeroNativeBalance.title.otherChains'
        ? `You need ${params?.nativeTokenName} on ${params?.chainName}`
        : key,
  }),
}))

const mockBuyNativeTokenButton = vi.hoisted(() => vi.fn((): null => null))
vi.mock('uniswap/src/features/transactions/components/InsufficientNativeTokenWarning/BuyNativeTokenButton', () => ({
  BuyNativeTokenButton: mockBuyNativeTokenButton,
}))

const mockBridgeTokenButton = vi.hoisted(() => vi.fn((): null => null))
vi.mock('uniswap/src/features/transactions/components/InsufficientNativeTokenWarning/BridgeTokenButton', () => ({
  BridgeTokenButton: mockBridgeTokenButton,
}))

const mockUseBridgingTokenWithHighestBalance = vi.hoisted(() => vi.fn().mockReturnValue({ data: undefined }))
vi.mock('uniswap/src/features/bridging/hooks/tokens', () => ({
  useBridgingTokenWithHighestBalance: mockUseBridgingTokenWithHighestBalance,
}))

function createProps(chainId: UniverseChainId): AppStackScreenProp<typeof ModalName.BuyNativeToken> {
  return {
    navigation: {} as AppStackScreenProp<typeof ModalName.BuyNativeToken>['navigation'],
    route: {
      key: 'buy-native-token',
      name: ModalName.BuyNativeToken,
      params: { chainId, currencyId: buildCurrencyId(chainId, '0x0000000000000000000000000000000000000002') },
    },
  }
}

describe('BuyNativeTokenModal', () => {
  beforeEach(() => {
    mockBridgeTokenButton.mockClear()
    mockUseBridgingTokenWithHighestBalance.mockReturnValue({ data: undefined })
    mockUseNativeCurrencyInfo.mockReturnValue(undefined)
    mockUseCurrencyInfo.mockReturnValue(undefined)
  })

  it('renders nothing instead of throwing while the native currency info is still loading', () => {
    const chainId = UniverseChainId.Arc

    expect(() => renderWithProviders(<BuyNativeTokenModal {...createProps(chainId)} />)).not.toThrow()
    expect(mockUseBridgingTokenWithHighestBalance).toHaveBeenCalledWith(
      expect.objectContaining({ currencyAddress: getNativeAddress(chainId), currencyChainId: chainId }),
    )
  })

  it('binds the last two words of the title and uses neutral button colors', () => {
    const chainId = UniverseChainId.Robinhood
    const nativeCurrencyInfo = {
      currency: { chainId, symbol: 'ETH', name: 'Robinhood ETH', isNative: true },
      currencyId: buildCurrencyId(chainId, getNativeAddress(chainId)),
      logoUrl: undefined,
    }
    mockUseNativeCurrencyInfo.mockReturnValue(nativeCurrencyInfo)
    mockUseCurrencyInfo.mockReturnValue({ ...nativeCurrencyInfo, currency: { chainId, symbol: 'PRIORS' } })

    const { getByText } = renderWithProviders(<BuyNativeTokenModal {...createProps(chainId)} />)

    expect(getByText(/^You need Robinhood ETH on Robinhood\u00A0Chain$/, { normalizer: (text) => text })).toBeTruthy()
    expect(mockBuyNativeTokenButton).toHaveBeenCalledWith(
      expect.objectContaining({ usesNetworkColors: false }),
      undefined,
    )
  })

  it('renders the bridge button with the neutral theme', () => {
    const chainId = UniverseChainId.Robinhood
    const nativeCurrencyInfo = {
      currency: { chainId, symbol: 'ETH', name: 'Robinhood ETH', isNative: true },
      currencyId: buildCurrencyId(chainId, getNativeAddress(chainId)),
      logoUrl: undefined,
    }
    mockUseNativeCurrencyInfo.mockReturnValue(nativeCurrencyInfo)
    mockUseCurrencyInfo.mockReturnValue({ ...nativeCurrencyInfo, currency: { chainId, symbol: 'PRIORS' } })
    mockUseBridgingTokenWithHighestBalance.mockReturnValue({
      data: { currencyInfo: { currency: { chainId: UniverseChainId.Mainnet, symbol: 'ETH' } } },
    })

    renderWithProviders(<BuyNativeTokenModal {...createProps(chainId)} />)

    expect(mockBridgeTokenButton).toHaveBeenCalledWith(expect.objectContaining({ usesNeutralTheme: true }), undefined)
  })
})
