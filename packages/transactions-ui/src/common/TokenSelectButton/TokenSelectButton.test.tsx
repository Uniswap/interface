// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import type { TokenSelectButtonToken } from '@universe/transactions-ui/src/common/TokenSelectButton/TokenSelectButton'
import { TokenSelectButton } from '@universe/transactions-ui/src/common/TokenSelectButton/TokenSelectButton'
import { describe, expect, it, vi } from 'vitest'

const uni: TokenSelectButtonToken = { symbol: 'UNI', logo: { symbol: 'UNI', url: 'https://example.com/uni.png' } }

describe('TokenSelectButton', () => {
  it('renders the selected symbol and reports the press', () => {
    const onPress = vi.fn()
    render(<TokenSelectButton testID="choose" token={uni} onPress={onPress} />)
    expect(screen.getByTestId('choose-label').textContent).toBe('UNI')
    fireEvent.click(screen.getByTestId('choose'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('renders the select token copy without a token', () => {
    render(<TokenSelectButton onPress={vi.fn()} />)
    expect(screen.getByText('tokens.selector.button.choose')).toBeTruthy()
  })

  it('renders a static badge without onPress', () => {
    render(<TokenSelectButton testID="choose" token={uni} />)
    expect(screen.getByTestId('choose-label').textContent).toBe('UNI')
    expect(screen.queryByTestId('choose')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
  })
})
