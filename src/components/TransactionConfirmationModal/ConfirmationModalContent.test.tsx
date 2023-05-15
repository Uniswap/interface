import { SupportedChainId } from 'constants/chains'
import { render, screen } from 'test-utils/render'

import { ConfirmationModalContent } from '.'

describe('ConfirmationModalContent', () => {
  it('should render the L2 icon for optimism', () => {
    render(
      <ConfirmationModalContent
        title="title"
        onDismiss={jest.fn()}
        topContent={() => <div>topContent</div>}
        bottomContent={() => <div>bottomContent</div>}
        chainId={SupportedChainId.OPTIMISM}
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
    expect(screen.queryByTestId('confirmation-modal-chain-icon')).toBeNull()
  })
})
