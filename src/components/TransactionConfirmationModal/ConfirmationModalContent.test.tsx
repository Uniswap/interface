import { render, screen } from 'test-utils/render'
import noop from 'utils/noop'

import { ConfirmationModalContent } from '.'

describe('ConfirmationModalContent', () => {
  it('should render the L2 icon for optimism', () => {
    render(
      <ConfirmationModalContent
        title="title"
        onDismiss={noop}
        topContent={() => <div>topContent</div>}
        bottomContent={() => <div>bottomContent</div>}
        headerContent={() => <div data-testid="confirmation-modal-chain-icon">headerContent</div>}
      />
    )
    expect(screen.getByTestId('confirmation-modal-chain-icon')).toBeInTheDocument()
  })

  it('should not render a chain icon', () => {
    render(
      <ConfirmationModalContent
        title="title"
        onDismiss={jest.fn()}
        topContent={() => <div>topContent</div>}
        bottomContent={() => <div>bottomContent</div>}
      />
    )
    expect(screen.queryByTestId('confirmation-modal-chain-icon')).not.toBeInTheDocument()
  })
})
