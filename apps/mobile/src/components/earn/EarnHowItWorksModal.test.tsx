import type { ReactNode } from 'react'
import { EarnHowItWorksModal } from 'src/components/earn/EarnHowItWorksModal'
import { fireEvent, render, screen } from 'src/test/test-utils'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { EarnEntryPoint } from 'uniswap/src/features/earn/analytics'
import { EarnAction, type EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

const mockReplace = vi.fn()
const { mockLogEarnHowItWorksAcknowledged } = vi.hoisted(() => ({
  mockLogEarnHowItWorksAcknowledged: vi.fn(),
}))

vi.mock('@gorhom/bottom-sheet', () => ({
  BottomSheetScrollView: ({ children }: { children: ReactNode }) => children,
}))

vi.mock('src/app/navigation/types', () => ({
  useAppStackNavigation: () => ({ replace: mockReplace }),
}))

vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: ({ children }: { children: ReactNode }) => children,
}))

vi.mock('uniswap/src/features/earn/EarnHowItWorksView', async () => {
  const { Text } = await vi.importActual<typeof import('ui/src')>('ui/src')
  return {
    EarnHowItWorksView: ({ onContinue }: { onContinue: () => void }) => (
      <>
        <Text>How it works</Text>
        <Text testID="continue-how-it-works" onPress={onContinue}>
          Continue
        </Text>
      </>
    ),
  }
})

vi.mock('uniswap/src/features/earn/analytics', async () => ({
  ...(await vi.importActual('uniswap/src/features/earn/analytics')),
  getEarnVaultAnalyticsProperties: vi.fn(() => ({ vault_id: 'vault-id' })),
  logEarnHowItWorksAcknowledged: mockLogEarnHowItWorksAcknowledged,
}))

const vault = {
  id: 'vault-id',
  vaultAddress: '0x0000000000000000000000000000000000000002',
  chainId: UniverseChainId.Mainnet,
} as EarnVaultInfo

describe(EarnHowItWorksModal, () => {
  beforeEach(() => {
    mockLogEarnHowItWorksAcknowledged.mockClear()
    mockReplace.mockClear()
  })

  it('records acknowledgement and continues to the original deposit route', () => {
    const { store } = render(
      <EarnHowItWorksModal
        analyticsEntryPoint={EarnEntryPoint.GlobalModal}
        initialAction={EarnAction.Deposit}
        initialAmount="12"
        initialSourceCurrencyId="1-0xusdc"
        isOpen
        vault={vault}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByText('How it works')).toBeDefined()

    fireEvent.press(screen.getByTestId('continue-how-it-works'))

    expect(store.getState().uniswapBehaviorHistory.earnHowItWorksAcknowledgedByVaultId?.[vault.id]).toBe(true)
    expect(mockLogEarnHowItWorksAcknowledged).toHaveBeenCalledWith({ vault_id: 'vault-id' })
    expect(mockReplace).toHaveBeenCalledWith(ModalName.EarnDepositAmount, {
      analyticsEntryPoint: EarnEntryPoint.GlobalModal,
      initialAction: EarnAction.Deposit,
      initialAmount: '12',
      initialSourceCurrencyId: '1-0xusdc',
      vault,
    })
  })
})
