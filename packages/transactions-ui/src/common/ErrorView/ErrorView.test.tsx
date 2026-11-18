// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { ErrorView } from '@universe/transactions-ui/src/common/ErrorView/ErrorView'
import { describe, expect, it, vi } from 'vitest'

const base = {
  title: 'Something went wrong',
  message: 'Your funds are safe.',
  primaryAction: { label: 'Try again', onPress: vi.fn() },
}

describe('ErrorView', () => {
  it('renders title, message and the recovery button, and reports the press', () => {
    const onPress = vi.fn()
    render(<ErrorView {...base} primaryAction={{ label: 'Try again', onPress }} />)
    expect(screen.getByText('Something went wrong')).toBeTruthy()
    expect(screen.getByText('Your funds are safe.')).toBeTruthy()
    fireEvent.click(screen.getByText('Try again'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('shows learn more only with a handler, and reports the press', () => {
    const onPressLearnMore = vi.fn()
    const { rerender } = render(<ErrorView {...base} />)
    expect(screen.queryByText('common.button.learn')).toBeNull()
    rerender(<ErrorView {...base} onPressLearnMore={onPressLearnMore} />)
    fireEvent.click(screen.getByText('common.button.learn'))
    expect(onPressLearnMore).toHaveBeenCalledTimes(1)
  })
})
