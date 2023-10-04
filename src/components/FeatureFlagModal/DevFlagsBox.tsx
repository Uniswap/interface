import { BaseVariant, featureFlagSettings } from 'featureFlags'
import { useAtomValue } from 'jotai/utils'
import { useMemo, useState } from 'react'
import { useGate } from 'statsig-react'
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
const TopBar = styled.div`
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
`
const Gate = ({ flagSetting }: { flagSetting: [string, string] }) => {
  const [flagName, setting] = flagSetting
  const gateResult = useGate(flagName)
  if (gateResult) {
    const { value: statsigValue } = gateResult
    const settingValue = setting === BaseVariant.Enabled
    if (statsigValue !== settingValue) {
      return (
        <ThemedText.LabelSmall key={flagName}>
          {flagName}: {setting}
        </ThemedText.LabelSmall>
      )
    }
  }
  return null
}

export default function DevFlagsBox() {
  const featureFlagsAtom = useAtomValue(featureFlagSettings)
  const featureFlags = useMemo(() => Object.entries(featureFlagsAtom), [featureFlagsAtom])

  const [isCollapsed, setIsCollapsed] = useState(false)
  const toggleCollapse = () => setIsCollapsed(!isCollapsed)

  const overrides = featureFlags.map((flag) => Gate({ flagSetting: flag }))
  const hasNoOverrides = useMemo(() => overrides.every((g) => g === null), [overrides])

  return (
    <Box>
      <TopBar onClick={toggleCollapse}>
        <ThemedText.SubHeader>
          {isStagingEnv() && 'Staging build overrides'}
          {isDevelopmentEnv() && 'Development build overrides'}
        </ThemedText.SubHeader>
        {isCollapsed ? '😿☝️' : '😺👇'}
      </TopBar>
      {!isCollapsed && overrides}
      {!isCollapsed && hasNoOverrides && <ThemedText.LabelSmall>No overrides</ThemedText.LabelSmall>}
    </Box>
  )
}
