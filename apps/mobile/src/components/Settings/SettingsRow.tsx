import { NavigatorScreenParams, useNavigation } from '@react-navigation/native'
import { memo, useCallback } from 'react'
import { ValueOf } from 'react-native-gesture-handler/lib/typescript/typeUtils'
import { navigate } from 'src/app/navigation/rootNavigation'
import {
  AppStackNavigationProp,
  OnboardingStackNavigationProp,
  OnboardingStackParamList,
  SettingsStackNavigationProp,
  SettingsStackParamList,
} from 'src/app/navigation/types'
import { ConnectionsDappsListModalState } from 'src/components/Settings/ConnectionsDappModal/ConnectionsDappsListModalState'
import { EditWalletSettingsModalState } from 'src/components/Settings/EditWalletModal/EditWalletSettingsModalState'
import { useIsScreenNavigationReady } from 'src/utils/useIsScreenNavigationReady'
import { Flex, Skeleton, Switch, Text, TouchableArea, useSporeColors } from 'ui/src'
import { Arrow } from 'ui/src/components/arrow/Arrow'
import { RotatableChevron } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { openUri } from 'uniswap/src/utils/linking'
import { SmartWalletAdvancedSettingsModalState } from 'wallet/src/components/smartWallet/modals/SmartWalletAdvancedSettingsModal'

export const SETTINGS_ROW_HEIGHT = 60

export interface SettingsSection {
  subTitle?: string
  data: (SettingsSectionItem | SettingsSectionItemComponent)[]
  isHidden?: boolean
}

export interface SettingsSectionItemComponent {
  component: JSX.Element
  isHidden?: boolean
}

type SettingsNavigationModal =
  | typeof ModalName.BiometricsModal
  | typeof ModalName.FiatCurrencySelector
  | typeof ModalName.EditProfileSettingsModal
  | typeof ModalName.EditLabelSettingsModal
  | typeof ModalName.ConnectionsDappListModal
  | typeof ModalName.SmartWalletAdvancedSettingsModal
  | typeof ModalName.PasskeyManagement
  | typeof ModalName.Experiments
  | typeof ModalName.SettingsAppearance
  | typeof ModalName.PermissionsModal
  | typeof ModalName.PortfolioBalanceModal
  | typeof ModalName.LanguageSelector

export interface SettingsSectionItem {
  screen?: keyof SettingsStackParamList | typeof MobileScreens.OnboardingStack
  navigationModal?: SettingsNavigationModal
  testID?: string
  screenProps?: ValueOf<SettingsStackParamList> | NavigatorScreenParams<OnboardingStackParamList>
  navigationProps?:
    | ConnectionsDappsListModalState
    | EditWalletSettingsModalState
    | SmartWalletAdvancedSettingsModalState
  externalLink?: string
  action?: JSX.Element
  disabled?: boolean
  text: string
  subText?: string
  icon: JSX.Element
  isHidden?: boolean
  currentSetting?: string
  onToggle?: () => void
  isToggleEnabled?: boolean
  checkIfCanProceed?: () => boolean
  count?: number
}

interface SettingsRowProps {
  page: SettingsSectionItem
  navigation: SettingsStackNavigationProp & OnboardingStackNavigationProp
  checkIfCanProceed?: SettingsSectionItem['checkIfCanProceed']
  testID?: string
}

export const SettingsRow = memo(
  ({
    page: {
      screen,
      navigationModal,
      screenProps,
      navigationProps,
      externalLink,
      disabled,
      action,
      icon,
      text,
      subText,
      currentSetting,
      onToggle,
      isToggleEnabled,
      count,
      testID,
    },
    navigation,
    checkIfCanProceed,
  }: SettingsRowProps): JSX.Element => {
    const colors = useSporeColors()

    const handleRow = useCallback(async (): Promise<void> => {
      if (checkIfCanProceed && !checkIfCanProceed()) {
        return
      }

      if (onToggle) {
        return
      } else if (screen) {
        // Type assignment to `any` is a workaround until we figure out how to
        // properly type screen param. `navigate` function also brings some issues,
        // where it accepts other screen's params, and not throws an error on required ones.
        // biome-ignore lint/suspicious/noExplicitAny: Navigation types don't properly handle dynamic screen names
        navigation.navigate(screen as any, screenProps)
      } else if (navigationModal) {
        navigate(navigationModal, navigationProps)
      } else if (externalLink) {
        await openUri({ uri: externalLink })
      }
    }, [checkIfCanProceed, onToggle, screen, navigation, screenProps, navigationProps, navigationModal, externalLink])

    return (
      <TouchableArea disabled={Boolean(action)} testID={testID} onPress={handleRow}>
        <Flex grow row alignItems="center" gap="$spacing12" minHeight={40}>
          <Flex grow row alignItems={subText ? 'flex-start' : 'center'} flexBasis={0} gap="$spacing12">
            <Flex centered height={32} width={32}>
              {icon}
            </Flex>
            <Flex fill grow alignItems="stretch">
              <Text variant="body1">{text}</Text>
              {subText && (
                <Text color="$neutral2" numberOfLines={1} variant="buttonLabel2">
                  {subText}
                </Text>
              )}
            </Flex>
          </Flex>
          {count !== undefined && (
            <Text color="$neutral2" variant="body3">
              {count}
            </Text>
          )}
          <RowRightContent
            screen={screen}
            navigationModal={navigationModal}
            externalLink={externalLink}
            disabled={disabled}
            action={action}
            currentSetting={currentSetting}
            isToggleEnabled={isToggleEnabled}
            colors={colors}
            onToggle={onToggle}
          />
        </Flex>
      </TouchableArea>
    )
  },
)

SettingsRow.displayName = 'SettingsRow'

const LOADING_DIMENSIONS = {
  chevron: {
    height: 24,
    width: 24,
  },
  text: {
    height: 16,
    width: 72,
  },
  action: {
    height: 24,
    width: 40,
  },
}

const RowRightContent = memo(
  ({
    screen,
    navigationModal,
    externalLink,
    disabled,
    action,
    currentSetting,
    onToggle,
    isToggleEnabled,
    colors,
  }: Pick<
    SettingsSectionItem,
    | 'screen'
    | 'navigationModal'
    | 'externalLink'
    | 'disabled'
    | 'action'
    | 'currentSetting'
    | 'onToggle'
    | 'isToggleEnabled'
  > & {
    colors: ReturnType<typeof useSporeColors>
  }): JSX.Element | null => {
    const navigation = useNavigation() as AppStackNavigationProp
    // we do this to prevent jank on navigation transition
    // mostly for the switch component
    const shouldRender = useIsScreenNavigationReady({ navigation })

    if (onToggle) {
      if (typeof isToggleEnabled === 'undefined') {
        throw new Error('Should pass valid isToggleEnabled prop when onToggle is passed')
      }

      return (
        <Switch
          checked={Boolean(isToggleEnabled)}
          variant="branded"
          disabled={Boolean(disabled)}
          onCheckedChange={onToggle}
        />
      )
    }

    if (screen || navigationModal) {
      return (
        <Flex centered row>
          {currentSetting &&
            (shouldRender ? (
              <Flex shrink alignItems="flex-end" flexBasis="35%" justifyContent="flex-end">
                <Text adjustsFontSizeToFit color="$neutral2" mr="$spacing8" numberOfLines={2} variant="body3">
                  {currentSetting}
                </Text>
              </Flex>
            ) : (
              <Skeleton>
                <Flex
                  width={LOADING_DIMENSIONS.text.width}
                  height={LOADING_DIMENSIONS.text.height}
                  borderRadius="$rounded12"
                  backgroundColor="$neutral3"
                />
              </Skeleton>
            ))}
          <RotatableChevron color="$neutral3" direction="end" height={iconSizes.icon24} width={iconSizes.icon24} />
        </Flex>
      )
    }

    if (externalLink) {
      return <Arrow color={colors.neutral3.val} direction="ne" size={iconSizes.icon24} />
    }

    if (action) {
      return shouldRender ? (
        action
      ) : (
        <Skeleton>
          <Flex
            width={LOADING_DIMENSIONS.action.width}
            height={LOADING_DIMENSIONS.action.height}
            borderRadius="$rounded12"
            backgroundColor="$neutral3"
          />
        </Skeleton>
      )
    }

    return null
  },
)

RowRightContent.displayName = 'RowRightContent'
