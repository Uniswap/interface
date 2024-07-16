import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import { SCREEN_ITEM_HORIZONTAL_PAD } from 'src/app/constants'
import { SettingsItemWithDropdown } from 'src/app/features/settings/SettingsItemWithDropdown'
import { AppRoutes, SettingsRoutes } from 'src/app/navigation/constants'
import { useExtensionNavigation } from 'src/app/navigation/utils'
import { useAppDispatch } from 'src/store/store'
import {
  Button,
  ColorTokens,
  Flex,
  GeneratedIcon,
  ScrollView,
  Separator,
  Text,
  TouchableArea,
  useSporeColors,
} from 'ui/src'
import {
  Chart,
  Coins,
  Feedback,
  FileListLock,
  HelpCenter,
  Key,
  Language,
  LineChartDots,
  Lock,
  RotatableChevron,
  Settings,
  ShieldQuestion,
} from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { isDevEnv } from 'utilities/src/environment'
import noop from 'utilities/src/react/noop'
import { WebSwitch } from 'wallet/src/components/buttons/Switch'
import { SettingsLanguageModal } from 'wallet/src/components/settings/language/SettingsLanguageModal'
import { authActions } from 'wallet/src/features/auth/saga'
import { AuthActionType } from 'wallet/src/features/auth/types'
import { FiatCurrency, ORDERED_CURRENCIES } from 'wallet/src/features/fiatCurrency/constants'
import { getFiatCurrencyName, useAppFiatCurrencyInfo } from 'wallet/src/features/fiatCurrency/hooks'
import { setCurrentFiatCurrency } from 'wallet/src/features/fiatCurrency/slice'
import { useCurrentLanguageInfo } from 'wallet/src/features/language/hooks'
import { useHideSmallBalancesSetting, useHideSpamTokensSetting } from 'wallet/src/features/wallet/hooks'
import { setHideSmallBalances, setHideSpamTokens } from 'wallet/src/features/wallet/slice'

const manifestVersion = chrome.runtime.getManifest().version

export function SettingsScreen(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { navigateTo, navigateBack } = useExtensionNavigation()
  const currentLanguageInfo = useCurrentLanguageInfo()
  const appFiatCurrencyInfo = useAppFiatCurrencyInfo()
  const isExtensionFeedbackEnabled = useFeatureFlag(FeatureFlags.ExtensionBetaFeedbackPrompt)

  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false)

  const onPressLockWallet = async (): Promise<void> => {
    navigateBack()
    await dispatch(authActions.trigger({ type: AuthActionType.Lock }))
  }

  const hideSpamTokens = useHideSpamTokensSetting()
  const handleSpamTokensToggle = async (): Promise<void> => {
    await dispatch(setHideSpamTokens(!hideSpamTokens))
  }

  const hideSmallBalances = useHideSmallBalancesSetting()
  const handleSmallBalancesToggle = async (): Promise<void> => {
    await dispatch(setHideSmallBalances(!hideSmallBalances))
  }

  return (
    <>
      {isLanguageModalOpen ? <SettingsLanguageModal onClose={() => setIsLanguageModalOpen(false)} /> : undefined}
      <Flex fill backgroundColor="$surface1" gap="$spacing8">
        <ScreenHeader title={t('settings.title')} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <SettingsSection title={t('settings.section.preferences')}>
            <>
              {isDevEnv() && (
                <SettingsItem
                  Icon={Settings}
                  title="Developer Settings"
                  onPress={(): void => navigateTo(`${AppRoutes.Settings}/${SettingsRoutes.DevMenu}`)}
                />
              )}
            </>
            <SettingsItemWithDropdown
              Icon={Language}
              disableDropdown={true}
              items={[]}
              selected={currentLanguageInfo.displayName}
              title={t('settings.setting.language.title')}
              onDisabledDropdownPress={() => {
                setIsLanguageModalOpen(true)
              }}
              onSelect={noop}
            />
            <SettingsItemWithDropdown
              Icon={Coins}
              items={ORDERED_CURRENCIES.map((currency) => {
                return {
                  label: getFiatCurrencyName(t, currency).shortName,
                  value: currency,
                }
              })}
              selected={appFiatCurrencyInfo.shortName}
              title={t('settings.setting.currency.title')}
              onSelect={(value) => {
                const currency = value as FiatCurrency
                dispatch(setCurrentFiatCurrency(currency))
              }}
            />
            <SettingsToggleRow
              Icon={Chart}
              title={t('settings.setting.smallBalances.title')}
              value={hideSmallBalances}
              onValueChange={handleSmallBalancesToggle}
            />
            <SettingsToggleRow
              Icon={ShieldQuestion}
              title={t('settings.setting.unknownTokens.title')}
              value={hideSpamTokens}
              onValueChange={handleSpamTokensToggle}
            />
            <SettingsItem
              Icon={LineChartDots}
              title={t('settings.setting.privacy.title')}
              onPress={(): void => navigateTo(`${AppRoutes.Settings}/${SettingsRoutes.Privacy}`)}
            />
          </SettingsSection>
          <SettingsSectionSeparator />
          <SettingsSection title={t('settings.section.security')}>
            <SettingsItem
              Icon={Key}
              title={t('settings.setting.password.title')}
              onPress={(): void => navigateTo(`${AppRoutes.Settings}/${SettingsRoutes.ChangePassword}`)}
            />
            <SettingsItem
              Icon={FileListLock}
              title={t('settings.setting.recoveryPhrase.title')}
              onPress={(): void => navigateTo(`${AppRoutes.Settings}/${SettingsRoutes.ViewRecoveryPhrase}`)}
            />
          </SettingsSection>
          <SettingsSectionSeparator />
          <SettingsSection title={t('settings.section.support')}>
            <SettingsItem
              Icon={HelpCenter}
              title={t('settings.setting.helpCenter.title')}
              url={uniswapUrls.helpArticleUrls.extensionHelp}
            />
            {isExtensionFeedbackEnabled ? (
              <SettingsItem
                Icon={Feedback}
                title={t('settings.setting.giveFeedback.title')}
                url={uniswapUrls.extensionFeedbackFormUrl}
              />
            ) : (
              <></>
            )}
            <Text color="$neutral3" px="$spacing12" py="$spacing4" variant="body4">{`Version ${manifestVersion}`}</Text>
          </SettingsSection>
        </ScrollView>
        <Button icon={<Lock />} theme="secondary" onPress={onPressLockWallet}>
          {t('settings.action.lock')}
        </Button>
      </Flex>
    </>
  )
}

function SettingsItem({
  Icon,
  title,
  onPress,
  iconProps,
  themeProps,
  url,
}: {
  Icon: GeneratedIcon
  title: string
  onPress?: () => void
  iconProps?: { strokeWidth?: number }
  // TODO: do this with a wrapping Theme, "detrimental" wasn't working
  themeProps?: { color?: string; hoverColor?: string }
  url?: string
}): JSX.Element {
  const colors = useSporeColors()
  const hoverColor = themeProps?.hoverColor ?? colors.surface2.val

  const content = (
    <TouchableArea
      alignItems="center"
      borderRadius="$rounded12"
      flexDirection="row"
      flexGrow={1}
      gap="$spacing16"
      hoverStyle={{
        backgroundColor: hoverColor as ColorTokens,
      }}
      justifyContent="space-between"
      px="$spacing12"
      py="$spacing8"
      onPress={onPress}
    >
      <Flex row gap="$spacing12">
        <Icon
          color={themeProps?.color ?? '$neutral2'}
          size={iconSizes.icon24}
          strokeWidth={iconProps?.strokeWidth ?? undefined}
        />
        <Text style={{ color: themeProps?.color ?? colors.neutral1.val }} variant="subheading2">
          {title}
        </Text>
      </Flex>
      <RotatableChevron color="$neutral3" direction="end" height={iconSizes.icon20} width={iconSizes.icon20} />
    </TouchableArea>
  )

  if (url) {
    return (
      <Link style={{ textDecoration: 'none' }} target="_blank" to={url}>
        {content}
      </Link>
    )
  }

  return content
}

function SettingsToggleRow({
  Icon,
  title,
  value,
  onValueChange,
}: {
  title: string
  Icon: GeneratedIcon
  value: boolean
  onValueChange: (value: boolean) => void
}): JSX.Element {
  return (
    <Flex
      alignItems="center"
      flexDirection="row"
      gap="$spacing16"
      justifyContent="space-between"
      px={SCREEN_ITEM_HORIZONTAL_PAD}
      py="$spacing4"
    >
      <Flex row gap="$spacing12">
        <Icon color="$neutral2" size={iconSizes.icon24} />
        <Text>{title}</Text>
      </Flex>
      <WebSwitch value={value} onValueChange={onValueChange} />
    </Flex>
  )
}

function SettingsSection({ title, children }: { title: string; children: JSX.Element | JSX.Element[] }): JSX.Element {
  return (
    <Flex flexDirection="column" gap="$spacing4">
      <Text color="$neutral2" px={SCREEN_ITEM_HORIZONTAL_PAD} variant="subheading2">
        {title}
      </Text>
      {children}
    </Flex>
  )
}

function SettingsSectionSeparator(): JSX.Element {
  return (
    <Flex mx="$spacing8">
      <Separator my="$spacing16" width="100%" />
    </Flex>
  )
}
