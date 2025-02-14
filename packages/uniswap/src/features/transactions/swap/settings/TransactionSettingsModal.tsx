import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DeprecatedButton, Flex, Popover, Text, TouchableArea, isWeb, useSporeColors } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { iconSizes } from 'ui/src/theme'
import { WarningMessage } from 'uniswap/src/components/WarningMessage/WarningMessage'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { SLIPPAGE_CRITICAL_TOLERANCE, WARNING_DEADLINE_TOLERANCE } from 'uniswap/src/constants/transactions'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import {
  TransactionSettingsContext,
  useTransactionSettingsContext,
} from 'uniswap/src/features/transactions/settings/contexts/TransactionSettingsContext'
import { SwapFormContext, useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { SwapSettingRow } from 'uniswap/src/features/transactions/swap/settings/SwapSettingsRow'
import { SwapSettingConfig, SwapSettingId } from 'uniswap/src/features/transactions/swap/settings/configs/types'
import { useSlippageSettings } from 'uniswap/src/features/transactions/swap/settings/useSlippageSettings'
import { isExtension, isInterface, isMobileWeb } from 'utilities/src/platform'

const POPOVER_WIDTH = 320

export type TransactionSettingsModalProps = {
  settings: SwapSettingConfig[]
  defaultTitle?: string
  initialSelectedSetting?: SwapSettingConfig
  onClose?: () => void
  isOpen: boolean
}

const TransactionSettingsModalContent = ({
  settings,
  defaultTitle,
  initialSelectedSetting,
  onClose,
}: Omit<TransactionSettingsModalProps, 'isOpen'>): JSX.Element => {
  const { t } = useTranslation()
  const { customSlippageTolerance, customDeadline } = useTransactionSettingsContext()
  const { autoSlippageTolerance } = useSlippageSettings()

  const isCriticalSlippage = customSlippageTolerance && customSlippageTolerance >= SLIPPAGE_CRITICAL_TOLERANCE

  const [SelectedSetting, setSelectedSetting] = useState<SwapSettingConfig>()

  const rowWarningContent: Record<SwapSettingId, { condition: boolean; render: () => JSX.Element | undefined }> = {
    [SwapSettingId.SLIPPAGE]: {
      condition: !!customSlippageTolerance && customSlippageTolerance > autoSlippageTolerance,
      render: () => (
        <WarningMessage
          warningMessage={isCriticalSlippage ? t('swap.settings.slippage.warning') : t('swap.settings.slippage.alert')}
          tooltipText={isWeb && !isMobileWeb ? t('swap.settings.slippage.warning.hover') : undefined}
          color={isCriticalSlippage ? '$statusCritical' : '$statusWarning'}
        />
      ),
    },
    [SwapSettingId.DEADLINE]: {
      condition: !!customDeadline && customDeadline >= WARNING_DEADLINE_TOLERANCE,
      render: () => <WarningMessage warningMessage={t('swap.settings.deadline.warning')} color="$statusWarning" />,
    },
  }

  const getSettingsRowWarning = (settingId: SwapSettingId): JSX.Element | undefined => {
    const warning = rowWarningContent[settingId]
    return warning?.condition ? warning.render() : undefined
  }

  const title = SelectedSetting ? SelectedSetting.renderTitle(t) : defaultTitle ?? t('swap.settings.title')
  const screen = SelectedSetting?.Screen ? (
    <SelectedSetting.Screen />
  ) : (
    <Flex gap="$spacing8" py="$spacing12">
      {settings.map((setting, index) => {
        const warning = setting.settingId ? getSettingsRowWarning(setting.settingId) : undefined
        return (
          <SwapSettingRow
            key={`swap-setting-${index}`}
            setSelectedSetting={setSelectedSetting}
            setting={setting}
            warning={warning}
          />
        )
      })}
    </Flex>
  )

  return (
    <Flex gap="$spacing16" px={isWeb ? '$spacing4' : '$spacing24'} py={isWeb ? '$spacing4' : '$spacing12'} width="100%">
      {!SelectedSetting?.hideTitle && (
        <Flex row justifyContent="space-between">
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
      <Flex centered row>
        <DeprecatedButton fill testID="swap-settings-close" theme="secondary" onPress={onClose}>
          {SelectedSetting?.renderCloseButtonText ? SelectedSetting.renderCloseButtonText(t) : t('common.button.close')}
        </DeprecatedButton>
      </Flex>
    </Flex>
  )
}

function TransactionSettingsModalInterface({
  settings,
  defaultTitle,
  initialSelectedSetting,
  onClose,
}: TransactionSettingsModalProps): JSX.Element {
  return (
    <Popover.Content
      animation={[
        'quick',
        {
          opacity: {
            overshootClamping: true,
          },
        },
      ]}
      borderColor="$surface3"
      borderRadius="$rounded24"
      borderWidth="$spacing1"
      enterStyle={{ y: -10, opacity: 0 }}
      exitStyle={{ y: -10, opacity: 0 }}
      p="$spacing12"
      shadowColor="$shadowColor"
      shadowOpacity={0.06}
      shadowRadius={6}
      width={POPOVER_WIDTH}
    >
      <TransactionSettingsModalContent
        defaultTitle={defaultTitle}
        initialSelectedSetting={initialSelectedSetting}
        settings={settings}
        onClose={onClose}
      />
    </Popover.Content>
  )
}

function TransactionSettingsModalWallet({
  settings,
  initialSelectedSetting,
  onClose,
  isOpen,
}: TransactionSettingsModalProps): JSX.Element {
  const swapFormContext = useSwapFormContext()
  const transactionSettingsContext = useTransactionSettingsContext()
  const colors = useSporeColors()

  return (
    <Modal
      alignment={isExtension ? 'top' : undefined}
      backgroundColor={colors.surface1.val}
      isModalOpen={isOpen}
      name={ModalName.SwapSettings}
      onClose={onClose}
    >
      {/* Re-create the TransactionSettingsContextProvider, since native Modal can cause its children to be in a separate component tree. */}
      <TransactionSettingsContext.Provider value={transactionSettingsContext}>
        {/* Re-create the SwapFormContextProvider, since native Modal can cause its children to be in a separate component tree. */}
        <SwapFormContext.Provider value={swapFormContext}>
          <TransactionSettingsModalContent
            initialSelectedSetting={initialSelectedSetting}
            settings={settings}
            onClose={onClose}
          />
        </SwapFormContext.Provider>
      </TransactionSettingsContext.Provider>
    </Modal>
  )
}

export function TransactionSettingsModal(props: TransactionSettingsModalProps): JSX.Element {
  if (isInterface) {
    return <TransactionSettingsModalInterface {...props} />
  }

  return <TransactionSettingsModalWallet {...props} />
}
