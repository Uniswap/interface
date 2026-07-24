import { PortfolioBalancePart } from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
import {
  getPortfolioRelativeChangeDisplay,
  PortfolioRelativeChangeDisplay,
} from 'uniswap/src/features/portfolio/PortfolioBalance/getPortfolioRelativeChangeDisplay'

type Params = Parameters<typeof getPortfolioRelativeChangeDisplay>[0]

function getDisplay(overrides: Partial<Params> = {}): PortfolioRelativeChangeDisplay {
  return getPortfolioRelativeChangeDisplay({
    enabled: true,
    part: PortfolioBalancePart.Total,
    backendPercentChangeUnavailable: false,
    hasOverride: false,
    hidePercentChange: false,
    isLoading: false,
    ...overrides,
  })
}

describe(getPortfolioRelativeChangeDisplay, () => {
  it('returns Change when the backend value is available', () => {
    expect(getDisplay({ backendPercentChangeUnavailable: false })).toBe(PortfolioRelativeChangeDisplay.Change)
  })

  it('returns Change when the feature flag is disabled, even if the value is unavailable', () => {
    expect(
      getDisplay({
        enabled: false,
        part: PortfolioBalancePart.Total,
        backendPercentChangeUnavailable: true,
      }),
    ).toBe(PortfolioRelativeChangeDisplay.Change)
  })

  it('returns Unavailable for the Total part when the backend omits the value', () => {
    expect(
      getDisplay({
        part: PortfolioBalancePart.Total,
        backendPercentChangeUnavailable: true,
      }),
    ).toBe(PortfolioRelativeChangeDisplay.Unavailable)
  })

  it('returns Change for the Total part when the percent change is hidden', () => {
    expect(
      getDisplay({
        part: PortfolioBalancePart.Total,
        backendPercentChangeUnavailable: true,
        hidePercentChange: true,
      }),
    ).toBe(PortfolioRelativeChangeDisplay.Change)
  })

  it('returns Change when a chart-derived override is provided', () => {
    expect(
      getDisplay({
        part: PortfolioBalancePart.Total,
        backendPercentChangeUnavailable: true,
        hasOverride: true,
      }),
    ).toBe(PortfolioRelativeChangeDisplay.Change)
  })

  it('returns Change while loading', () => {
    expect(
      getDisplay({
        part: PortfolioBalancePart.Total,
        backendPercentChangeUnavailable: true,
        isLoading: true,
      }),
    ).toBe(PortfolioRelativeChangeDisplay.Change)
  })

  it('returns Omit for the Pools part when the backend omits the value', () => {
    expect(
      getDisplay({
        part: PortfolioBalancePart.Pools,
        backendPercentChangeUnavailable: true,
      }),
    ).toBe(PortfolioRelativeChangeDisplay.Omit)
  })

  it('returns Change for the Pools part when the backend value is available', () => {
    expect(
      getDisplay({
        part: PortfolioBalancePart.Pools,
        backendPercentChangeUnavailable: false,
      }),
    ).toBe(PortfolioRelativeChangeDisplay.Change)
  })
})
