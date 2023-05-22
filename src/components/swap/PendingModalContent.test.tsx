import { DAI_MAINNET } from '@uniswap/smart-order-router'
import { useIsTransactionConfirmed } from 'state/transactions/hooks'
import { mocked } from 'test-utils/mocked'
import { render, screen } from 'test-utils/render'

import { ConfirmModalState } from './ConfirmSwapModal'
import { ErrorModalContent, PendingModalContent, PendingModalError } from './PendingModalContent'

jest.mock('state/transactions/hooks')

describe('PendingModalContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mocked(useIsTransactionConfirmed).mockReturnValue(false)
  })

  it('renders null for invalid content', () => {
    const result = render(<PendingModalContent steps={[]} currentStep={ConfirmModalState.APPROVING_TOKEN} />)
    expect(result.container).toBeEmptyDOMElement()
  })

  it('renders correctly with only one step', () => {
    render(
      <PendingModalContent
        steps={[ConfirmModalState.APPROVING_TOKEN]}
        currentStep={ConfirmModalState.APPROVING_TOKEN}
        approvalCurrency={DAI_MAINNET}
      />
    )
    expect(screen.getByText('Approve permit')).toBeInTheDocument()
    expect(screen.getByText('Proceed in wallet')).toBeInTheDocument()
    expect(screen.getByText('Why are permits required?')).toBeInTheDocument()
    expect(
      screen.getByText('Permit2 allows token approvals to be shared and managed across different applications.')
    ).toBeInTheDocument()
  })

  describe('renders the correct step when there are multiple', () => {
    it('renders the first step with activeStepIndex=0', () => {
      render(
        <PendingModalContent
          steps={[
            ConfirmModalState.APPROVING_TOKEN,
            ConfirmModalState.PERMITTING,
            ConfirmModalState.PENDING_CONFIRMATION,
          ]}
          currentStep={ConfirmModalState.APPROVING_TOKEN}
          approvalCurrency={DAI_MAINNET}
        />
      )
      expect(screen.getByText('Approve permit')).toBeInTheDocument()
      expect(screen.getByText('Proceed in wallet')).toBeInTheDocument()
      expect(screen.getByText('Why are permits required?')).toBeInTheDocument()
      expect(
        screen.getByText('Permit2 allows token approvals to be shared and managed across different applications.')
      ).toBeInTheDocument()
      expect(screen.queryByText('Approve DAI')).toBeNull()
      expect(screen.queryByText('Why are approvals required?')).toBeNull()
      expect(
        screen.queryByText(
          'This provides the Uniswap protocol access to your token for trading. For security, this will expire after 30 days.'
        )
      ).toBeNull()
    })

    it('renders the second step with activeStepIndex=1', () => {
      render(
        <PendingModalContent
          steps={[
            ConfirmModalState.APPROVING_TOKEN,
            ConfirmModalState.PERMITTING,
            ConfirmModalState.PENDING_CONFIRMATION,
          ]}
          currentStep={ConfirmModalState.PERMITTING}
          approvalCurrency={DAI_MAINNET}
        />
      )
      expect(screen.queryByText('Approve permit')).toBeNull()
      expect(screen.queryByText('Why are permits required?')).toBeNull()
      expect(
        screen.queryByText('Permit2 allows token approvals to be shared and managed across different applications.')
      ).toBeNull()
      expect(screen.queryByText('Approve DAI')).toBeInTheDocument()
      expect(screen.queryByText('Proceed in wallet')).toBeInTheDocument()
      expect(screen.queryByText('Why are approvals required?')).toBeInTheDocument()
      expect(
        screen.queryByText(
          'This provides the Uniswap protocol access to your token for trading. For security, this will expire after 30 days.'
        )
      ).toBeInTheDocument()
    })
  })

  describe('renders the correct logo', () => {
    it('renders the given logo when not overridden with confirmed', () => {
      render(
        <PendingModalContent
          steps={[
            ConfirmModalState.APPROVING_TOKEN,
            ConfirmModalState.PERMITTING,
            ConfirmModalState.PENDING_CONFIRMATION,
          ]}
          currentStep={ConfirmModalState.APPROVING_TOKEN}
          approvalCurrency={DAI_MAINNET}
        />
      )
      expect(screen.getByTestId('pending-modal-currency-logo-loader-DAI')).toBeInTheDocument()
      expect(screen.queryByTestId('pending-modal-failure-icon')).toBeNull()
    })

    it('renders the failure icon instead of the given logo when confirmed and unsuccessful', () => {
      render(<ErrorModalContent errorType={PendingModalError.TOKEN_APPROVAL_ERROR} onRetry={jest.fn()} />)
      expect(screen.getByTestId('pending-modal-failure-icon')).toBeInTheDocument()
      expect(screen.queryByTestId('pending-modal-currency-logo-loader')).toBeNull()
    })

    it('renders the success icon instead of the given logo when confirmed and successful', () => {
      mocked(useIsTransactionConfirmed).mockReturnValue(true)

      render(
        <PendingModalContent
          steps={[
            ConfirmModalState.APPROVING_TOKEN,
            ConfirmModalState.PERMITTING,
            ConfirmModalState.PENDING_CONFIRMATION,
          ]}
          currentStep={ConfirmModalState.PENDING_CONFIRMATION}
          approvalCurrency={DAI_MAINNET}
        />
      )
      expect(screen.queryByTestId('pending-modal-failure-icon')).toBeNull()
      expect(screen.queryByTestId('pending-modal-currency-logo-loader')).toBeNull()
      expect(screen.getByTestId('animated-confirmation')).toBeInTheDocument()
    })
  })
})
