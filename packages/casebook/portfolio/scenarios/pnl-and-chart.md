# Portfolio scenarios — PnL & performance chart

Profit & Loss (performance) metrics and the portfolio value chart, including the
mobile chart happy-path flow and relative-change display logic. Shared defaults:
`_defaults.yaml`.

---
id: portfolio-pnl-metrics
title: Profit & Loss / performance metrics display for wallet and assets
# importance
priority: high
severity: high
# provenance
source: testlio
sourceNote: "(a) Testlio 'Profit & Loss - iOS/Android/Extension' and Web 'Profit & Loss'; (b) unit getPortfolioRelativeChangeDisplay.test.ts + portfolioChartPercentChange.test.ts"
testlioRef: Profit & Loss
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - portfolio
  - pnl
wallets:
  - TW-PORTFOLIO-02
# execution
automatable: true
testLevel: integration
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/portfolio/PortfolioBalance/PortfolioRelativeChange.tsx
  - packages/uniswap/src/features/portfolio/PortfolioBalance/getPortfolioRelativeChangeDisplay.ts
  - packages/uniswap/src/features/portfolio/portfolioChartPercentChange.ts
automationRefs:
  - path: packages/uniswap/src/features/portfolio/PortfolioBalance/getPortfolioRelativeChangeDisplay.test.ts
    testName: getPortfolioRelativeChangeDisplay > returns Change when the backend value is available
  - path: packages/uniswap/src/features/portfolio/portfolioChartPercentChange.test.ts
    testName: getPortfolioChartPercentChange > computes positive percent change
  - path: packages/uniswap/src/features/portfolio/portfolioChartPercentChange.test.ts
    testName: getPortfolioChartPercentChange > computes negative percent change
---

> **high · integration · pr-check · automated**

**Given** a funded wallet (TW-PORTFOLIO-02) with the profit_loss feature enabled
**When** the user views the portfolio balance and the tokens table
**Then** the absolute and percentage profit/loss are computed from the first and last chart values and displayed for both the whole wallet and individual assets, with correct sign and magnitude

---
id: portfolio-chart-mobile-happy-path
title: Mobile portfolio chart expands, switches time periods, and closes
# importance
priority: medium
severity: medium
# provenance
source: existing-e2e
sourceNote: "(a) mobile Maestro apps/mobile/.maestro/flows/portfolio/portfolio-chart-happy-path.yaml (gated on profit_loss); (b) unit portfolioChartPercentChange.test.ts"
# scope
platforms:
  - mobile
labels:
  - regression
  - portfolio
  - pnl
  - chart
wallets:
  - TW-PORTFOLIO-02
# execution
automatable: true
testLevel: e2e
runFrequency: release
# coverage
code_paths:
  - packages/uniswap/src/features/portfolio/chartPeriod.ts
  - packages/uniswap/src/features/portfolio/portfolioChartPercentChange.ts
automationRefs:
  - path: apps/mobile/.maestro/flows/portfolio/portfolio-chart-happy-path.yaml
    testName: portfolio-chart-happy-path
---

> **medium · e2e · release · automated**

**Given** a funded wallet (TW-PORTFOLIO-02) on mobile home with the profit_loss gate enabled
**When** the user taps the collapsed chart to open details and taps through each time period (1h, 1d, 1w, 1m, 1y, all)
**Then** the expanded chart, performance section, and period selector appear, the selected period updates on each tap, and the back control collapses the chart back to the home state

---
id: portfolio-relative-change-unavailable
title: Relative change shows an unavailable indicator when backend omits the value
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "(a) unit getPortfolioRelativeChangeDisplay.test.ts (Unavailable/Omit branches); (b) code BalanceUnavailableIndicator / Change1dUnavailableIndicator"
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - portfolio
  - pnl
  - data-liveliness
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/portfolio/PortfolioBalance/getPortfolioRelativeChangeDisplay.ts
  - packages/uniswap/src/features/portfolio/PortfolioBalance/Change1dUnavailableIndicator.tsx
automationRefs:
  - path: packages/uniswap/src/features/portfolio/PortfolioBalance/getPortfolioRelativeChangeDisplay.test.ts
    testName: getPortfolioRelativeChangeDisplay > returns Unavailable for the Total part when the backend omits the value
  - path: packages/uniswap/src/features/portfolio/PortfolioBalance/getPortfolioRelativeChangeDisplay.test.ts
    testName: getPortfolioRelativeChangeDisplay > returns Omit for the Pools part when the backend omits the value
---

> **medium · unit · pr-check · automated**

**Given** the portfolio balance query returns without a relative-change value
**When** `getPortfolioRelativeChangeDisplay` resolves the display for the Total and Pools parts
**Then** the Total part returns an Unavailable indicator (not a fabricated 0%) and the Pools part is omitted, while a present value or the flag-disabled path still returns a Change

---
id: portfolio-chart-percent-change
title: Chart percent change uses first and last values with edge handling
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "(a) unit packages/uniswap/src/features/portfolio/portfolioChartPercentChange.test.ts"
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - portfolio
  - pnl
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/portfolio/portfolioChartPercentChange.ts
automationRefs:
  - path: packages/uniswap/src/features/portfolio/portfolioChartPercentChange.test.ts
    testName: getPortfolioChartPercentChange > uses first and last values only, ignoring intermediates
  - path: packages/uniswap/src/features/portfolio/portfolioChartPercentChange.test.ts
    testName: getPortfolioChartPercentChange > returns undefined when start value is zero
---

> **medium · unit · pr-check · automated**

**Given** an array of chart data points
**When** getPortfolioChartPercentChange is called
**Then** it returns the percent change between the first and last values (ignoring intermediates), returns undefined for empty/single-point/zero-start inputs, and avoids floating-point drift on very small values

---
id: portfolio-balance-diff-within-range
title: Balance-diff tolerance flags chart/portfolio mismatch above threshold
# importance
priority: medium
severity: medium
# provenance
source: existing-unit
sourceNote: "(a) unit packages/uniswap/src/features/portfolio/checkBalanceDiffWithinRange.test.ts"
# scope
platforms:
  - web
  - extension
  - mobile
labels:
  - regression
  - portfolio
  - data-liveliness
  - unit
# execution
automatable: true
testLevel: unit
runFrequency: pr-check
# coverage
code_paths:
  - packages/uniswap/src/features/portfolio/checkBalanceDiffWithinRange.ts
automationRefs:
  - path: packages/uniswap/src/features/portfolio/checkBalanceDiffWithinRange.test.ts
    testName: checkBalanceDiffWithinRange > returns true when values are within 2% threshold
  - path: packages/uniswap/src/features/portfolio/checkBalanceDiffWithinRange.test.ts
    testName: checkBalanceDiffWithinRange > returns false when values exceed 2% threshold
  - path: packages/uniswap/src/features/portfolio/checkBalanceDiffWithinRange.test.ts
    testName: checkBalanceDiffWithinRange > returns true when both are below $10 absolute floor even with >2% diff
---

> **medium · unit · pr-check · automated**

**Given** a chart total balance and a portfolio total balance
**When** checkBalanceDiffWithinRange compares them
**Then** it returns true within the 2% threshold or below the $10 absolute floor, false when the diff exceeds 2% above the floor, and false when either input is undefined
