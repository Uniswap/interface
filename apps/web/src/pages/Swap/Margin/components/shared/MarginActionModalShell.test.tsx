import { fireEvent, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { describe, expect, it, vi } from 'vitest'
import { MarginActionModalShell } from '~/pages/Swap/Margin/components/shared/MarginActionModalShell'
import { render } from '~/test-utils/render'

vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: ({ children }: { children: ReactNode }) => children,
}))

describe('MarginActionModalShell', () => {
  const baseProps = {
    modalName: ModalName.MarginClose,
    title: 'Test title',
    isOpen: true,
    onClose: vi.fn(),
    ctaLabel: 'Confirm',
    ctaDisabled: false,
    onConfirm: vi.fn(),
  }

  it('renders title, body and CTA', () => {
    render(
      <MarginActionModalShell {...baseProps}>
        <span>body content</span>
      </MarginActionModalShell>,
    )
    expect(screen.getByText('Test title')).toBeInTheDocument()
    expect(screen.getByText('body content')).toBeInTheDocument()
    expect(screen.getByText('Confirm')).toBeInTheDocument()
  })

  it('renders a footerMessage slot with multiple simultaneous lines', () => {
    render(
      <MarginActionModalShell
        {...baseProps}
        footerMessage={
          <>
            <span>line one</span>
            <span>line two</span>
          </>
        }
      >
        <span>body</span>
      </MarginActionModalShell>,
    )
    expect(screen.getByText('line one')).toBeInTheDocument()
    expect(screen.getByText('line two')).toBeInTheDocument()
  })

  // Without these two, a shell that renders the Button but never wires onPress/isDisabled passes
  // every other test — and six modals depend on that wiring.
  it('fires onConfirm and honors ctaDisabled', () => {
    const onConfirm = vi.fn()
    const { rerender } = render(
      <MarginActionModalShell {...baseProps} onConfirm={onConfirm}>
        <span>b</span>
      </MarginActionModalShell>,
    )
    fireEvent.click(screen.getByText('Confirm'))
    expect(onConfirm).toHaveBeenCalledTimes(1)

    rerender(
      <MarginActionModalShell {...baseProps} ctaDisabled onConfirm={onConfirm}>
        <span>b</span>
      </MarginActionModalShell>,
    )
    fireEvent.click(screen.getByText('Confirm'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('renders the overlay slot', () => {
    render(
      <MarginActionModalShell {...baseProps} overlay={<span>nested selector</span>}>
        <span>body</span>
      </MarginActionModalShell>,
    )
    expect(screen.getByText('nested selector')).toBeInTheDocument()
  })
})
