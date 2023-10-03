import { BaseVariant, featureFlagSettings } from 'featureFlags'
import { useAtomValue } from 'jotai/utils'
import { useState } from 'react'
import { useGate } from 'statsig-react'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { isDevelopmentEnv, isStagingEnv } from 'utils/env'

const Box = styled.div`
  position: fixed;
  bottom: 20px;
  left: 20px;
  backgroundcolor: ${({ theme }) => theme.surface1};
  padding: 10px;
  border: 1px solid ${({ theme }) => theme.accent1};
  zindex: 1000;
  width: 300px;
`

export default function DevFlagsBox() {
  const shouldShow = isDevelopmentEnv() || isStagingEnv()
  const featureFlags = Object.entries(useAtomValue(featureFlagSettings))

  const overrides = []
  for (const [flag, setting] of featureFlags) {
    const { value: statsigValue } = useGate(flag)
    const settingValue = setting === BaseVariant.Enabled
    if (statsigValue !== settingValue) {
      overrides.push([flag, setting])
    }
  }

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
