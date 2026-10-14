import { fireEvent as rtlFireEvent } from '@testing-library/react'
import { SharedEventName } from '@uniswap/analytics-events'
import { Token } from '@uniswap/sdk-core'
import { type GasFeeResult, TradingApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import type { ReactNode } from 'react'
import { RouteDiagramInfo } from 'uniswap/src/features/transactions/swap/components/RoutingInfo/RouteDiagram/RouteDiagramInfo.web'
import { createMockCurrencyAmount, createMockTradeWithStatus } from 'uniswap/src/test/fixtures/transactions/swap'
import { renderWithProviders } from 'uniswap/src/test/render'
import { act } from 'uniswap/src/test/test-utils'
import { buildRouteDiagram } from 'uniswap/src/utils/routingDiagram/routeGraph/buildRouteDiagram'

const modalPropsSpy = vi.hoisted(() => vi.fn())
const { mockSendEvent } = vi.hoisted(() => ({ mockSendEvent: vi.fn() }))

vi.mock('utilities/src/telemetry/analytics/analytics', () => ({
  analytics: { sendEvent: mockSendEvent },
}))

// The diagram measures its container (ResizeObserver); the row and modal wiring is what is under test.
vi.mock('uniswap/src/features/transactions/swap/components/RoutingInfo/RouteDiagram/RouteSankey', () => ({
  RouteSankey: () => null,
}))

const { mockGasFeeUSD } = vi.hoisted(() => ({ mockGasFeeUSD: { value: '1.61' as string | undefined } }))
vi.mock('uniswap/src/features/gas/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/gas/hooks')>()),
  useUSDValueOfGasFee: (): { isLoading: boolean; value: string | undefined } => ({
    isLoading: false,
    value: mockGasFeeUSD.value,
  }),
}))

vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: (props: { isModalOpen: boolean; children: ReactNode }) => {
    modalPropsSpy(props)
    return props.isModalOpen ? props.children : null
  },
}))

const DAI = new Token(1, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, 'DAI', 'Dai Stablecoin')
const USDC = new Token(1, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', 'USD Coin')
const GAS_FEE: GasFeeResult = {
  value: '500000000000000',
  displayValue: '500000000000000',
  isLoading: false,
  error: null,
}

const diagram = buildRouteDiagram({
  routeGraph: {
    pools: [
      {
        protocol: TradingApi.RouteGraphPool.protocol.V3,
        address: '0x5777d92f208679DB4b9778590Fa3CAB3aC9e2168',
        fee: '100',
        tokenIn: { address: DAI.address, chainId: 1, symbol: 'DAI' },
        tokenOut: { address: USDC.address, chainId: 1, symbol: 'USDC' },
        shareOfInputBps: 10000,
      },
    ],
  },
  chainId: UniverseChainId.Mainnet,
})!

function renderRow(): ReturnType<typeof renderWithProviders> {
  const { trade } = createMockTradeWithStatus(
    createMockCurrencyAmount(DAI, '100000000000000000000'),
    createMockCurrencyAmount(USDC, '99980000'),
  )
  if (!trade) {
    throw new Error('Expected a classic trade')
  }
  return renderWithProviders(
    <RouteDiagramInfo trade={trade} gasFee={GAS_FEE} diagram={diagram} logoUrlByTokenKey={new Map()} />,
  )
}

function openModal(getByText: ReturnType<typeof renderRow>['getByText']): void {
  act(() => {
    rtlFireEvent.click(getByText('common.button.view') as unknown as Element)
  })
}

describe(RouteDiagramInfo, () => {
  beforeEach(() => {
    modalPropsSpy.mockClear()
    mockSendEvent.mockClear()
    mockGasFeeUSD.value = '1.61'
  })

  // The test i18n renders keys, so the labels are matched by key.
  it('shows the Route label with a View button and keeps the diagram modal closed', () => {
    const { getByText, queryByText } = renderRow()
    expect(getByText('common.bestRoute')).toBeTruthy()
    expect(modalPropsSpy).toHaveBeenLastCalledWith(expect.objectContaining({ isModalOpen: false }))
    expect(queryByText('swap.routing.guidestar.description')).toBeNull()
  })

  it('opens the diagram modal from the View button', () => {
    const { getByText } = renderRow()
    openModal(getByText)
    expect(modalPropsSpy).toHaveBeenLastCalledWith(expect.objectContaining({ isModalOpen: true }))
    expect(getByText('swap.routing.guidestar.description')).toBeTruthy()
  })

  it('logs a View press with the pool count', () => {
    const { getByTestId } = renderRow()
    act(() => {
      rtlFireEvent.click(getByTestId(TestID.SwapRouteDiagramView) as unknown as Element)
    })
    expect(mockSendEvent).toHaveBeenCalledWith(
      SharedEventName.ELEMENT_CLICKED,
      expect.objectContaining({ element: 'swap-route-diagram-view', pool_count: 1 }),
    )
  })

  it('does not count a native <-> wrapped conversion as a pool', () => {
    const { trade } = createMockTradeWithStatus(
      createMockCurrencyAmount(DAI, '100000000000000000000'),
      createMockCurrencyAmount(USDC, '99980000'),
    )
    const withWrap = buildRouteDiagram({
      routeGraph: {
        pools: [
          {
            protocol: TradingApi.RouteGraphPool.protocol.WRAP,
            tokenIn: { address: '0x0000000000000000000000000000000000000000', chainId: 1, symbol: 'ETH' },
            tokenOut: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', chainId: 1, symbol: 'WETH' },
            shareOfInputBps: 10000,
          },
          {
            protocol: TradingApi.RouteGraphPool.protocol.V3,
            address: '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640',
            fee: '500',
            tokenIn: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', chainId: 1, symbol: 'WETH' },
            tokenOut: { address: USDC.address, chainId: 1, symbol: 'USDC' },
            shareOfInputBps: 10000,
          },
        ],
      },
      chainId: UniverseChainId.Mainnet,
    })!
    const { getByTestId } = renderWithProviders(
      <RouteDiagramInfo trade={trade!} gasFee={GAS_FEE} diagram={withWrap} logoUrlByTokenKey={new Map()} />,
    )
    act(() => {
      rtlFireEvent.click(getByTestId(TestID.SwapRouteDiagramView) as unknown as Element)
    })
    expect(mockSendEvent).toHaveBeenCalledWith(
      SharedEventName.ELEMENT_CLICKED,
      expect.objectContaining({ element: 'swap-route-diagram-view', pool_count: 1 }),
    )
  })

  it('heads the modal with the trade amounts, provider and hop count, and links the routing docs', () => {
    const { getByText } = renderRow()
    openModal(getByText)
    expect(getByText('100 DAI')).toBeTruthy()
    expect(getByText('99.98 USDC')).toBeTruthy()
    expect(getByText('swap.routing.guidestar.via')).toBeTruthy()
    expect(getByText('swap.routing.guidestar.hops')).toBeTruthy()
    expect((getByText('Learn more') as unknown as Element).getAttribute('href')).toBe(
      'https://developers.uniswap.org/docs/trading/swapping-api/amm-vs-uniswapx-routing',
    )
  })

  it('shows the network cost after the hop count, and leaves it out until it is known', () => {
    const { getByText, unmount } = renderRow()
    openModal(getByText)
    expect(getByText('$1.61')).toBeTruthy()
    unmount()

    mockGasFeeUSD.value = undefined
    const { getByText: getByTextNoGas, queryByText } = renderRow()
    openModal(getByTextNoGas)
    expect(getByTextNoGas('swap.routing.guidestar.hops')).toBeTruthy()
    expect(queryByText('$1.61')).toBeNull()
  })
})
