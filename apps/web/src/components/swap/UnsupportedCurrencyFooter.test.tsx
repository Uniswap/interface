import 'test-utils/tokens/mocks'

import userEvent from '@testing-library/user-event'
import { Token } from '@taraswap/sdk-core'
import { mocked } from 'test-utils/mocked'
import { act, render, screen, waitForElementToBeRemoved, within } from 'test-utils/render'
import { getExplorerLink } from 'utils/getExplorerLink'

import { useCurrencyInfo } from 'hooks/Tokens'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import UnsupportedCurrencyFooter from './UnsupportedCurrencyFooter'

const unsupportedTokenAddress = '0x4e83b6287588a96321B2661c5E041845fF7814af'
const unsupportedTokenSymbol = 'ALTDOM-MAR2021'
const unsupportedToken = new Token(1, unsupportedTokenAddress, 18, 'ALTDOM-MAR2021')
const unsupportedTokenExplorerLink = 'www.blahblah.com'

jest.mock('../../utils/getExplorerLink')
jest.setTimeout(15_000)

describe('UnsupportedCurrencyFooter.tsx with unsupported tokens', () => {
  beforeEach(() => {
    mocked(getExplorerLink).mockReturnValue(unsupportedTokenExplorerLink)
    mocked(useCurrencyInfo).mockReturnValue({
      currencyId: unsupportedTokenAddress,
      logoUrl: '',
      safetyLevel: SafetyLevel.Blocked,
      currency: unsupportedToken,
    })
  })

  it('renders', () => {
    const { asFragment } = render(<UnsupportedCurrencyFooter show={true} currencies={[unsupportedToken]} />)
    expect(asFragment()).toMatchSnapshot()
  })

  it('works as expected when one unsupported token exists', async () => {
    const rendered = render(<UnsupportedCurrencyFooter show={true} currencies={[unsupportedToken]} />)
    await act(() => userEvent.click(screen.getByTestId('read-more-button')))
    expect(screen.getByText('Unsupported assets')).toBeInTheDocument()
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
    await act(() => userEvent.click(screen.getByTestId('close-icon')))
    await waitForElementToBeRemoved(rendered.queryByTestId('unsupported-token-card'))
    expect(rendered.queryByText('Unsupported Assets')).toBeNull()
    expect(rendered.queryByTestId('unsupported-token-card')).toBeNull()
    expect(
      rendered.queryByText((content) => content.startsWith('Some assets are not available through this interface'))
    ).toBeNull()
  })
})

describe('UnsupportedCurrencyFooter.tsx with no unsupported tokens', () => {
  it('works as expected when no unsupported tokens exist', async () => {
    mocked(useCurrencyInfo).mockReturnValue({
      currencyId: unsupportedTokenAddress,
      logoUrl: '',
      safetyLevel: SafetyLevel.Verified,
      currency: unsupportedToken,
    })
    const rendered = render(<UnsupportedCurrencyFooter show={true} currencies={[unsupportedToken]} />)
    await act(() => userEvent.click(screen.getByTestId('read-more-button')))
    expect(screen.getByText('Unsupported assets')).toBeInTheDocument()
    expect(
      screen.getByText((content) => content.startsWith('Some assets are not available through this interface'))
    ).toBeInTheDocument()
    expect(rendered.queryByTestId('unsupported-token-card')).toBeNull()
    await act(() => userEvent.click(screen.getByTestId('close-icon')))
    await waitForElementToBeRemoved(screen.getByText('Unsupported assets'))
    expect(rendered.queryByText('Unsupported assets')).toBeNull()
    expect(
      rendered.queryByText((content) => content.startsWith('Some assets are not available through this interface'))
    ).toBeNull()
  })
})
