import { DAI } from 'constants/tokens'
import { NewAddressSpeedBumpModal } from 'pages/Swap/Send/NewAddressSpeedBump'
import { SendContext, SendContextType } from 'state/send/SendContext'
import { render, screen } from 'test-utils/render'

const mockSendContext: SendContextType = {
  sendState: {
    exactAmountToken: '1',
    exactAmountFiat: undefined,
    recipient: '0x9984b4b4E408e8D618A879e5315BD30952c89103',
    inputCurrency: DAI,
    inputInFiat: false,
    validatedRecipientData: {
      address: '0x9984b4b4E408e8D618A879e5315BD30952c89103',
    },
  },
  derivedSendInfo: {
    recipientData: {
      address: '0x9984b4b4E408e8D618A879e5315BD30952c89103',
    },
  },
  setSendState: jest.fn(),
}

describe('NewAddressSpeedBumpModal', () => {
  it('should render correctly', () => {
    const mockOnCancel = jest.fn()
    const mockOnConfirm = jest.fn()
    render(
      <SendContext.Provider value={mockSendContext}>
        <NewAddressSpeedBumpModal onCancel={mockOnCancel} onConfirm={mockOnConfirm} />
      </SendContext.Provider>
    )

    expect(document.body).toMatchSnapshot()
    expect(screen.getByText('New address')).toBeInTheDocument()
  })
})
