import userEvent from '@testing-library/user-event'
import { Token } from '@uniswap/sdk-core'
import { useUnsupportedTokens } from 'hooks/Tokens'
import { mocked } from 'test-utils/mocked'
import { fireEvent, render, screen, waitForElementToBeRemoved, within } from 'test-utils/render'
import { getExplorerLink } from 'utils/getExplorerLink'

import UnsupportedCurrencyFooter from './UnsupportedCurrencyFooter'

const unsupportedTokenAddress = '0x4e83b6287588a96321B2661c5E041845fF7814af'
const unsupportedTokenSymbol = 'ALTDOM-MAR2021'
const unsupportedToken = new Token(1, unsupportedTokenAddress, 18, 'ALTDOM-MAR2021')
const unsupportedTokenExplorerLink = 'www.blahblah.com'

jest.mock('@web3-react/core', () => {
  const web3React = jest.requireActual('@web3-react/core')
  return {
    ...web3React,
    useWeb3React: () => ({
      chainId: 1,
    }),
  }
})

jest.mock('../../hooks/Tokens')
const mockUseUnsupportedTokens = useUnsupportedTokens as jest.MockedFunction<typeof useUnsupportedTokens>

jest.mock('../../utils/getExplorerLink')
const mockGetExplorerLink = getExplorerLink as jest.MockedFunction<typeof getExplorerLink>

describe('UnsupportedCurrencyFooter.tsx', () => {
  it('matches base snapshot', () => {
    mocked(useUnsupportedTokens).mockImplementation(() => ({ unsupportedTokenAddress: unsupportedToken }))
    const { asFragment } = render(<UnsupportedCurrencyFooter show={true} currencies={[unsupportedToken]} />)
    expect(asFragment()).toMatchSnapshot()
  })

  it('works as expected when one unsupported token exists', async () => {
    mockUseUnsupportedTokens.mockImplementation(() => ({ [unsupportedTokenAddress]: unsupportedToken }))
    mockGetExplorerLink.mockImplementation(() => unsupportedTokenExplorerLink)
    const rendered = render(<UnsupportedCurrencyFooter show={true} currencies={[unsupportedToken]} />)
    await userEvent.click(screen.getByTestId('read-more-button'))
    expect(screen.getByText('Unsupported Assets')).toBeInTheDocument()
    expect(
      screen.getByText((content) => content.startsWith('Some assets are not available through this interface'))
    ).toBeInTheDocument()
    expect(screen.getAllByTestId('unsupported-token-card').length).toBe(1)
    const unsupportedCard = screen.getByTestId('unsupported-token-card')
    expect(within(unsupportedCard).getByText(unsupportedTokenSymbol)).toBeInTheDocument()
    expect(within(unsupportedCard).getByText(unsupportedTokenAddress).closest('a')).toHaveAttribute(
      'href',
      unsupportedTokenExplorerLink
    )
    await userEvent.click(screen.getByTestId('close-icon'))
    await waitForElementToBeRemoved(rendered.queryByTestId('unsupported-token-card'))
    expect(rendered.queryByText('Unsupported Assets')).toBeNull()
    expect(rendered.queryByTestId('unsupported-token-card')).toBeNull()
    expect(
      rendered.queryByText((content) => content.startsWith('Some assets are not available through this interface'))
    ).toBeNull()
  })

  it('works as expected when no unsupported tokens exist', async () => {
    mockUseUnsupportedTokens.mockImplementation(() => ({}))
    const rendered = render(<UnsupportedCurrencyFooter show={true} currencies={[unsupportedToken]} />)
    fireEvent.click(screen.getByTestId('read-more-button'))
    expect(screen.getByText('Unsupported Assets')).toBeInTheDocument()
    expect(
      screen.getByText((content) => content.startsWith('Some assets are not available through this interface'))
    ).toBeInTheDocument()
    expect(rendered.queryByTestId('unsupported-token-card')).toBeNull()
    fireEvent.click(screen.getByTestId('close-icon'))
    await waitForElementToBeRemoved(screen.getByText('Unsupported Assets'))
    expect(rendered.queryByText('Unsupported Assets')).toBeNull()
    expect(
      rendered.queryByText((content) => content.startsWith('Some assets are not available through this interface'))
    ).toBeNull()
  })
})
