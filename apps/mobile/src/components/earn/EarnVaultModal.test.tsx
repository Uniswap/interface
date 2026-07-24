import type { ReactNode } from 'react'
import { EarnVaultModal } from 'src/components/earn/EarnVaultModal'
import { fireEvent, render, screen } from 'src/test/test-utils'
import {
  EarnAction,
  type EarnPositionInfo,
  type EarnVaultInfo,
  type EarnVaultTab,
} from 'uniswap/src/features/earn/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

const mockReplace = vi.fn()
const modalPropsSpy = vi.fn()

vi.mock('src/app/navigation/types', () => ({
  useAppStackNavigation: () => ({ navigate: vi.fn(), replace: mockReplace }),
}))

vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: (props: { children: ReactNode }) => {
    modalPropsSpy(props)
    return props.children
  },
}))

vi.mock('@gorhom/bottom-sheet', async () => {
  const { Flex } = await vi.importActual<typeof import('ui/src')>('ui/src')
  return {
    BottomSheetScrollView: ({ children }: { children: ReactNode }) => (
      <Flex testID="earn-vault-scroll-view">{children}</Flex>
    ),
  }
})

vi.mock('uniswap/src/features/earn/EarnVaultOverview', async () => {
  const { Text } = await vi.importActual<typeof import('ui/src')>('ui/src')
  return {
    EarnVaultOverview: ({
      selectedTab,
      showActionButtons,
      onDeposit,
    }: {
      selectedTab: EarnVaultTab
      showActionButtons: boolean
      onDeposit: () => void
    }) => (
      <>
        <Text testID="vault-overview-state">{`${selectedTab}:${showActionButtons}`}</Text>
        <Text testID="deposit" onPress={onDeposit}>
          Deposit
        </Text>
      </>
    ),
  }
})

vi.mock('uniswap/src/features/earn/hooks/useEarnDepositSources', () => ({
  useEarnDepositSources: () => ({ balanceLookupSettled: true, hasSupportedBalanceForUnderlying: true }),
}))

const position = {
  vaultId: 'vault-id',
  depositedRaw: '1',
  sharesRaw: '1',
} as EarnPositionInfo

vi.mock('uniswap/src/features/earn/hooks/useEarnPosition', () => ({
  useEarnPosition: () => ({ position, isError: false, refetch: vi.fn() }),
}))

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfo: () => undefined,
}))

vi.mock('wallet/src/features/wallet/hooks', () => ({
  useActiveAccountAddress: () => '0x0000000000000000000000000000000000000001',
}))

const vault = { id: 'vault-id' } as EarnVaultInfo

describe(EarnVaultModal, () => {
  beforeEach(() => {
    mockReplace.mockClear()
    modalPropsSpy.mockClear()
  })

  it('renders the overview inside a scroll view and disables content panning so long content scrolls', () => {
    render(<EarnVaultModal isOpen position={position} vault={vault} onClose={vi.fn()} />)

    expect(screen.getByTestId('earn-vault-scroll-view')).toBeDefined()
    expect(modalPropsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ overrideInnerContainer: true, enableContentPanningGesture: false }),
    )
  })

  it('opens on Details without action buttons for the amount info flow', () => {
    render(
      <EarnVaultModal
        initialSelectedTab="details"
        isInfoOnly
        isOpen
        position={position}
        vault={vault}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByText('details:false')).toBeDefined()
  })

  it('keeps the default balance view and actions for normal vault entry', () => {
    render(<EarnVaultModal isOpen position={position} vault={vault} onClose={vi.fn()} />)

    expect(screen.getByText('balance:true')).toBeDefined()
  })

  it('passes the displayed position into the deposit amount route', () => {
    render(<EarnVaultModal isOpen position={position} vault={vault} onClose={vi.fn()} />)

    fireEvent.press(screen.getByTestId('deposit'))

    expect(mockReplace).toHaveBeenCalledWith(ModalName.EarnDepositAmount, {
      analyticsEntryPoint: undefined,
      vault,
      position,
      initialAction: EarnAction.Deposit,
    })
  })
})
