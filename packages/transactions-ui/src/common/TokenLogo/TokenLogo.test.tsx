// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { TokenLogo } from '@universe/transactions-ui/src/common/TokenLogo/TokenLogo'
import { describe, expect, it } from 'vitest'

describe('TokenLogo', () => {
  it('renders the image when a url is set', () => {
    render(<TokenLogo symbol="UNI" url="https://example.com/uni.png" />)
    expect(screen.getByTestId('img-token-image')).toBeTruthy()
    expect(screen.queryByText('UNI')).toBeNull()
  })

  it('renders the first three symbol characters without a url', () => {
    render(<TokenLogo symbol="WBTC" />)
    expect(screen.getByText('WBT')).toBeTruthy()
  })

  it('renders the network badge with its testID', () => {
    render(
      <TokenLogo
        badge={{ kind: 'network', logo: 'https://example.com/base.png', testID: 'network-logo-8453' }}
        symbol="UNI"
      />,
    )
    expect(screen.getByTestId('network-logo-8453')).toBeTruthy()
  })

  it('renders the network count, capped at 99+', () => {
    const { rerender } = render(<TokenLogo badge={{ kind: 'networkCount', count: 4 }} symbol="USDC" />)
    expect(screen.getByTestId('multichain-count-badge').textContent).toBe('4')
    rerender(<TokenLogo badge={{ kind: 'networkCount', count: 150 }} symbol="USDC" />)
    expect(screen.getByTestId('multichain-count-badge').textContent).toBe('99+')
  })

  it('renders only the skeleton while loading', () => {
    render(<TokenLogo isLoading symbol="UNI" url="https://example.com/uni.png" />)
    expect(screen.queryByTestId('img-token-image')).toBeNull()
    expect(screen.getByTestId('token-logo')).toBeTruthy()
  })
})
