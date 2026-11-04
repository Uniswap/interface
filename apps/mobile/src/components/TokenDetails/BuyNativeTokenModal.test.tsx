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

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useNativeCurrencyInfo: (): undefined => undefined,
  useCurrencyInfo: (): undefined => undefined,
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
  it('renders nothing instead of throwing while the native currency info is still loading', () => {
    const chainId = UniverseChainId.Arc

    expect(() => renderWithProviders(<BuyNativeTokenModal {...createProps(chainId)} />)).not.toThrow()
    expect(mockUseBridgingTokenWithHighestBalance).toHaveBeenCalledWith(
      expect.objectContaining({ currencyAddress: getNativeAddress(chainId), currencyChainId: chainId }),
    )
  })
})
