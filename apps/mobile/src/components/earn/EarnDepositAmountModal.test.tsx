import { TradingApi } from '@universe/api'
import type { ReactElement, ReactNode } from 'react'
import { EarnDepositAmountModal } from 'src/components/earn/EarnDepositAmountModal'
import { fireEvent, render, screen, waitFor } from 'src/test/test-utils'
import { initialUniswapBehaviorHistoryState } from 'uniswap/src/features/behaviorHistory/slice'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { EarnEntryPoint } from 'uniswap/src/features/earn/analytics'
import { EarnAction, type EarnPositionInfo, type EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

const mockNavigate = vi.fn()
const mockReplace = vi.fn()
let mockLivePosition: EarnPositionInfo | undefined

vi.mock('src/app/navigation/types', () => ({
  useAppStackNavigation: () => ({ navigate: mockNavigate, replace: mockReplace }),
}))

vi.mock('src/components/earn/EarnDepositAmountContent', async () => {
  const { Text } = await vi.importActual<typeof import('ui/src')>('ui/src')
  const { UniverseChainId: ActualUniverseChainId } = await vi.importActual<
    typeof import('uniswap/src/features/chains/types')
  >('uniswap/src/features/chains/types')
  const { EarnAction: ActualEarnAction } = await vi.importActual<typeof import('uniswap/src/features/earn/types')>(
    'uniswap/src/features/earn/types',
  )
  return {
    EarnDepositAmountContent: ({
      position,
      onActionChange,
      onOpenVaultDetails,
      onReview,
    }: {
      position?: EarnPositionInfo
      onActionChange?: (action: EarnAction) => boolean
      onOpenVaultDetails: () => void
      onReview: (params: {
        action: EarnAction
        amount: string
        chainId: UniverseChainId
        destinationCurrencyId: string
      }) => void
    }) => (
      <>
        <Text testID="amount-position">{position?.depositedRaw ?? 'none'}</Text>
        <Text testID="toggle-deposit" onPress={() => onActionChange?.(ActualEarnAction.Deposit)}>
          Deposit
        </Text>
        <Text testID="open-vault-details" onPress={onOpenVaultDetails}>
          Open vault details
        </Text>
        <Text
          testID="review-withdraw"
          onPress={() =>
            onReview({
              action: ActualEarnAction.Withdraw,
              amount: '10',
              chainId: ActualUniverseChainId.Mainnet,
              destinationCurrencyId: 'destination-currency-id',
            })
          }
        >
          Review withdraw
        </Text>
      </>
    ),
  }
})

vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: ({ children }: { children: ReactNode }) => children,
}))

vi.mock('uniswap/src/features/earn/analytics', async () => ({
  ...(await vi.importActual('uniswap/src/features/earn/analytics')),
  getEarnVaultAnalyticsProperties: vi.fn(() => ({ vault_id: 'vault-id' })),
  logEarnTransactionEvent: vi.fn(),
}))

vi.mock('uniswap/src/features/earn/hooks/useEarnPosition', () => ({
  useEarnPosition: () => ({ position: mockLivePosition }),
}))

vi.mock('wallet/src/features/wallet/hooks', () => ({
  useActiveAccountAddress: () => '0x0000000000000000000000000000000000000001',
}))

const vault = {
  id: 'vault-id',
  vaultAddress: '0x0000000000000000000000000000000000000002',
  chainId: UniverseChainId.Mainnet,
} as EarnVaultInfo
const position = {
  vaultId: 'vault-id',
  depositedUsd: 10,
  depositedRaw: '0',
  sharesRaw: '0',
  apyPercent: 5,
} as EarnPositionInfo
const confirmedLivePosition = {
  ...position,
  depositedUsd: 9.99,
  depositedRaw: '9990000',
  sharesRaw: '9990000',
}

function renderAcknowledged(ui: ReactElement): ReturnType<typeof render> {
  return render(ui, {
    preloadedState: {
      uniswapBehaviorHistory: {
        ...initialUniswapBehaviorHistoryState,
        earnHowItWorksAcknowledgedByVaultId: { [vault.id]: true },
      },
    },
  })
}

describe(EarnDepositAmountModal, () => {
  beforeEach(() => {
    mockLivePosition = undefined
    mockNavigate.mockClear()
    mockReplace.mockClear()
  })

  it('redirects a first deposit to the How it works sheet with the deposit params intact', async () => {
    render(
      <EarnDepositAmountModal
        analyticsEntryPoint={EarnEntryPoint.GlobalModal}
        initialAction={EarnAction.Deposit}
        initialAmount="12"
        initialSourceCurrencyId="1-0xusdc"
        isOpen
        vault={vault}
        onClose={vi.fn()}
      />,
    )

    expect(screen.queryByTestId('amount-position')).toBeNull()

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith(ModalName.EarnHowItWorks, {
        analyticsEntryPoint: EarnEntryPoint.GlobalModal,
        initialAction: EarnAction.Deposit,
        initialAmount: '12',
        initialSourceCurrencyId: '1-0xusdc',
        vault,
      }),
    )
  })

  it('does not show How it works before a withdrawal', () => {
    render(
      <EarnDepositAmountModal
        initialAction={EarnAction.Withdraw}
        isOpen
        position={position}
        vault={vault}
        onClose={vi.fn()}
      />,
    )

    expect(screen.queryByText('How it works')).toBeNull()
    expect(screen.getByTestId('amount-position')).toBeDefined()
  })

  it('clears withdrawal state before showing How it works when switching to deposit', () => {
    render(
      <EarnDepositAmountModal
        initialAction={EarnAction.Withdraw}
        initialAmount="12"
        initialChainId={UniverseChainId.ArbitrumOne}
        initialWithdrawMode={TradingApi.EarnWithdrawMode.MAX_SHARES}
        isOpen
        position={position}
        startedAnalyticsKey="vault-id-withdraw"
        vault={vault}
        onClose={vi.fn()}
      />,
    )

    fireEvent.press(screen.getByTestId('toggle-deposit'))

    expect(mockReplace).toHaveBeenCalledWith(ModalName.EarnHowItWorks, {
      analyticsEntryPoint: EarnEntryPoint.GlobalModal,
      initialAction: EarnAction.Deposit,
      position,
      vault,
    })
  })

  it('opens the current vault on the details tab without replacing the amount modal', () => {
    renderAcknowledged(
      <EarnDepositAmountModal
        analyticsEntryPoint={EarnEntryPoint.GlobalModal}
        isOpen
        position={position}
        vault={vault}
        onClose={vi.fn()}
      />,
    )

    fireEvent.press(screen.getByTestId('open-vault-details'))

    expect(mockNavigate).toHaveBeenCalledWith(ModalName.EarnVault, {
      analyticsEntryPoint: EarnEntryPoint.GlobalModal,
      vault,
      position,
      initialSelectedTab: 'details',
      isInfoOnly: true,
    })
  })

  it('replaces a zero-balance snapshot with the confirmed live position for content and review', () => {
    mockLivePosition = confirmedLivePosition

    renderAcknowledged(<EarnDepositAmountModal isOpen position={position} vault={vault} onClose={vi.fn()} />)

    expect(screen.getByText('9990000')).toBeDefined()
    fireEvent.press(screen.getByTestId('review-withdraw'))
    expect(mockReplace).toHaveBeenCalledWith(
      ModalName.EarnWithdrawReview,
      expect.objectContaining({ position: confirmedLivePosition }),
    )
  })

  it('uses a live position when the amount route has no snapshot', () => {
    mockLivePosition = confirmedLivePosition

    renderAcknowledged(<EarnDepositAmountModal isOpen vault={vault} onClose={vi.fn()} />)

    expect(screen.getByText('9990000')).toBeDefined()
  })
})
