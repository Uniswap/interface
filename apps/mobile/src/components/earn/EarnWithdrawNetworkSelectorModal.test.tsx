import type { ReactNode } from 'react'
import { EarnWithdrawNetworkSelectorModal } from 'src/components/earn/EarnWithdrawNetworkSelectorModal'
import { fireEvent, render, screen } from 'src/test/test-utils'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

const mockPopTo = vi.fn()

vi.mock('@gorhom/bottom-sheet', () => ({
  BottomSheetScrollView: ({ children }: { children: ReactNode }) => children,
}))

vi.mock('src/app/navigation/types', () => ({
  useAppStackNavigation: () => ({ popTo: mockPopTo }),
}))

vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: ({ children }: { children: ReactNode }) => children,
}))

vi.mock('uniswap/src/components/network/NetworkFilterV2/NetworkFilterContent', async () => {
  const { Pressable, Text } = await vi.importActual<typeof import('react-native')>('react-native')
  const { getChainInfo: getActualChainInfo } = await vi.importActual<
    typeof import('uniswap/src/features/chains/chainInfo')
  >('uniswap/src/features/chains/chainInfo')
  return {
    NetworkFilterContent: ({
      chainIds,
      onPressChain,
    }: {
      chainIds: UniverseChainId[]
      onPressChain: (chainId: UniverseChainId) => void
    }) =>
      chainIds.map((chainId) => (
        <Pressable key={chainId} onPress={() => onPressChain(chainId)}>
          <Text>{getActualChainInfo(chainId).label}</Text>
        </Pressable>
      )),
  }
})

vi.mock('uniswap/src/components/network/NetworkFilterV2/NetworkSearchBar', () => ({
  NetworkSearchBar: () => null,
}))

vi.mock('uniswap/src/components/network/NetworkFilterV2/useNetworkFilterSearch', () => ({
  useNetworkFilterSearch: ({ chainIds, tieredOptions }: { chainIds: UniverseChainId[]; tieredOptions: unknown }) => ({
    searchQuery: '',
    setSearchQuery: vi.fn(),
    filteredChainIds: chainIds,
    filteredTieredOptions: tieredOptions,
  }),
}))

vi.mock('uniswap/src/features/earn/hooks/useChainsWithUnderlyingBalance', () => ({
  useChainsWithUnderlyingBalance: () => ({ chainsWithBalance: new Set() }),
}))

vi.mock('wallet/src/features/wallet/hooks', () => ({
  useActiveAccountAddress: () => '0x0000000000000000000000000000000000000001',
}))

function getMainnetStablecoinCurrencyId(symbol: 'USDC' | 'USDT'): string {
  const token = getChainInfo(UniverseChainId.Mainnet).tokens[symbol]
  if (!token) {
    throw new Error(`Expected ${symbol} to be configured on Mainnet`)
  }
  return buildCurrencyId(UniverseChainId.Mainnet, token.address)
}

describe(EarnWithdrawNetworkSelectorModal, () => {
  beforeEach(() => {
    mockPopTo.mockClear()
  })

  it('passes only supported USDT chains to the selector', () => {
    render(
      <EarnWithdrawNetworkSelectorModal
        isOpen
        currentChainId={UniverseChainId.Mainnet}
        underlyingCurrencyId={getMainnetStablecoinCurrencyId('USDT')}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByText('Ethereum')).toBeTruthy()
    expect(screen.getByText('Base')).toBeTruthy()
    expect(screen.getByText('Unichain')).toBeTruthy()
    expect(screen.getByText('ZKsync')).toBeTruthy()
    expect(screen.queryByText('Blast')).toBeNull()

    fireEvent.press(screen.getByText('Base'))
    expect(mockPopTo).toHaveBeenCalledWith(
      ModalName.EarnDepositAmount,
      { initialChainId: UniverseChainId.Base },
      { merge: true },
    )
  })

  it('passes Unichain to the selector for USDC', () => {
    render(
      <EarnWithdrawNetworkSelectorModal
        isOpen
        currentChainId={UniverseChainId.Unichain}
        underlyingCurrencyId={getMainnetStablecoinCurrencyId('USDC')}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByText('Unichain')).toBeTruthy()
  })
})
