import { Protocol } from '@uniswap/router-sdk'
import { Currency, Percent } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import RoutingDiagram from 'components/RoutingDiagram/RoutingDiagram'
import { render } from 'test-utils/render'
import { DAI, USDC_MAINNET, WBTC } from 'uniswap/src/constants/tokens'
import { RoutingDiagramEntry } from 'utils/getRoutingDiagramEntries'

const percent = (strings: TemplateStringsArray) => new Percent(parseInt(strings[0]), 100)

const singleRoute: RoutingDiagramEntry = {
  percent: percent`100`,
  path: [[USDC_MAINNET, DAI, FeeAmount.LOW]],
  protocol: Protocol.V3,
}

const multiRoute: RoutingDiagramEntry[] = [
  { percent: percent`75`, path: [[USDC_MAINNET, DAI, FeeAmount.LOWEST]], protocol: Protocol.V2 },
  {
    percent: percent`25`,
    path: [
      [USDC_MAINNET, WBTC, FeeAmount.MEDIUM],
      [WBTC, DAI, FeeAmount.HIGH],
    ],
    protocol: Protocol.V3,
  },
]

jest.mock(
  'components/Logo/CurrencyLogo',
  () =>
    ({ currency }: { currency: Currency }) =>
      `CurrencyLogo currency=${currency.symbol}`,
)

jest.mock('../Popover', () => () => 'Popover')

it('renders when no routes are provided', () => {
  const { asFragment } = render(<RoutingDiagram currencyIn={DAI} currencyOut={USDC_MAINNET} routes={[]} />)
  expect(asFragment()).toMatchSnapshot()
})

it('renders single route', () => {
  const { asFragment } = render(<RoutingDiagram currencyIn={USDC_MAINNET} currencyOut={DAI} routes={[singleRoute]} />)
  expect(asFragment()).toMatchSnapshot()
})

it('renders multi route', () => {
  const { asFragment } = render(<RoutingDiagram currencyIn={USDC_MAINNET} currencyOut={DAI} routes={multiRoute} />)
  expect(asFragment()).toMatchSnapshot()
})
