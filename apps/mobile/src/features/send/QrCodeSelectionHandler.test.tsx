import { UniverseChainId } from '@universe/chains'
import type { ReactNode } from 'react'
import { QrCodeSelectionChangeType, QrCodeSelectionType } from 'src/features/send/qrCodeSelection'
import { QrCodeSelectionHandler } from 'src/features/send/QrCodeSelectionHandler'
import { act, fireEvent, render, screen, waitFor } from 'src/test/test-utils'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { USDC_BASE } from 'uniswap/src/constants/tokens'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import type { TokenWarningModalProps } from 'uniswap/src/features/tokens/warnings/TokenWarningModal'
import type { RecipientSelectSpeedBumps } from 'wallet/src/components/RecipientSearch/RecipientSelectSpeedBumps'

const {
  RECIPIENT,
  mockOnClose,
  mockOnSelectCurrency,
  mockUseCurrencyInfoWithLoading,
  mockGetTokenWarningSeverity,
  mockModal,
  mockSpeedBump,
  mockTokenWarningModal,
} = vi.hoisted(() => ({
  RECIPIENT: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  mockOnClose: vi.fn(),
  mockOnSelectCurrency: vi.fn(),
  mockUseCurrencyInfoWithLoading: vi.fn(),
  mockGetTokenWarningSeverity: vi.fn(),
  mockModal: vi.fn(),
  mockSpeedBump: vi.fn(),
  mockTokenWarningModal: vi.fn(),
}))

type SpeedBumpProps = Parameters<typeof RecipientSelectSpeedBumps>[0]

vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: (props: { children: ReactNode; name: string }) => {
    mockModal(props)
    return props.children
  },
}))

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfoWithLoading: (...args: unknown[]) => mockUseCurrencyInfoWithLoading(...args),
}))

vi.mock('wallet/src/features/transactions/contexts/SendContext', () => ({
  useSendContext: () => ({ onSelectCurrency: mockOnSelectCurrency, recipient: RECIPIENT }),
}))

vi.mock('wallet/src/components/RecipientSearch/RecipientSelectSpeedBumps', () => ({
  RecipientSelectSpeedBumps: (props: SpeedBumpProps) => {
    mockSpeedBump(props)
    return null
  },
}))

vi.mock('uniswap/src/features/tokens/warnings/safetyUtils', () => ({
  getTokenProtectionWarning: () => 'none',
  getTokenWarningSeverity: (...args: unknown[]) => mockGetTokenWarningSeverity(...args),
}))

vi.mock('uniswap/src/features/tokens/warnings/slice/hooks', () => ({
  useDismissedTokenWarnings: () => ({ tokenWarningDismissed: false, onDismissTokenWarning: vi.fn() }),
}))

vi.mock('uniswap/src/features/tokens/warnings/TokenWarningModal', () => ({
  default: (props: TokenWarningModalProps) => {
    mockTokenWarningModal(props)
    return null
  },
}))

const currencyInfo: CurrencyInfo = {
  currencyId: `${UniverseChainId.Base}-${USDC_BASE.address}`,
  currency: USDC_BASE,
  logoUrl: null,
  safetyInfo: null,
}

function renderWarning(changeType: QrCodeSelectionChangeType): void {
  render(
    <QrCodeSelectionHandler
      selection={{
        type: QrCodeSelectionType.Change,
        changeType,
        chainId: UniverseChainId.Base,
        tokenAddress: USDC_BASE.address,
      }}
      onClose={mockOnClose}
    />,
  )
}

function renderInitialSelection(): void {
  render(initialSelection())
}

function initialSelection(): React.JSX.Element {
  return (
    <QrCodeSelectionHandler
      selection={{
        type: QrCodeSelectionType.Initial,
        chainId: UniverseChainId.Base,
        tokenAddress: USDC_BASE.address,
      }}
      onClose={mockOnClose}
    />
  )
}

function pressUpdate(): void {
  fireEvent.press(screen.getByText('send.qrCodeSelection.warning.action.update'))
}

describe(QrCodeSelectionHandler, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCurrencyInfoWithLoading.mockReturnValue({ data: currencyInfo, isLoading: false })
    mockGetTokenWarningSeverity.mockReturnValue(WarningSeverity.None)
  })

  it('checks the recipient on the QR network before applying a network update', () => {
    renderWarning(QrCodeSelectionChangeType.NetworkAndToken)

    pressUpdate()

    const speedBumpProps = mockSpeedBump.mock.lastCall?.[0] as SpeedBumpProps
    expect(speedBumpProps).toMatchObject({
      recipientAddress: RECIPIENT,
      chainId: UniverseChainId.Base,
      checkSpeedBumps: true,
      onlyCheckChainDependentWarnings: true,
    })
    expect(mockOnSelectCurrency).not.toHaveBeenCalled()

    act(() => speedBumpProps.onConfirm())

    expect(mockOnSelectCurrency).toHaveBeenCalledWith({ currency: USDC_BASE })
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('applies an initial QR selection without showing the change warning', async () => {
    renderInitialSelection()

    expect(mockModal).not.toHaveBeenCalled()
    await waitFor(() => {
      expect(mockSpeedBump.mock.lastCall?.[0]).toMatchObject({
        recipientAddress: RECIPIENT,
        chainId: UniverseChainId.Base,
        checkSpeedBumps: true,
        onlyCheckChainDependentWarnings: true,
      })
    })

    const speedBumpProps = mockSpeedBump.mock.lastCall?.[0] as SpeedBumpProps
    act(() => speedBumpProps.onConfirm())

    expect(mockOnSelectCurrency).toHaveBeenCalledWith({ currency: USDC_BASE })
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('clears an unavailable initial QR selection', async () => {
    mockUseCurrencyInfoWithLoading.mockReturnValue({ data: undefined, isLoading: false })

    renderInitialSelection()

    await waitFor(() => expect(mockOnClose).toHaveBeenCalledTimes(1))
    expect(mockOnSelectCurrency).not.toHaveBeenCalled()
  })

  it('does not auto-apply after a loading initial selection is reclassified as a change', () => {
    mockUseCurrencyInfoWithLoading.mockReturnValue({ data: undefined, isLoading: true })
    const { rerender } = render(initialSelection())

    mockUseCurrencyInfoWithLoading.mockReturnValue({ data: currencyInfo, isLoading: false })
    rerender(
      <QrCodeSelectionHandler
        selection={{
          type: QrCodeSelectionType.Change,
          changeType: QrCodeSelectionChangeType.NetworkAndToken,
          chainId: UniverseChainId.Base,
          tokenAddress: USDC_BASE.address,
        }}
        onClose={mockOnClose}
      />,
    )

    expect(mockModal).toHaveBeenCalled()
    expect(mockOnSelectCurrency).not.toHaveBeenCalled()
  })

  it('resets an active initial recipient check when the selection becomes a change', async () => {
    const { rerender } = render(initialSelection())

    await waitFor(() => {
      expect(mockSpeedBump.mock.lastCall?.[0]).toMatchObject({ checkSpeedBumps: true })
    })

    rerender(
      <QrCodeSelectionHandler
        selection={{
          type: QrCodeSelectionType.Change,
          changeType: QrCodeSelectionChangeType.NetworkAndToken,
          chainId: UniverseChainId.Base,
          tokenAddress: USDC_BASE.address,
        }}
        onClose={mockOnClose}
      />,
    )

    const speedBumpProps = mockSpeedBump.mock.lastCall?.[0] as SpeedBumpProps
    expect(speedBumpProps.checkSpeedBumps).toBe(false)
    expect(mockModal).toHaveBeenCalled()
    expect(mockOnSelectCurrency).not.toHaveBeenCalled()
  })

  it('shows the token warning before applying a warnable initial QR selection', async () => {
    mockGetTokenWarningSeverity.mockReturnValue(WarningSeverity.High)
    renderInitialSelection()

    await waitFor(() => {
      expect(mockSpeedBump.mock.lastCall?.[0]).toMatchObject({ checkSpeedBumps: true })
    })
    const speedBumpProps = mockSpeedBump.mock.lastCall?.[0] as SpeedBumpProps
    act(() => speedBumpProps.onConfirm())

    expect(mockOnSelectCurrency).not.toHaveBeenCalled()
    const tokenWarningProps = mockTokenWarningModal.mock.lastCall?.[0] as TokenWarningModalProps
    act(() => tokenWarningProps.onAcknowledge())

    expect(mockOnSelectCurrency).toHaveBeenCalledWith({ currency: USDC_BASE })
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('keeps the initial selection unapplied when the token warning is closed', async () => {
    mockGetTokenWarningSeverity.mockReturnValue(WarningSeverity.High)
    renderInitialSelection()

    await waitFor(() => {
      expect(mockSpeedBump.mock.lastCall?.[0]).toMatchObject({ checkSpeedBumps: true })
    })
    const speedBumpProps = mockSpeedBump.mock.lastCall?.[0] as SpeedBumpProps
    act(() => speedBumpProps.onConfirm())

    const tokenWarningProps = mockTokenWarningModal.mock.lastCall?.[0] as TokenWarningModalProps
    act(() => tokenWarningProps.closeModalOnly())

    expect(mockOnSelectCurrency).not.toHaveBeenCalled()
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('keeps the initial selection unapplied when the recipient check is canceled', async () => {
    renderInitialSelection()

    await waitFor(() => {
      expect(mockSpeedBump.mock.lastCall?.[0]).toMatchObject({ checkSpeedBumps: true })
    })
    const speedBumpProps = mockSpeedBump.mock.lastCall?.[0] as SpeedBumpProps
    act(() => speedBumpProps.setCheckSpeedBumps(false))

    expect(mockOnSelectCurrency).not.toHaveBeenCalled()
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('uses dedicated telemetry for the QR selection warning', () => {
    renderWarning(QrCodeSelectionChangeType.Network)

    expect(mockModal.mock.lastCall?.[0]).toMatchObject({ name: ModalName.QrCodeSelectionWarning })
  })

  it('shows the standard token warning before applying a warnable QR token', () => {
    mockGetTokenWarningSeverity.mockReturnValue(WarningSeverity.High)
    renderWarning(QrCodeSelectionChangeType.Token)

    pressUpdate()

    expect(mockOnSelectCurrency).not.toHaveBeenCalled()
    const tokenWarningProps = mockTokenWarningModal.mock.lastCall?.[0] as TokenWarningModalProps
    expect(tokenWarningProps).toMatchObject({ isVisible: true, currencyInfo0: currencyInfo })

    act(() => tokenWarningProps.onAcknowledge())

    expect(mockOnSelectCurrency).toHaveBeenCalledWith({ currency: USDC_BASE })
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('does not apply a blocked QR token when its warning is closed', () => {
    mockGetTokenWarningSeverity.mockReturnValue(WarningSeverity.Blocked)
    renderWarning(QrCodeSelectionChangeType.Token)

    pressUpdate()

    const tokenWarningProps = mockTokenWarningModal.mock.lastCall?.[0] as TokenWarningModalProps
    act(() => tokenWarningProps.closeModalOnly())

    expect(mockOnSelectCurrency).not.toHaveBeenCalled()
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('explains when the QR token cannot be loaded and keeps Update disabled', () => {
    mockUseCurrencyInfoWithLoading.mockReturnValue({ data: undefined, isLoading: false })
    renderWarning(QrCodeSelectionChangeType.Token)

    expect(screen.getByText('send.qrCodeSelection.warning.token.unavailable')).toBeTruthy()

    pressUpdate()

    expect(mockOnSelectCurrency).not.toHaveBeenCalled()
  })
})
