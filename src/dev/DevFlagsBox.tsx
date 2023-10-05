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
const Gate = ([flagName, flagSetting]: [string, string]) => {
  const gateResult = useGate(flagName)
  if (gateResult) {
    const { value: statsigValue } = gateResult
    const settingValue = flagSetting === BaseVariant.Enabled
    if (statsigValue !== settingValue) {
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
  const featureFlagsAtom = useAtomValue(featureFlagSettings)
  const featureFlags = Object.entries(featureFlagsAtom)

  // const featureFlags = useMemo(() => Object.entries(featureFlagsAtom), [featureFlagsAtom])

  const [isOpen, setIsOpen] = useState(true)
  const toggleOpen = () => setIsOpen((open) => !open)

  console.log('NUMBER OF FEATURE FLAGS', featureFlags.length)
  console.log('NUMBER ', featureFlags)

  const overrides = featureFlags.map((flag) => Gate(flag))
  const hasOverrides = overrides.some((g) => g !== null)

  // const hasOverrides = useMemo(() => overrides.some((g) => g !== null), [overrides])

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
