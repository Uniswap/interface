import { render, screen } from '@testing-library/react'
import React from 'react'

// All mocks must be declared before importing the SUT.

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts?.['currencySymbol'] ? `${key}:${String(opts['currencySymbol'])}` : key,
  }),
}))

vi.mock('wallet/src/features/transactions/contexts/SendContext', () => ({
  useSendContext: vi.fn(),
}))

vi.mock('uniswap/src/constants/tokens', () => ({
  nativeOnChain: (_chainId: number) => ({ symbol: 'ETH' }),
}))

vi.mock('uniswap/src/features/telemetry/Trace', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('ui/src', () => ({
  __esModule: true,
  Button: ({
    children,
    disabled,
    onPress,
    testID,
  }: {
    children: React.ReactNode
    disabled?: boolean
    onPress?: () => void
    testID?: string
  }) => (
    <button data-testid={testID ?? 'real-button'} data-disabled={String(Boolean(disabled))} onClick={onPress}>
      {children}
    </button>
  ),
  Flex: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Real imports after the mocks are registered.
import { ReviewButton } from 'src/app/features/send/SendFormScreen/ReviewButton'
import { WarningLabel } from 'uniswap/src/components/modals/WarningModal/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useSendContext } from 'wallet/src/features/transactions/contexts/SendContext'

const mockUseSendContext = vi.mocked(useSendContext)

const ETHEREUM = 1

function setupSendContext(overrides: { warnings?: unknown; chainId?: number } = {}): void {
  mockUseSendContext.mockReturnValue({
    derivedSendInfo: { chainId: overrides.chainId ?? ETHEREUM },
    warnings: overrides.warnings ?? { warnings: [], blockingWarning: undefined },
  } as never)
}

describe('ReviewButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('passes disabled prop through to Button when no blocking warning is present', () => {
    setupSendContext({ warnings: { warnings: [], blockingWarning: undefined } })

    render(<ReviewButton onPress={vi.fn()} disabled={true} />)

    const btn = screen.getByTestId(TestID.SendReview)
    expect(btn.getAttribute('data-disabled')).toBe('true')
    expect(btn.textContent).toBe('common.button.review')
  })

  it('disables the button when warnings.blockingWarning is set, even if the disabled prop is false', () => {
    setupSendContext({ warnings: { warnings: [], blockingWarning: WarningLabel.InsufficientFunds } })

    render(<ReviewButton onPress={vi.fn()} disabled={false} />)

    const btn = screen.getByTestId(TestID.SendReview)
    expect(btn.getAttribute('data-disabled')).toBe('true')
    expect(btn.textContent).toBe('common.button.review')
  })

  it('swaps the button copy to the insufficient-funds key when an InsufficientGasFunds warning is present', () => {
    setupSendContext({
      warnings: {
        warnings: [{ type: WarningLabel.InsufficientGasFunds }],
        blockingWarning: undefined,
      },
    })

    render(<ReviewButton onPress={vi.fn()} disabled={false} />)

    const btn = screen.getByTestId(TestID.SendReview)
    expect(btn.textContent).toBe('send.warning.insufficientFunds.title:ETH')
    // No blocking warning, disabled prop is false → button stays enabled.
    expect(btn.getAttribute('data-disabled')).toBe('false')
  })

  it('renders an enabled review button when there are no warnings and disabled is false', () => {
    setupSendContext({ warnings: { warnings: [], blockingWarning: undefined } })

    render(<ReviewButton onPress={vi.fn()} disabled={false} />)

    const btn = screen.getByTestId(TestID.SendReview)
    expect(btn.getAttribute('data-disabled')).toBe('false')
    expect(btn.textContent).toBe('common.button.review')
  })
})
