import type { TFunction } from 'i18next'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AdaptiveWebPopoverContent, Button, Flex, isWeb, Text, TouchableArea, useMedia, useSporeColors } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { iconSizes } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { WarningMessage } from 'uniswap/src/components/WarningMessage/WarningMessage'
import { SLIPPAGE_CRITICAL_TOLERANCE, WARNING_DEADLINE_TOLERANCE } from 'uniswap/src/constants/transactions'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import {
  TransactionSettingsContext,
  useTransactionSettingsContext,
} from 'uniswap/src/features/transactions/settings/contexts/TransactionSettingsContext'
import { SwapFormContext, useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { SwapSettingConfig, SwapSettingId } from 'uniswap/src/features/transactions/swap/settings/configs/types'
import { SwapSettingRow } from 'uniswap/src/features/transactions/swap/settings/SwapSettingsRow'
import { useSlippageSettings } from 'uniswap/src/features/transactions/swap/settings/useSlippageSettings'
import { isExtension, isInterface, isMobileApp, isMobileWeb } from 'utilities/src/platform'

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
  const media = useMedia()

  const [SelectedSetting, setSelectedSetting] = useState<SwapSettingConfig | undefined>(initialSelectedSetting)

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

  // Hide close button on desktop web unless there is custom button text
  const shouldShowCloseButton = isMobileApp || isWebSmallScreen || Boolean(SelectedSetting?.renderCloseButtonText)

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
            {SelectedSetting?.renderCloseButtonText
              ? SelectedSetting.renderCloseButtonText(t)
              : t('common.button.save')}
          </Button>
        </Flex>
      )}
    </Flex>
  )
}

const TopLevelSettings = ({
  settings,
  setSelectedSetting,
}: {
  settings: SwapSettingConfig[]
  setSelectedSetting: React.Dispatch<React.SetStateAction<SwapSettingConfig | undefined>>
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

  const getSettingsRowWarning = (settingId: SwapSettingId): JSX.Element | undefined => {
    const warning = rowWarningContent[settingId]
    return warning?.condition ? warning.render() : undefined
  }

  return (
    <Flex gap={isWeb ? '$spacing4' : '$spacing8'} py={isWeb ? '$spacing8' : '$spacing12'}>
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
}

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
}): Record<SwapSettingId, { condition: boolean; render: () => JSX.Element | undefined }> {
  const isCriticalSlippage = Boolean(customSlippageTolerance && customSlippageTolerance >= SLIPPAGE_CRITICAL_TOLERANCE)

  return {
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
}

function TransactionSettingsModalInterface({
  settings,
  defaultTitle,
  initialSelectedSetting,
  onClose,
  isOpen,
}: TransactionSettingsModalProps): JSX.Element {
  return (
    <AdaptiveWebPopoverContent
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
      px="$spacing12"
      py="$spacing4"
      shadowColor="$shadowColor"
      shadowOpacity={0.06}
      shadowRadius={6}
      width={POPOVER_WIDTH}
      isOpen={isOpen}
      webBottomSheetProps={{ px: '$padding16' }}
    >
      <TransactionSettingsModalContent
        defaultTitle={defaultTitle}
        initialSelectedSetting={initialSelectedSetting}
        settings={settings}
        onClose={onClose}
      />
    </AdaptiveWebPopoverContent>
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
