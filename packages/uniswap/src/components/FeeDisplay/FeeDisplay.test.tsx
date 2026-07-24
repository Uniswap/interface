import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Flex, Text } from 'ui/src'
import { FeeDisplay } from 'uniswap/src/components/FeeDisplay/FeeDisplay'
import type { InfoTooltipProps } from 'uniswap/src/components/tooltip/InfoTooltipProps'
import type { FeeBreakdown } from 'uniswap/src/features/fees/types'
import { renderWithProviders } from 'uniswap/src/test/render'

const mockPlatform = vi.hoisted(() => ({ isWebPlatform: true }))

vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    get isWebPlatform(): boolean {
      return mockPlatform.isWebPlatform
    },
  }
})

// Render the tooltip content inline so the breakdown rows are queryable without hover simulation.
vi.mock('uniswap/src/components/tooltip/InfoTooltip', () => ({
  InfoTooltip: ({ trigger, text }: InfoTooltipProps): JSX.Element => (
    <>
      {trigger}
      <Flex testID="tooltip-content">{text}</Flex>
    </>
  ),
}))

function breakdown(overrides: Partial<FeeBreakdown> = {}): FeeBreakdown {
  return {
    lpFeeBps: 30,
    protocolFeeBps: 5,
    effectiveFeeBps: 35,
    version: ProtocolVersion.V4,
    ...overrides,
  }
}

// The caller owns the headline line; FeeDisplay only decorates it with the hover breakdown.
function headline(): JSX.Element {
  return <Text testID="headline">headline</Text>
}

describe('FeeDisplay', () => {
  beforeEach(() => {
    mockPlatform.isWebPlatform = true
  })

  it('renders only the children when no breakdown is provided (transparent wrapper)', () => {
    const { getByTestId, queryByTestId } = renderWithProviders(<FeeDisplay>{headline()}</FeeDisplay>)

    expect(getByTestId('headline')).toBeTruthy()
    expect(queryByTestId('tooltip-content')).toBeNull()
  })

  it('renders only the children without a tooltip when the protocol fee is 0', () => {
    const { getByTestId, queryByTestId } = renderWithProviders(
      <FeeDisplay feeBreakdown={breakdown({ protocolFeeBps: 0, effectiveFeeBps: 30 })}>{headline()}</FeeDisplay>,
    )

    expect(getByTestId('headline')).toBeTruthy()
    expect(queryByTestId('tooltip-content')).toBeNull()
  })

  it('renders only the children without a tooltip when the protocol fee is unavailable', () => {
    const { getByTestId, queryByTestId } = renderWithProviders(
      <FeeDisplay feeBreakdown={breakdown({ protocolFeeBps: undefined, effectiveFeeBps: 30 })}>
        {headline()}
      </FeeDisplay>,
    )

    expect(getByTestId('headline')).toBeTruthy()
    expect(queryByTestId('tooltip-content')).toBeNull()
  })

  it('renders LP, protocol, and total rows plus the v4 explainer in full mode', () => {
    // v4 (lp 0.30% + protocol 0.05% = 0.35% effective): the breakdown shows LP 0.30% / protocol
    // 0.05% / total 0.35%.
    const { getByText } = renderWithProviders(<FeeDisplay feeBreakdown={breakdown()}>{headline()}</FeeDisplay>)

    expect(getByText('0.30%')).toBeTruthy()
    expect(getByText('0.05%')).toBeTruthy()
    expect(getByText('0.35%')).toBeTruthy()
    expect(getByText('fee.breakdown.lp')).toBeTruthy()
    expect(getByText('fee.breakdown.protocol')).toBeTruthy()
    expect(getByText('fee.breakdown.total')).toBeTruthy()
    expect(getByText('fee.breakdown.explainer')).toBeTruthy()
  })

  it('renders the real subtractive split for a v2 served breakdown, not the unavailable note', () => {
    const { getByText, queryByText } = renderWithProviders(
      <FeeDisplay
        feeBreakdown={breakdown({
          lpFeeBps: 25,
          protocolFeeBps: 5,
          effectiveFeeBps: 30,
          version: ProtocolVersion.V2,
        })}
      >
        {headline()}
      </FeeDisplay>,
    )

    // The hover shows LP 0.25% / protocol 0.05% / total 0.30%.
    expect(getByText('0.25%')).toBeTruthy()
    expect(getByText('0.05%')).toBeTruthy()
    expect(getByText('0.30%')).toBeTruthy()
    expect(getByText('fee.breakdown.protocol')).toBeTruthy()
    expect(getByText('fee.breakdown.total')).toBeTruthy()
    expect(getByText('fee.breakdown.explainerSubtractive')).toBeTruthy()
    expect(queryByText('fee.breakdown.unavailable')).toBeNull()
  })

  it('keeps the three-row breakdown for v2/v3 even when the protocol fee is 0', () => {
    const { getByText, queryByTestId } = renderWithProviders(
      <FeeDisplay
        feeBreakdown={breakdown({
          lpFeeBps: 30,
          protocolFeeBps: 0,
          effectiveFeeBps: 30,
          version: ProtocolVersion.V3,
        })}
      >
        {headline()}
      </FeeDisplay>,
    )

    expect(queryByTestId('tooltip-content')).toBeTruthy()
    expect(getByText('fee.breakdown.protocol')).toBeTruthy()
    expect(getByText('fee.breakdown.total')).toBeTruthy()
  })

  it('renders the subtractive explainer for v2/v3 served breakdowns', () => {
    const { getByText } = renderWithProviders(
      <FeeDisplay
        feeBreakdown={breakdown({
          lpFeeBps: 28.75,
          protocolFeeBps: 1.25,
          effectiveFeeBps: 30,
          version: ProtocolVersion.V3,
        })}
      >
        {headline()}
      </FeeDisplay>,
    )

    expect(getByText('fee.breakdown.explainerSubtractive')).toBeTruthy()
  })

  it('renders the children only on native, even in full mode', () => {
    mockPlatform.isWebPlatform = false

    const { getByTestId, queryByTestId } = renderWithProviders(
      <FeeDisplay feeBreakdown={breakdown()}>{headline()}</FeeDisplay>,
    )

    expect(getByTestId('headline')).toBeTruthy()
    expect(queryByTestId('tooltip-content')).toBeNull()
  })
})
