import userEvent from '@testing-library/user-event'
import { act, render, screen } from 'test-utils/render'
import noop from 'utils/noop'

import { Selector } from './Selector'

describe('button for selecting a network filter', () => {
  const chainIds = [1, 10, 137] // ETH, OP, POLYGON

  it('defaults to showing all networks with logo pile', () => {
    const { container } = render(<Selector chainIds={chainIds} isActive={false} onClick={noop} />)
    expect(container).toMatchSnapshot()
  })

  it('shows single network logo and chevron when selected', () => {
    const { container } = render(<Selector chainIds={chainIds} selectedChainId={1} isActive={false} onClick={noop} />)
    expect(container).toMatchSnapshot()
  })

  describe('non-idle styling', () => {
    it('changes when hovered', async () => {
      const { container } = render(<Selector chainIds={chainIds} isActive={false} onClick={noop} />)
      await act(() => userEvent.hover(screen.getByTestId('network-selector')))
      expect(container).toMatchSnapshot()
    })

    it('changes when active and hovered', async () => {
      const { container } = render(<Selector chainIds={chainIds} isActive={true} onClick={noop} />)
      await act(() => userEvent.hover(screen.getByTestId('network-selector')))
      expect(container).toMatchSnapshot()
    })
  })
})
