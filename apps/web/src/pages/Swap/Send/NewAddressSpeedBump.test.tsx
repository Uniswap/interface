import { NewAddressSpeedBumpModal } from 'pages/Swap/Send/NewAddressSpeedBump'
import { SendContext, SendContextType } from 'state/send/SendContext'
import { render, screen } from 'test-utils/render'
import { DAI } from 'uniswap/src/constants/tokens'

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
  setSendState: vi.fn(),
}

vi.mock('@universe/gating', async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useFeatureFlag: vi.fn(),
    getFeatureFlag: vi.fn(),
  }
})

describe('NewAddressSpeedBumpModal', () => {
  it('should not render AccountIcon if account has no ENS avatar/unitag pp', () => {
    const mockOnCancel = vi.fn()
    const mockOnConfirm = vi.fn()
    render(
      <SendContext.Provider value={mockSendContext}>
        <NewAddressSpeedBumpModal isOpen onDismiss={mockOnCancel} onConfirm={mockOnConfirm} />
      </SendContext.Provider>,
    )

    expect(document.body).toMatchSnapshot()
    expect(screen.getByText('New address')).toBeInTheDocument()
    expect(screen.queryByTestId('speedbump-account-icon')).not.toBeInTheDocument()
  })
})
