import 'test-utils/tokens/mocks'

import userEvent from '@testing-library/user-event'
import { Token } from '@uniswap/sdk-core'
import UnsupportedCurrencyFooter from 'components/swap/UnsupportedCurrencyFooter'
import { useCurrencyInfo } from 'hooks/Tokens'
import { mocked } from 'test-utils/mocked'
import { render, screen, within } from 'test-utils/render'
import { ProtectionResult, SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import { getCurrencySafetyInfo } from 'uniswap/src/features/dataApi/utils/getCurrencySafetyInfo'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { getExplorerLink } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'

const unsupportedTokenAddress = '0x4e83b6287588a96321B2661c5E041845fF7814af'
const unsupportedTokenSymbol = 'ALTDOM-MAR2021'
const unsupportedToken = new Token(1, unsupportedTokenAddress, 18, 'ALTDOM-MAR2021')
const unsupportedTokenExplorerLink = 'www.blahblah.com'

vi.mock('uniswap/src/utils/linking')
setTimeout(() => {}, 15_000)

describe('UnsupportedCurrencyFooter.tsx with unsupported tokens', () => {
  beforeEach(() => {
    mocked(getExplorerLink).mockReturnValue(unsupportedTokenExplorerLink)
    mocked(useCurrencyInfo).mockReturnValue({
      currencyId: unsupportedTokenAddress,
      logoUrl: '',
      safetyInfo: getCurrencySafetyInfo(SafetyLevel.Blocked, undefined),
      currency: unsupportedToken,
    })
  })

  it('renders', () => {
    const { asFragment } = render(<UnsupportedCurrencyFooter show={true} currencies={[unsupportedToken]} />)
    expect(asFragment()).toMatchSnapshot()
  })

  it('works as expected when one unsupported token exists', async () => {
    const rendered = render(<UnsupportedCurrencyFooter show={true} currencies={[unsupportedToken]} />)
    await userEvent.click(screen.getByTestId(TestID.ReadMoreButton))
    expect(screen.getByText('Unsupported assets')).toBeInTheDocument()
    expect(
      screen.getByText((content) => content.startsWith('Some assets are not available through this interface')),
    ).toBeInTheDocument()
    expect(screen.getAllByTestId('unsupported-token-card').length).toBe(1)
    const unsupportedCard = screen.getByTestId('unsupported-token-card')
    expect(within(unsupportedCard).getByText(unsupportedTokenSymbol)).toBeInTheDocument()
    expect(within(unsupportedCard).getByText(shortenAddress(unsupportedTokenAddress)).closest('a')).toHaveAttribute(
      'href',
      unsupportedTokenExplorerLink,
    )
    await userEvent.click(screen.getByTestId('close-icon'))
    expect(rendered.queryByTestId('unsupported-token-card')).not.toBeInTheDocument()
    expect(rendered.queryByText('Unsupported Assets')).toBeNull()
    expect(rendered.queryByTestId('unsupported-token-card')).toBeNull()
    expect(
      rendered.queryByText((content) => content.startsWith('Some assets are not available through this interface')),
    ).toBeNull()
  })
})

describe('UnsupportedCurrencyFooter.tsx with no unsupported tokens', () => {
  beforeEach(() => {
    mocked(getExplorerLink).mockReturnValue(unsupportedTokenExplorerLink)
  })

  it('works as expected when no unsupported tokens exist', async () => {
    mocked(useCurrencyInfo).mockReturnValue({
      currencyId: unsupportedTokenAddress,
      logoUrl: '',
      currency: unsupportedToken,
      safetyInfo: {
        tokenList: TokenList.Default,
        protectionResult: ProtectionResult.Benign,
      },
    })
    const rendered = render(<UnsupportedCurrencyFooter show={true} currencies={[unsupportedToken]} />)

    await userEvent.click(screen.getByTestId(TestID.ReadMoreButton))

    // Wait for the modal to open and content to appear
    await screen.findByText('Unsupported assets')
    expect(screen.getByText('Unsupported assets')).toBeInTheDocument()
    expect(
      screen.getByText((content) => content.startsWith('Some assets are not available through this interface')),
    ).toBeInTheDocument()
    expect(rendered.queryByTestId('unsupported-token-card')).toBeNull()
    await userEvent.click(screen.getByTestId('close-icon'))

    // Wait for the modal to close by checking that the elements are no longer present
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(rendered.queryByText('Unsupported assets')).toBeNull()
    expect(
      rendered.queryByText((content) => content.startsWith('Some assets are not available through this interface')),
    ).toBeNull()
  })
})
