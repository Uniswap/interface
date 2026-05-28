import type { TFunction } from 'i18next'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, TouchableArea, isWeb, useMedia } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { iconSizes } from 'ui/src/theme'
import { WarningMessage } from 'uniswap/src/components/WarningMessage/WarningMessage'
import { SLIPPAGE_CRITICAL_TOLERANCE, WARNING_DEADLINE_TOLERANCE } from 'uniswap/src/constants/transactions'
import { TransactionSettingRow } from 'uniswap/src/features/transactions/components/settings/TransactionSettingsModal/TransactionSettingsModalContent/TransactionSettingsRow'
import { TransactionSettingsModalProps } from 'uniswap/src/features/transactions/components/settings/TransactionSettingsModal/types'
import { useTransactionSettingsContext } from 'uniswap/src/features/transactions/components/settings/contexts/TransactionSettingsContext'
import {
  TransactionSettingId,
  type TransactionSettingConfig,
} from 'uniswap/src/features/transactions/components/settings/types'
import { useSlippageSettings } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/slippage/useSlippageSettings'
import { isExtension, isInterfaceDesktop, isMobileApp, isMobileWeb } from 'utilities/src/platform'

function createRowWarningContent({
  t,
  autoSlippageTolerance,
  customSlippageTolerance,
  customDeadline,
}: {
  t: TFunction
  autoSlippageTolerance: number
  customSlippageTolerance?: number
  customDeadline?: number
}): Record<TransactionSettingId, { condition: boolean; render: () => JSX.Element | undefined }> {
  const isCriticalSlippage = Boolean(customSlippageTolerance && customSlippageTolerance >= SLIPPAGE_CRITICAL_TOLERANCE)

  return {
    [TransactionSettingId.SLIPPAGE]: {
      condition: !!customSlippageTolerance && customSlippageTolerance > autoSlippageTolerance,
      render: () => (
        <WarningMessage
          warningMessage={isCriticalSlippage ? t('swap.settings.slippage.warning') : t('swap.settings.slippage.alert')}
          tooltipText={isWeb && !isMobileWeb ? t('swap.settings.slippage.warning.hover') : undefined}
          color={isCriticalSlippage ? '$statusCritical' : '$statusWarning'}
        />
      ),
    },
    [TransactionSettingId.DEADLINE]: {
      condition: !!customDeadline && customDeadline >= WARNING_DEADLINE_TOLERANCE,
      render: () => <WarningMessage warningMessage={t('swap.settings.deadline.warning')} color="$statusWarning" />,
    },
  }
}

const TopLevelSettings = ({
  settings,
  setSelectedSetting,
}: {
  settings: TransactionSettingConfig[]
  setSelectedSetting: React.Dispatch<React.SetStateAction<TransactionSettingConfig | undefined>>
}): JSX.Element => {
  const { t } = useTranslation()
  const { customSlippageTolerance, customDeadline } = useTransactionSettingsContext()
  const { autoSlippageTolerance } = useSlippageSettings()

  const rowWarningContent = useMemo(
    () =>
      createRowWarningContent({
        t,
        customSlippageTolerance,
        autoSlippageTolerance,
        customDeadline,
      }),
    [t, customSlippageTolerance, autoSlippageTolerance, customDeadline],
  )

  const getSettingsRowWarning = (settingId: TransactionSettingId): JSX.Element | undefined => {
    const warning = rowWarningContent[settingId]
    return warning?.condition ? warning.render() : undefined
  }

  return (
    <Flex gap={isWeb ? '$spacing4' : '$spacing8'} py={isWeb ? '$spacing8' : '$spacing12'}>
      {settings.map((setting, index) => {
        const warning = setting.settingId ? getSettingsRowWarning(setting.settingId) : undefined
        return (
          <TransactionSettingRow
            key={`swap-setting-${index}`}
            setSelectedSetting={setSelectedSetting}
            setting={setting}
            warning={warning}
          />
        )
      })}
    </Flex>
  )
}

export const TransactionSettingsModalContent = ({
  settings,
  defaultTitle,
  initialSelectedSetting,
  onClose,
}: Omit<TransactionSettingsModalProps, 'isOpen'>): JSX.Element => {
  const { t } = useTranslation()
  const media = useMedia()

  const [SelectedSetting, setSelectedSetting] = useState<TransactionSettingConfig | undefined>(initialSelectedSetting)

  const title = SelectedSetting ? SelectedSetting.renderTitle(t) : defaultTitle ?? t('swap.settings.title')
  const screen = SelectedSetting?.Screen ? (
    <SelectedSetting.Screen />
  ) : (
    <TopLevelSettings settings={settings} setSelectedSetting={setSelectedSetting} />
  )

  // For selected settings, show title on all platforms unless it is explicitly hidden via hideTitle.
  // For top level settings (not selected), show title on mobile + small screen web only.
  const isWebSmallScreen = media.sm && isWeb
  const shouldShowTitle = SelectedSetting
    ? !SelectedSetting.hideTitle
    : isMobileApp || (isWebSmallScreen && !isExtension)

  // Hide close button on desktop web
  const shouldShowCloseButton = !isInterfaceDesktop

  return (
    <Flex gap="$spacing16" px={isWeb ? '$spacing4' : '$spacing24'} py={isWeb ? '$spacing4' : '$spacing12'} width="100%">
      {shouldShowTitle && (
        <Flex row justifyContent="space-between" pt={isWeb ? '$spacing8' : 0}>
          <TouchableArea onPress={(): void => setSelectedSetting(undefined)}>
            <RotatableChevron
              color={
                SelectedSetting === undefined || SelectedSetting === initialSelectedSetting
                  ? '$transparent'
                  : '$neutral3'
              }
              height={iconSizes.icon24}
              width={iconSizes.icon24}
            />
          </TouchableArea>
          <Text textAlign="center" variant="body1">
            {title}
          </Text>
          <Flex width={iconSizes.icon24} />
        </Flex>
      )}
      {screen}
      {shouldShowCloseButton && (
        <Flex centered row pb={isWebSmallScreen ? '$spacing24' : '$spacing8'}>
          <Button testID="swap-settings-close" emphasis="secondary" onPress={onClose}>
            {t('common.button.save')}
          </Button>
        </Flex>
      )}
    </Flex>
  )
}
