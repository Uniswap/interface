import { useWeb3React } from '@web3-react/core'
import { mocked } from 'test-utils/mocked'
import { render, screen } from 'test-utils/render'

import Bag from './Bag'
import { BagFooter } from './BagFooter'

describe('Bag.tsx', () => {
  it('matches base snapshot', () => {
    const { asFragment } = render(<Bag />)
    expect(asFragment()).toMatchSnapshot()
  })
})

const renderBagFooter = () => {
  render(<BagFooter setModalIsOpen={() => undefined} eventProperties={{}} />)
}

const getBuyButton = () => screen.queryByTestId('nft-buy-button') as HTMLButtonElement

describe('BagFooter.tsx', () => {
  it('wallet not connected', () => {
    renderBagFooter()
    const buyButton = getBuyButton()

    expect(buyButton).toBeInTheDocument()
    expect(buyButton.textContent).toBe('Connect wallet')
  })

  it('wallet connected', () => {
    mocked(useWeb3React).mockReturnValue({
      chainId: 1001221312312312,
    } as ReturnType<typeof useWeb3React>)

    renderBagFooter()
    const buyButton = getBuyButton()

    expect(buyButton.textContent).toBe('Switch networks')
  })
})
