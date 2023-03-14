import { render, screen } from '../../test-utils'
import TaxServiceModal from './'
import TaxServiceBanner from './TaxServiceBanner'

it('renders Tax Service Modal content', async () => {
  render(<TaxServiceModal isOpen={true} onDismiss={() => null} />)
  expect(screen.getByText('Save 10% on all plans')).toBeInTheDocument()
  expect(screen.getByText('New and existing users save up to 20%')).toBeInTheDocument()
  expect(screen.getAllByTestId('tax-service-option-button')).toHaveLength(2)
})

it('renders Tax Service Banner', async () => {
  render(<TaxServiceBanner />)
  expect(screen.getByText('Save on your crypto taxes')).toBeInTheDocument()
  expect(screen.getAllByTestId('learn-more-button')).toHaveLength(1)
  expect(screen.getByText('Uniswap Labs can save you up to 20% on CoinTracker and TokenTax')).toBeInTheDocument()
})
