import { ColumnCenter } from 'components/Column'
import { RowBetween } from 'components/Row'
import {
  BaseVariant,
  dynamicConfigSettings as dynamicConfigSettingsAtom,
  FeatureFlag,
  featureFlagSettings as featureFlagSettingsAtom,
} from 'featureFlags'
import { DynamicConfigName, useDynamicConfig } from 'featureFlags/dynamicConfig'
import { useAtomValue } from 'jotai/utils'
import { useMemo, useState } from 'react'
import { Flag, Settings } from 'react-feather'
import { useCloseModal, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { useGate } from 'statsig-react'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { Z_INDEX } from 'theme/zIndex'
import { isDevelopmentEnv, isStagingEnv } from 'utils/env'

const Box = styled.div`
  position: fixed;
  bottom: 20px;
  left: 20px;
  background-color: ${({ theme }) => theme.surface1};
  padding: 10px;
  border: 1px solid ${({ theme }) => theme.surface3};
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0px 0px 10px 0px rgba(34, 34, 34, 0.04);
  user-select: none;
  z-index: ${Z_INDEX.fixed};

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    bottom: 70px;
  }
`
const Gate = (flagName: FeatureFlag, featureFlagSettings: Record<string, string>) => {
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

const Config = (name: DynamicConfigName, savedSettings: Record<string, any>) => {
  const statsigConfig = useDynamicConfig(name)
  if (statsigConfig) {
    const statsigValue = statsigConfig.getValue()
    const setting = savedSettings[name]
    if (setting && statsigValue !== setting) {
      return (
        <ThemedText.LabelSmall key={name}>
          {name}: {JSON.stringify(setting[name])}
        </ThemedText.LabelSmall>
      )
    }
  }
  return null
}

const SettingsContainer = styled(ColumnCenter)`
  width: 30px;
  height: 30px;
  justify-content: center;
  border-radius: 12px;
  :hover {
    background: ${({ theme }) => theme.surface2};
  }
`

export default function DevFlagsBox() {
  const featureFlagsAtom = useAtomValue(featureFlagSettingsAtom)
  const featureFlags = useMemo(() => Object.values(FeatureFlag), [])
  const dynamicConfigsAtom = useAtomValue(dynamicConfigSettingsAtom)
  const dynamicConfigs = useMemo(() => Object.values(DynamicConfigName), [])

  const overrides = featureFlags.map((flagName) => Gate(flagName, featureFlagsAtom))
  dynamicConfigs.forEach((configName) => overrides.push(Config(configName, dynamicConfigsAtom)))

  const hasOverrides = overrides.some((g) => g !== null)

  const [isOpen, setIsOpen] = useState(false)
  const toggleOpen = () => setIsOpen((open) => !open)
  const toggleFeatureFlagsModal = useToggleModal(ApplicationModal.FEATURE_FLAGS)
  const closeFeatureFlagsModal = useCloseModal()

  return (
    <Box
      onClick={() => {
        toggleOpen()
        closeFeatureFlagsModal()
      }}
    >
      {isOpen ? (
        <RowBetween>
          <ThemedText.SubHeader>
            {isDevelopmentEnv() && 'Local Overrides'}
            {isStagingEnv() && 'Staging Overrides'}
          </ThemedText.SubHeader>
          <SettingsContainer
            onClick={(e) => {
              e.stopPropagation()
              toggleFeatureFlagsModal()
            }}
          >
            <Settings width={15} height={15} />
          </SettingsContainer>
        </RowBetween>
      ) : (
        <Flag />
      )}

      {isOpen && (hasOverrides ? overrides : <ThemedText.LabelSmall>No overrides</ThemedText.LabelSmall>)}
    </Box>
  )
}
