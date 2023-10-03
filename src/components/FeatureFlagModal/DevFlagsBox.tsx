import { BaseVariant, FeatureFlag, featureFlagSettings } from 'featureFlags'
import { useAtomValue } from 'jotai/utils'
import { useMemo, useState } from 'react'
import { GateResult, useGate } from 'statsig-react'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { isDevelopmentEnv, isStagingEnv } from 'utils/env'

const Box = styled.div`
  position: fixed;
  bottom: 20px;
  left: 20px;
  background-color: ${({ theme }) => theme.surface1};
  padding: 10px;
  border: 1px solid ${({ theme }) => theme.accent1};
  z-index: 1000;
  width: 300px;
`

export default function DevFlagsBox() {
  const shouldShow = isDevelopmentEnv() || isStagingEnv()
  const featureFlags = Object.entries(useAtomValue(featureFlagSettings))

  const statsigValues: { [key: string]: GateResult } = {
    [FeatureFlag.traceJsonRpc]: useGate(FeatureFlag.traceJsonRpc),
    [FeatureFlag.debounceSwapQuote]: useGate(FeatureFlag.debounceSwapQuote),
    [FeatureFlag.fallbackProvider]: useGate(FeatureFlag.fallbackProvider),
    [FeatureFlag.uniswapXSyntheticQuote]: useGate(FeatureFlag.uniswapXSyntheticQuote),
    [FeatureFlag.uniswapXEthOutputEnabled]: useGate(FeatureFlag.uniswapXEthOutputEnabled),
    [FeatureFlag.uniswapXExactOutputEnabled]: useGate(FeatureFlag.uniswapXExactOutputEnabled),
    [FeatureFlag.multichainUX]: useGate(FeatureFlag.multichainUX),
    [FeatureFlag.currencyConversion]: useGate(FeatureFlag.currencyConversion),
    [FeatureFlag.fotAdjustedmentsEnabled]: useGate(FeatureFlag.fotAdjustedmentsEnabled),
    [FeatureFlag.infoExplore]: useGate(FeatureFlag.infoExplore),
    [FeatureFlag.infoTDP]: useGate(FeatureFlag.infoTDP),
    [FeatureFlag.infoPoolPage]: useGate(FeatureFlag.infoPoolPage),
    [FeatureFlag.infoLiveViews]: useGate(FeatureFlag.infoLiveViews),
    [FeatureFlag.uniswapXDefaultEnabled]: useGate(FeatureFlag.uniswapXDefaultEnabled),
    [FeatureFlag.quickRouteMainnet]: useGate(FeatureFlag.quickRouteMainnet),
  }

  const overrides = useMemo(() => {
    const overrides = []
    for (const [flag, setting] of featureFlags) {
      const gateResult = statsigValues[flag]
      if (gateResult) {
        const { value: statsigValue } = gateResult
        const settingValue = setting === BaseVariant.Enabled
        if (statsigValue !== settingValue) {
          overrides.push([flag, setting])
        }
      }
    }
    return overrides
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featureFlags])

  const [isCollapsed, setIsCollapsed] = useState(false)
  const toggleCollapse = () => setIsCollapsed(!isCollapsed)

  if (shouldShow) {
    return (
      <Box>
        <div
          style={{
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'space-between',
          }}
          onClick={toggleCollapse}
        >
          <ThemedText.SubHeader>Feature flag setting overrides</ThemedText.SubHeader>
          {isCollapsed ? '😿☝️' : '😺👇'}
        </div>
        {!isCollapsed &&
          overrides.length &&
          overrides.map(([flag, setting]) => (
            <ThemedText.LabelSmall key={flag}>
              {flag}: {setting}
            </ThemedText.LabelSmall>
          ))}
        {overrides.length === 0 && <ThemedText.LabelSmall>No overrides</ThemedText.LabelSmall>}
      </Box>
    )
  } else {
    return null
  }
}
