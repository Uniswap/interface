import { BigNumber } from '@ethersproject/bignumber'
import { TransactionStatus } from 'graphql/data/__generated__/types-and-hooks'
import { TradeFillType } from 'state/routing/types'
import { useSwapTransactionStatus } from 'state/transactions/hooks'
import { TEST_TRADE_EXACT_INPUT } from 'test-utils/constants'
import { mocked } from 'test-utils/mocked'
import { render, screen } from 'test-utils/render'

import { ConfirmModalState } from '../ConfirmSwapModal'
import { PendingModalContent } from '.'
import { ErrorModalContent, PendingModalError } from './ErrorModalContent'

jest.mock('state/transactions/hooks')

describe('PendingModalContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mocked(useSwapTransactionStatus).mockReturnValue(TransactionStatus.Pending)
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
        trade={TEST_TRADE_EXACT_INPUT}
      />
    )
    expect(screen.getByText('Enable spending ABC on Uniswap')).toBeInTheDocument()
    expect(screen.getByText('Proceed in your wallet')).toBeInTheDocument()
    expect(screen.getByText('Why is this required?')).toBeInTheDocument()
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
          trade={TEST_TRADE_EXACT_INPUT}
        />
      )
      expect(screen.getByText('Enable spending ABC on Uniswap')).toBeInTheDocument()
      expect(screen.getByText('Proceed in your wallet')).toBeInTheDocument()
      expect(screen.getByText('Why is this required?')).toBeInTheDocument()
      expect(screen.queryByText('Allow ABC to be used for swapping')).not.toBeInTheDocument()
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
          trade={TEST_TRADE_EXACT_INPUT}
        />
      )
      expect(screen.getByText('Allow ABC to be used for swapping')).toBeInTheDocument()
      expect(screen.getByText('Proceed in your wallet')).toBeInTheDocument()
      expect(screen.getByText('Why is this required?')).toBeInTheDocument()
      expect(screen.queryByText('Enable spending ABC on Uniswap')).not.toBeInTheDocument()
    })

    it('renders the correct label for a submitted classic order', () => {
      render(
        <PendingModalContent
          steps={[
            ConfirmModalState.APPROVING_TOKEN,
            ConfirmModalState.PERMITTING,
            ConfirmModalState.PENDING_CONFIRMATION,
          ]}
          currentStep={ConfirmModalState.PENDING_CONFIRMATION}
          trade={TEST_TRADE_EXACT_INPUT}
          swapResult={{
            type: TradeFillType.Classic,
            response: {
              hash: '12345',
              confirmations: 0,
              from: '0x12345',
              wait: jest.fn(),
              nonce: 0,
              gasLimit: BigNumber.from(100000),
              data: '0xmockdata',
              value: BigNumber.from(100000),
              chainId: 1,
            },
          }}
        />
      )
      expect(screen.getByText('Swap submitted')).toBeInTheDocument()
      expect(screen.getByText('View on Explorer')).toBeInTheDocument()
      expect(screen.queryByText('Proceed in your wallet')).not.toBeInTheDocument()
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
          trade={TEST_TRADE_EXACT_INPUT}
        />
      )
      expect(screen.getByTestId('pending-modal-currency-logo-ABC')).toBeInTheDocument()
      expect(screen.queryByTestId('pending-modal-failure-icon')).toBeNull()
    })

    it('renders the failure icon instead of the given logo when confirmed and unsuccessful', () => {
      render(<ErrorModalContent errorType={PendingModalError.TOKEN_APPROVAL_ERROR} onRetry={jest.fn()} />)
      expect(screen.getByTestId('pending-modal-failure-icon')).toBeInTheDocument()
      expect(screen.queryByTestId('pending-modal-currency-logo-loader')).toBeNull()
    })

    it('renders the submitted icon instead of the given logo on mainnet when the transaction is submitted', () => {
      mocked(useSwapTransactionStatus).mockReturnValue(TransactionStatus.Pending)

      render(
        <PendingModalContent
          steps={[
            ConfirmModalState.APPROVING_TOKEN,
            ConfirmModalState.PERMITTING,
            ConfirmModalState.PENDING_CONFIRMATION,
          ]}
          currentStep={ConfirmModalState.PENDING_CONFIRMATION}
          swapResult={{
            type: TradeFillType.Classic,
            response: {
              hash: '',
              confirmations: 0,
              from: '',
              wait: jest.fn(),
              nonce: 0,
              gasLimit: BigNumber.from(0),
              data: '',
              value: BigNumber.from(0),
              chainId: 0,
            },
          }}
        />
      )
      expect(screen.queryByTestId('pending-modal-failure-icon')).toBeNull()
      expect(screen.queryByTestId('pending-modal-currency-logo-loader')).toBeNull()
      expect(screen.getByTestId('submitted-icon')).toBeInTheDocument()
    })

    it('renders the success icon instead of the given logo when confirmed and successful', () => {
      mocked(useSwapTransactionStatus).mockReturnValue(TransactionStatus.Confirmed)

      render(
        <PendingModalContent
          steps={[
            ConfirmModalState.APPROVING_TOKEN,
            ConfirmModalState.PERMITTING,
            ConfirmModalState.PENDING_CONFIRMATION,
          ]}
          currentStep={ConfirmModalState.PENDING_CONFIRMATION}
          swapResult={{
            type: TradeFillType.Classic,
            response: {
              hash: '',
              confirmations: 0,
              from: '',
              wait: jest.fn(),
              nonce: 0,
              gasLimit: BigNumber.from(0),
              data: '',
              value: BigNumber.from(0),
              chainId: 0,
            },
          }}
        />
      )
      expect(screen.queryByTestId('pending-modal-failure-icon')).toBeNull()
      expect(screen.queryByTestId('pending-modal-currency-logo-loader')).toBeNull()
      expect(screen.getByTestId('confirmed-icon')).toBeInTheDocument()
    })
  })
})
