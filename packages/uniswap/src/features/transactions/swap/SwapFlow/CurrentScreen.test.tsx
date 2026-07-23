import type { ReactNode } from 'react'
import { Modal } from 'uniswap/src/components/modals/Modal'
import {
  TransactionModalContextProvider,
  TransactionScreen,
} from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { CurrentScreen } from 'uniswap/src/features/transactions/swap/SwapFlow/CurrentScreen'
import { renderWithProviders } from 'uniswap/src/test/render'

type MockModalProps = {
  children?: ReactNode
  isDismissible?: boolean
  isModalOpen?: boolean
  onClose?: () => void
}

const mockOnPrev = vi.hoisted(() => vi.fn())
const mockSwapFormState = vi.hoisted(() => ({ isSubmitting: false }))

vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: vi.fn((props: MockModalProps): ReactNode => props.children),
}))

vi.mock('uniswap/src/features/telemetry/Trace', () => ({
  default: ({ children }: { children?: ReactNode }): ReactNode => children,
}))

vi.mock('uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreen', () => ({
  SwapFormScreen: (): null => null,
}))

vi.mock('uniswap/src/features/transactions/swap/review/hooks/useSwapOnPrevious', () => ({
  useSwapOnPrevious: (): { onPrev: () => void } => ({ onPrev: mockOnPrev }),
}))

vi.mock('uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore', () => ({
  useSwapFormStore: vi.fn((selector: (s: { isSubmitting: boolean }) => unknown) => selector(mockSwapFormState)),
}))

vi.mock('uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewScreen', () => ({
  SwapReviewScreen: (): null => null,
  SwapReviewScreenProviders: ({ children }: { children?: ReactNode }): ReactNode => children,
}))

describe('CurrentScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSwapFormState.isSubmitting = false
  })

  it('allows the swap review modal to dismiss before execution starts', () => {
    renderCurrentScreen()

    const modalProps = getModalProps()

    expect(modalProps.isModalOpen).toBe(true)
    expect(modalProps.isDismissible).toBe(true)

    modalProps.onClose?.()

    expect(mockOnPrev).toHaveBeenCalledTimes(1)
  })

  it('keeps the swap review modal open on outside clicks while executing', () => {
    mockSwapFormState.isSubmitting = true

    renderCurrentScreen()

    const modalProps = getModalProps()

    expect(modalProps.isModalOpen).toBe(true)
    expect(modalProps.isDismissible).toBe(false)

    modalProps.onClose?.()

    expect(mockOnPrev).toHaveBeenCalledTimes(1)
  })
})

function renderCurrentScreen(): void {
  renderWithProviders(
    <TransactionModalContextProvider
      bottomSheetViewStyles={{}}
      onClose={vi.fn()}
      screen={TransactionScreen.Review}
      setScreen={vi.fn()}
    >
      <CurrentScreen settings={[]} />
    </TransactionModalContextProvider>,
  )
}

function getModalProps(): MockModalProps {
  return vi.mocked(Modal).mock.calls[0]?.[0] as MockModalProps
}
