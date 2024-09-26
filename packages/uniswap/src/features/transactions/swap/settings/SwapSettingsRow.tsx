import { PropsWithChildren, useCallback, useState } from 'react'
import { Flex, Separator, Text, TouchableArea } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { iconSizes } from 'ui/src/theme'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { SwapSettingConfig } from 'uniswap/src/features/transactions/swap/settings/configs/types'
import { useTranslation } from 'uniswap/src/i18n'

interface SwapSettingRowProps {
  setting: SwapSettingConfig
  setSelectedSetting: (setting: SwapSettingConfig) => void
  index: number
}

export function SwapSettingRow({ setting, setSelectedSetting, index }: SwapSettingRowProps): JSX.Element | null {
  const { renderTitle, Control, Description, Screen, InfoModal, featureFlag } = setting
  const { t } = useTranslation()
  const [showInfoModal, setShowInfoModal] = useState(false)

  const onPressControl = useCallback(() => {
    // If the setting has a screen, navigate to it, else inline control will handle the interaction.
    if (Screen) {
      setSelectedSetting(setting)
    }
  }, [Screen, setting, setSelectedSetting])

  const row = (
    <>
      {index > 0 && <Separator backgroundColor="$surface3" />}
      <Flex>
        <Flex centered row gap="$spacing16" justifyContent="space-between">
          <TouchableArea onPress={(): void => setShowInfoModal(true)}>
            <Flex gap="$spacing4">
              <Flex row alignItems="center" gap="$spacing4">
                <Text color="$neutral1" variant="subheading2">
                  {renderTitle(t)}
                </Text>
                {InfoModal && <InfoCircleFilled color="$neutral3" size={iconSizes.icon16} />}
              </Flex>
              {Description && (
                <Text color="$neutral2" variant="body3">
                  <Description />
                </Text>
              )}
            </Flex>
          </TouchableArea>
          <TouchableArea flexShrink={1} onPress={onPressControl}>
            <Flex row alignItems="center" gap="$spacing4" justifyContent="flex-end">
              <Control />
              {Screen && <RotatableChevron color="$neutral3" direction="right" height={iconSizes.icon24} />}
            </Flex>
          </TouchableArea>
        </Flex>
        {InfoModal && <InfoModal isOpen={showInfoModal} onClose={(): void => setShowInfoModal(false)} />}
      </Flex>
    </>
  )

  // Conditional wrapper logic is needed to follow rules of hooks due to optional feature flag
  if (featureFlag) {
    return <GateWrapper featureFlag={featureFlag}>{row}</GateWrapper>
  } else {
    return row
  }
}

function GateWrapper({ featureFlag, children }: PropsWithChildren<{ featureFlag: FeatureFlags }>): JSX.Element | null {
  const enabled = useFeatureFlag(featureFlag)
  if (!enabled) {
    return null
  }
  return <>{children}</>
}
