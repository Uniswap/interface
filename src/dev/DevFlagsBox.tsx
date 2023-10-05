import { BaseVariant, FeatureFlag, featureFlagSettings as featureFlagSettingsAtom } from 'featureFlags'
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

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    bottom: 70px;
  }
`
const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
`
const Gate = (flagName: string, featureFlagSettings: Record<string, string>) => {
  const gateResult = useGate(flagName)
  if (gateResult) {
    const { value: statsigValue }: { value: boolean } = gateResult
    const flagSetting = featureFlagSettings[flagName]
    const settingValue: boolean = flagSetting === BaseVariant.Enabled
    if (flagSetting && statsigValue !== settingValue) {
      return (
        <ThemedText.LabelSmall key={flagName}>
          {flagName}: {flagSetting}
        </ThemedText.LabelSmall>
      )
    }
  }
  return null
}

export default function DevFlagsBox() {
  const featureFlagsAtom = useAtomValue(featureFlagSettingsAtom)
  const featureFlags = useMemo(() => Object.values(FeatureFlag), [])

  const overrides = featureFlags.map((flagName) => Gate(flagName, featureFlagsAtom))
  const hasOverrides = overrides.some((g) => g !== null)

  const [isOpen, setIsOpen] = useState(true)
  const toggleOpen = () => setIsOpen((open) => !open)

  return (
    <Box>
      <TopBar onClick={toggleOpen}>
        {isOpen ? '😺👇' : '😿☝️'}
        {isOpen && (
          <ThemedText.SubHeader>
            {isStagingEnv() && 'Staging build overrides'}
            {isDevelopmentEnv() && 'Development build overrides'}
          </ThemedText.SubHeader>
        )}
      </TopBar>
      {isOpen && (hasOverrides ? overrides : <ThemedText.LabelSmall>No overrides</ThemedText.LabelSmall>)}
    </Box>
  )
}
