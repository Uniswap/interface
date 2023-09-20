import { screen } from '@testing-library/react'
import { render } from 'test-utils/render'

import { TransactionsTable } from './TransactionsTable'

describe('TransactionsTable', () => {
  const BITCOIN_ADDRESS = '0x72e4f9f808c49a2a61de9c5896298920dc4eeea9'

  it('shows all columns for extra large breakpoint', () => {
    window.innerWidth = 1280

    render(<TransactionsTable referenceTokenAddress={BITCOIN_ADDRESS} />)

    expect(screen.getByText('Time')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expect(screen.getByText('Amount')).toBeInTheDocument()
    expect(screen.getByText('For')).toBeInTheDocument()
    expect(screen.getByText('USD')).toBeInTheDocument()
    expect(screen.getByText('Maker')).toBeInTheDocument()
  })

  it('shows all columns for large breakpoint', () => {
    window.innerWidth = 1024

    render(<TransactionsTable referenceTokenAddress={BITCOIN_ADDRESS} />)

    expect(screen.getByText('Time')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expect(screen.getByText('Amount')).toBeInTheDocument()
    expect(screen.getByText('For')).toBeInTheDocument()
    expect(screen.getByText('USD')).toBeInTheDocument()
  })

  it('hides some columns at medium breakpoint', () => {
    window.innerWidth = 768

    render(<TransactionsTable referenceTokenAddress={BITCOIN_ADDRESS} />)

    expect(screen.getByText('Time')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expect(screen.getByText('Amount')).toBeInTheDocument()
    expect(screen.getByText('USD')).toBeInTheDocument()
  })

  it('hides some columns at small breakpoint', () => {
    window.innerWidth = 640

    render(<TransactionsTable referenceTokenAddress={BITCOIN_ADDRESS} />)

    expect(screen.getByText('Time')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expect(screen.getByText('Amount')).toBeInTheDocument()
  })

  it('displays swap row', () => {
    window.innerWidth = 1280
    const txHash = '0xc3e8878f48b4c5048fef4988136b1cad4401b77f36f0e034e4e97929df85fb5e'
    const userAddress = '0xbac29b775eff5fe0abe0b2f1a71bad90888415cc'

    render(<TransactionsTable referenceTokenAddress={BITCOIN_ADDRESS} />)

    expect(screen.getByText('09/06, 05:09pm')).toBeInTheDocument()
    expect(screen.getAllByText('Bought')[0]).toBeInTheDocument()
    expect(screen.getByText('6,084.98 BITCOIN')).toBeInTheDocument()
    expect(screen.getByText('39,037.94 DORKL')).toBeInTheDocument()
    expect(screen.getByText('$1,000.00')).toBeInTheDocument()
    expect(screen.getByTestId(`https://etherscan.io/tx/${txHash}`)).toHaveAttribute(
      'href',
      `https://etherscan.io/tx/${txHash}`
    )
    expect(screen.getByTestId(`https://etherscan.io/address/${userAddress}`)).toHaveAttribute(
      'href',
      `https://etherscan.io/address/${userAddress}`
    )
  })
})
