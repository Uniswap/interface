import { PropsWithChildren, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { iconSizes } from 'ui/src/theme'
import { InfoTooltip } from 'uniswap/src/components/tooltip/InfoTooltip'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'

interface TransactionSettingRowProps {
  setting: TransactionSettingConfig
  setSelectedSetting: (setting: TransactionSettingConfig) => void
  warning?: JSX.Element | undefined
}

export function TransactionSettingRow({
  setting,
  setSelectedSetting,
  warning,
}: TransactionSettingRowProps): JSX.Element | null {
  const { renderTitle, renderTooltip, Control, Description, Screen, InfoModal, featureFlag } = setting
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
      <Flex>
        <Flex centered row columnGap="$spacing16" justifyContent="space-between">
          <TouchableArea onPress={(): void => setShowInfoModal(true)}>
            <Flex gap="$spacing2" justifyContent="center" minHeight={48}>
              <Flex row alignItems="center" gap="$spacing4">
                <Text color="$neutral1" variant="subheading2">
                  {renderTitle(t)}
                </Text>
                {InfoModal && <InfoCircleFilled color="$neutral3" size="$icon.16" />}
                {!!renderTooltip && (
                  <InfoTooltip
                    trigger={
                      <TouchableArea>
                        <InfoCircleFilled color="$neutral3" size="$icon.16" />
                      </TouchableArea>
                    }
                    text={renderTooltip(t)}
                  />
                )}
              </Flex>
              {Description && (
                <Text color="$neutral2" variant="body3">
                  <Description />
                </Text>
              )}
              {warning}
            </Flex>
          </TouchableArea>
          <TouchableArea
            group
            flexDirection="row"
            alignItems="center"
            gap="$spacing4"
            justifyContent="flex-end"
            flexShrink={1}
            onPress={onPressControl}
          >
            <Control />
            {Screen && <RotatableChevron color="$neutral3" direction="right" height={iconSizes.icon24} />}
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
