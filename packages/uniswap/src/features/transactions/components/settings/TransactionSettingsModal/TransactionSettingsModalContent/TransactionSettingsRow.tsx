import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex } from '@universe/mycelium'
import { InfoCircleFilled } from '@universe/mycelium/icons/InfoCircleFilled'
import { SettingsRow } from '@universe/transactions-ui'
import { PropsWithChildren, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { InfoTooltip } from 'uniswap/src/components/tooltip/InfoTooltip'
import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'

interface TransactionSettingRowProps {
  setting: TransactionSettingConfig
  setSelectedSetting: (setting: TransactionSettingConfig) => void
}

export function TransactionSettingRow({ setting, setSelectedSetting }: TransactionSettingRowProps): JSX.Element | null {
  const {
    renderTitle,
    renderTooltip,
    tooltipLearnMoreUrl,
    Control,
    Description,
    Screen,
    InfoModal,
    featureFlag,
    Warning,
  } = setting
  const { t } = useTranslation()

  const [showInfoModal, setShowInfoModal] = useState(false)

  // Inline controls handle their own interaction; only a setting with a screen navigates.
  const onPressControl = useCallback(() => setSelectedSetting(setting), [setting, setSelectedSetting])
  const onPressInfo = useCallback(() => setShowInfoModal(true), [])
  const onCloseInfoModal = useCallback(() => setShowInfoModal(false), [])

  const settingsRow = (
    <SettingsRow
      label={renderTitle(t)}
      description={Description ? <Description /> : undefined}
      infoTooltip={
        renderTooltip ? (
          <InfoTooltip
            trigger={<InfoCircleFilled color="$neutral3" size="$icon.16" />}
            text={renderTooltip(t)}
            button={
              tooltipLearnMoreUrl ? (
                <LearnMoreLink url={tooltipLearnMoreUrl} textVariant="buttonLabel4" textColor="$neutral1" />
              ) : undefined
            }
          />
        ) : undefined
      }
      warning={Warning ? <Warning /> : undefined}
      value={<Control />}
      onPress={Screen ? onPressControl : undefined}
      onPressInfo={InfoModal ? onPressInfo : undefined}
    />
  )

  // The info modal stays inside the row's frame, as before: a closed web Modal still renders an
  // empty wrapper for a moment, which the list's gap would space out.
  const row = InfoModal ? (
    <Flex>
      {settingsRow}
      <InfoModal isOpen={showInfoModal} onClose={onCloseInfoModal} />
    </Flex>
  ) : (
    settingsRow
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
