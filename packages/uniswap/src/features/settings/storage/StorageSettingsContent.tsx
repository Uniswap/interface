import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Button, Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { Box, LayerGroup, Person, QuestionInCircleFilled, TimePast, TrashFilled } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { InfoLinkModal } from 'uniswap/src/components/modals/InfoLinkModal'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { InfoTooltip } from 'uniswap/src/components/tooltip/InfoTooltip'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { logger } from 'utilities/src/logger/logger'
import { isMobileApp, isWebApp } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

enum ClearAction {
  AccountHistory = 'AccountHistory',
  UserSettings = 'UserSettings',
  CachedData = 'CachedData',
  AllData = 'AllData',
}

interface StorageSettingsContentProps {
  onPressClearAccountHistory: () => void | Promise<void>
  onPressClearUserSettings: () => void | Promise<void>
  onPressClearCachedData: () => void | Promise<void>
  onPressClearAllData: () => void | Promise<void>
}

export function StorageSettingsContent({
  onPressClearAccountHistory,
  onPressClearUserSettings,
  onPressClearCachedData,
  onPressClearAllData,
}: StorageSettingsContentProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const dispatch = useDispatch()
  const [pendingAction, setPendingAction] = useState<ClearAction | null>(null)

  const onPressConfirm = useEvent(async () => {
    try {
      switch (pendingAction) {
        case ClearAction.AccountHistory:
          await onPressClearAccountHistory()
          break
        case ClearAction.UserSettings:
          await onPressClearUserSettings()
          break
        case ClearAction.CachedData:
          await onPressClearCachedData()
          break
        case ClearAction.AllData:
          await onPressClearAllData()
          break
      }
      dispatch(
        pushNotification({
          type: AppNotificationType.Success,
          title: t('settings.setting.storage.success'),
        }),
      )
    } catch (error) {
      logger.error(error, { tags: { file: 'StorageSettingsContent.tsx', function: 'onPressConfirm' } })
      dispatch(
        pushNotification({
          type: AppNotificationType.Error,
          errorMessage: t('settings.setting.storage.error'),
        }),
      )
    } finally {
      setPendingAction(null)
    }
  })

  const onPressCancel = useEvent(() => {
    setPendingAction(null)
  })

  const confirmationProps = useMemo(() => {
    switch (pendingAction) {
      case ClearAction.AccountHistory:
        return {
          title: t('settings.setting.storage.clearAccountHistory.title'),
          icon: <TimePast color={colors.neutral1.val} size={iconSizes.icon28} />,
        }
      case ClearAction.UserSettings:
        return {
          title: t('settings.setting.storage.clearUserSettings.title'),
          icon: <Person color={colors.neutral1.val} size={iconSizes.icon28} />,
        }
      case ClearAction.CachedData:
        return {
          title: t('settings.setting.storage.clearCachedData.title'),
          icon: <LayerGroup color={colors.neutral1.val} size={iconSizes.icon28} />,
        }
      case ClearAction.AllData:
        return {
          title: t('settings.setting.storage.clearAllData.title'),
          icon: <TrashFilled color={colors.neutral1.val} size={iconSizes.icon28} />,
        }
      default:
        return { title: '', icon: null }
    }
  }, [pendingAction, t, colors.neutral1.val])

  const iconProps = {
    color: colors.neutral2.val,
    size: iconSizes.icon24,
  }

  return (
    <>
      <Flex fill justifyContent="space-between" gap="$spacing12">
        <Flex gap="$spacing12">
          {/* Storage actions */}
          <Flex gap="$spacing12">
            <StorageSettingsRow
              icon={<TimePast {...iconProps} />}
              title={t('settings.setting.storage.clearAccountHistory.title')}
              subtitle={t('settings.setting.storage.clearAccountHistory.subtitle')}
              onPress={() => setPendingAction(ClearAction.AccountHistory)}
            />

            <StorageSettingsRow
              icon={<Person {...iconProps} />}
              title={t('settings.setting.storage.clearUserSettings.title')}
              subtitle={t('settings.setting.storage.clearUserSettings.subtitle')}
              onPress={() => setPendingAction(ClearAction.UserSettings)}
            />

            <StorageSettingsRow
              icon={<LayerGroup {...iconProps} />}
              title={t('settings.setting.storage.clearCachedData.title')}
              subtitle={t('settings.setting.storage.clearCachedData.subtitle')}
              onPress={() => setPendingAction(ClearAction.CachedData)}
            />
          </Flex>
        </Flex>

        {/* Clear all - separated at bottom */}
        <Flex row centered pb={isMobileApp ? '$spacing24' : '$spacing4'}>
          <Button
            size="large"
            emphasis="secondary"
            variant="default"
            icon={<TrashFilled />}
            onPress={() => setPendingAction(ClearAction.AllData)}
          >
            {t('settings.setting.storage.clearAllData.title')}
          </Button>
        </Flex>
      </Flex>

      <WarningModal
        isOpen={pendingAction !== null}
        modalName={ModalName.StorageConfirm}
        title={confirmationProps.title}
        caption={t('settings.setting.storage.confirm.caption')}
        icon={confirmationProps.icon}
        backgroundIconColor={colors.surface3.val}
        rejectText={t('common.button.cancel')}
        acknowledgeText={t('settings.setting.storage.confirm.approve')}
        onClose={onPressCancel}
        onAcknowledge={onPressConfirm}
      />
    </>
  )
}

interface StorageSettingsRowProps {
  icon: React.ReactElement
  title: string
  subtitle: string
  onPress: () => void
  isCritical?: boolean
  testID?: string
}

function StorageSettingsRow({
  icon,
  title,
  subtitle,
  onPress,
  isCritical = false,
  testID,
}: StorageSettingsRowProps): JSX.Element {
  return (
    <TouchableArea
      testID={testID}
      borderWidth={1}
      borderColor="$surface3"
      borderRadius="$rounded16"
      p="$spacing12"
      hoverStyle={{ backgroundColor: '$surface2' }}
      onPress={onPress}
    >
      <Flex row alignItems="center" justifyContent="space-between">
        <Flex row alignItems="center" gap="$spacing12" flex={1}>
          <Flex centered>{icon}</Flex>
          <Flex flex={1} gap="$spacing4">
            <Text variant="body2" color={isCritical ? '$statusCritical' : '$neutral1'}>
              {title}
            </Text>
            <Text variant="body3" color="$neutral2">
              {subtitle}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </TouchableArea>
  )
}

export function StorageHelpIcon(): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const {
    value: isStorageEducationModalOpen,
    setTrue: showStorageEducationModal,
    setFalse: hideStorageEducationModal,
  } = useBooleanState(false)

  return isWebApp ? (
    <InfoTooltip
      placement="bottom"
      trigger={
        <TouchableArea>
          <QuestionInCircleFilled color="$neutral2" size="$icon.20" />
        </TouchableArea>
      }
      text={t('settings.setting.storage.help.description')}
    />
  ) : (
    <>
      <TouchableArea alignItems="center" alignSelf="center" py="$spacing12" onPress={showStorageEducationModal}>
        <QuestionInCircleFilled color="$neutral2" size="$icon.20" />
      </TouchableArea>
      <InfoLinkModal
        name={ModalName.StorageHelp}
        isOpen={isStorageEducationModalOpen}
        icon={<Box color={colors.neutral1.val} size={iconSizes.icon40} />}
        title={t('settings.setting.storage.help.title')}
        description={t('settings.setting.storage.help.description')}
        buttonText={t('common.button.close')}
        onDismiss={hideStorageEducationModal}
        onButtonPress={hideStorageEducationModal}
      />
    </>
  )
}
