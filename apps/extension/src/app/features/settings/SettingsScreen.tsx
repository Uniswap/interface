import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import { SCREEN_ITEM_HORIZONTAL_PAD } from 'src/app/constants'
import { SettingsItemWithDropdown } from 'src/app/features/settings/SettingsItemWithDropdown'
import { AppRoutes, SettingsRoutes } from 'src/app/navigation/constants'
import { useExtensionNavigation } from 'src/app/navigation/utils'
import { getIsDefaultProviderFromStorage, setIsDefaultProviderToStorage } from 'src/app/utils/provider'
import {
  Button,
  ColorTokens,
  Flex,
  GeneratedIcon,
  ScrollView,
  Switch,
  Text,
  TouchableArea,
  useSporeColors,
} from 'ui/src'
import {
  ArrowUpRight,
  Chart,
  Coins,
  FileListLock,
  Global,
  HelpCenter,
  Key,
  Language,
  LineChartDots,
  Lock,
  RotatableChevron,
  Settings,
  Wrench,
} from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { resetUniswapBehaviorHistory } from 'uniswap/src/features/behaviorHistory/slice'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { FiatCurrency, ORDERED_CURRENCIES } from 'uniswap/src/features/fiatCurrency/constants'
import { getFiatCurrencyName, useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useCurrentLanguageInfo } from 'uniswap/src/features/language/hooks'
import { setCurrentFiatCurrency, setIsTestnetModeEnabled } from 'uniswap/src/features/settings/slice'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { ConnectionCardLoggingName } from 'uniswap/src/features/telemetry/types'
import { TestnetModeModal } from 'uniswap/src/features/testnets/TestnetModeModal'
import { isDevEnv } from 'utilities/src/environment/env'
import { logger } from 'utilities/src/logger/logger'
import noop from 'utilities/src/react/noop'
import { CardType, IntroCard, IntroCardGraphicType } from 'wallet/src/components/introCards/IntroCard'
import { SettingsLanguageModal } from 'wallet/src/components/settings/language/SettingsLanguageModal'
import { PermissionsModal } from 'wallet/src/components/settings/permissions/PermissionsModal'
import { PortfolioBalanceModal } from 'wallet/src/components/settings/portfolioBalance/PortfolioBalanceModal'
import { authActions } from 'wallet/src/features/auth/saga'
import { AuthActionType } from 'wallet/src/features/auth/types'
import { selectHasViewedConnectionMigration } from 'wallet/src/features/behaviorHistory/selectors'
import { resetWalletBehaviorHistory, setHasViewedConnectionMigration } from 'wallet/src/features/behaviorHistory/slice'

const manifestVersion = chrome.runtime.getManifest().version

export function SettingsScreen(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { navigateTo, navigateBack } = useExtensionNavigation()
  const currentLanguageInfo = useCurrentLanguageInfo()
  const appFiatCurrencyInfo = useAppFiatCurrencyInfo()
  const hasViewedConnectionMigration = useSelector(selectHasViewedConnectionMigration)

  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false)
  const [isPortfolioBalanceModalOpen, setIsPortfolioBalanceModalOpen] = useState(false)
  const [isTestnetModalOpen, setIsTestnetModalOpen] = useState(false)
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false)
  const [isDefaultProvider, setIsDefaultProvider] = useState(true)

  const onPressLockWallet = async (): Promise<void> => {
    navigateBack()
    await dispatch(authActions.trigger({ type: AuthActionType.Lock }))
  }

  // TODO(WALL-4908): consider wrapping handlers in useCallback
  const { isTestnetModeEnabled } = useEnabledChains()
  const handleTestnetModeToggle = async (isChecked: boolean): Promise<void> => {
    const fireAnalytic = (): void => {
      sendAnalyticsEvent(WalletEventName.TestnetModeToggled, {
        enabled: isChecked,
        location: 'settings',
      })
    }

    // trigger before toggling on (ie disabling analytics)
    if (isChecked) {
      // doesn't fire on time without await and i have no idea why
      await fireAnalytic()
    }

    dispatch(setIsTestnetModeEnabled(isChecked))
    setIsTestnetModalOpen(isChecked)

    // trigger after toggling off (ie enabling analytics)
    if (!isChecked) {
      // updateState()
      fireAnalytic()
    }
  }
  const handleTestnetModalClose = useCallback(() => setIsTestnetModalOpen(false), [])

  useEffect(() => {
    getIsDefaultProviderFromStorage()
      .then((newIsDefaultProvider) => setIsDefaultProvider(newIsDefaultProvider))
      .catch((e) =>
        logger.error(e, {
          tags: { file: 'PermissionsModal', function: 'fetchIsDefaultProvider' },
        }),
      )
  }, [])

  const handleDefaultBrowserToggle = async (isChecked: boolean): Promise<void> => {
    setIsDefaultProvider(!!isChecked)
    await setIsDefaultProviderToStorage(!!isChecked)
  }

  const setConnectionMigrationAsViewed = (): void => {
    dispatch(setHasViewedConnectionMigration(true))
  }

  return (
    <>
      {isLanguageModalOpen ? <SettingsLanguageModal onClose={() => setIsLanguageModalOpen(false)} /> : undefined}
      {isPortfolioBalanceModalOpen ? (
        <PortfolioBalanceModal onClose={() => setIsPortfolioBalanceModalOpen(false)} />
      ) : undefined}
      {isPermissionsModalOpen ? (
        <PermissionsModal
          handleDefaultBrowserToggle={handleDefaultBrowserToggle}
          isDefaultBrowserProvider={isDefaultProvider}
          onClose={() => setIsPermissionsModalOpen(false)}
        />
      ) : undefined}
      <TestnetModeModal isOpen={isTestnetModalOpen} onClose={handleTestnetModalClose} />
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
            <>
              {isDevEnv() && (
                <SettingsItem
                  hideChevron
                  Icon={Settings}
                  title="Clear behavior history"
                  onPress={() => {
                    dispatch(resetWalletBehaviorHistory())
                    dispatch(resetUniswapBehaviorHistory())
                  }}
                />
              )}
            </>
            <SettingsItemWithDropdown
              Icon={Coins}
              items={ORDERED_CURRENCIES.map((currency) => {
                return {
                  label: getFiatCurrencyName(t, currency).shortName,
                  value: currency,
                }
              })}
              selected={appFiatCurrencyInfo.code}
              title={t('settings.setting.currency.title')}
              onSelect={(value) => {
                const currency = value as FiatCurrency
                dispatch(setCurrentFiatCurrency(currency))
              }}
            />
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
            <SettingsItem
              Icon={Chart}
              title={t('settings.setting.smallBalances.title')}
              onPress={(): void => setIsPortfolioBalanceModalOpen(true)}
            />

            <SettingsToggleRow
              Icon={Wrench}
              checked={isTestnetModeEnabled}
              title={t('settings.setting.wallet.testnetMode.title')}
              onCheckedChange={handleTestnetModeToggle}
            />
          </SettingsSection>
          {!hasViewedConnectionMigration && (
            <Flex pt="$padding8">
              <IntroCard
                loggingName={ConnectionCardLoggingName.ConnectionBanner}
                graphic={{ type: IntroCardGraphicType.Icon, Icon: Global }}
                title={t('settings.setting.wallet.connection.banner.title')}
                description={t('settings.setting.wallet.connection.banner.description')}
                cardType={CardType.Dismissible}
                iconColor="$neutral2"
                containerProps={{
                  borderWidth: 0,
                  backgroundColor: '$surface2',
                  shadowColor: '$transparent',
                }}
                onPress={() => {
                  setConnectionMigrationAsViewed()
                }}
                onClose={(): void => {
                  setConnectionMigrationAsViewed()
                }}
              />
            </Flex>
          )}
          <Flex pt="$padding16">
            <SettingsSection title={t('settings.section.privacyAndSecurity')}>
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
              <SettingsItem
                Icon={LineChartDots}
                title={t('settings.setting.permissions.title')}
                onPress={(): void => setIsPermissionsModalOpen(true)}
              />
            </SettingsSection>
          </Flex>
          <Flex pt="$padding16">
            <SettingsSection title={t('settings.section.support')}>
              <SettingsItem
                Icon={HelpCenter}
                title={t('settings.setting.helpCenter.title')}
                url={uniswapUrls.helpArticleUrls.extensionHelp}
                RightIcon={ArrowUpRight}
              />
              <Text
                color="$neutral3"
                px="$spacing12"
                py="$spacing4"
                variant="body4"
              >{`Version ${manifestVersion}`}</Text>
            </SettingsSection>
          </Flex>
        </ScrollView>
        <Flex row>
          <Button icon={<Lock />} emphasis="secondary" onPress={onPressLockWallet}>
            {t('settings.action.lock')}
          </Button>
        </Flex>
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
  count,
  hideChevron = false,
  RightIcon,
}: {
  Icon: GeneratedIcon
  title: string
  hideChevron?: boolean
  RightIcon?: GeneratedIcon
  onPress?: () => void
  iconProps?: { strokeWidth?: number }
  // TODO: do this with a wrapping Theme, "detrimental" wasn't working
  themeProps?: { color?: string; hoverColor?: string }
  url?: string
  count?: number
}): JSX.Element {
  const colors = useSporeColors()
  const hoverColor = themeProps?.hoverColor ?? colors.surface2.val

  const content = (
    <TouchableArea
      alignItems="center"
      borderRadius="$rounded12"
      flexDirection="row"
      flexGrow={1}
      gap="$spacing12"
      hoverStyle={{
        backgroundColor: hoverColor as ColorTokens,
      }}
      justifyContent="space-between"
      px="$spacing12"
      py="$spacing8"
      onPress={onPress}
    >
      <Flex row justifyContent="space-between" flexGrow={1}>
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
        {count !== undefined && (
          <Text alignSelf="center" color="$neutral2" variant="subheading2">
            {count}
          </Text>
        )}
      </Flex>

      {RightIcon ? (
        <RightIcon color="$neutral3" size={iconSizes.icon24} strokeWidth={iconProps?.strokeWidth ?? undefined} />
      ) : (
        !hideChevron && (
          <RotatableChevron color="$neutral3" direction="end" height={iconSizes.icon20} width={iconSizes.icon20} />
        )
      )}
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
  checked,
  disabled,
  onCheckedChange,
}: {
  title: string
  Icon: GeneratedIcon
  checked: boolean
  disabled?: boolean
  onCheckedChange: (checked: boolean) => void
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
      <Switch checked={checked} variant="branded" disabled={disabled} onCheckedChange={onCheckedChange} />
    </Flex>
  )
}

function SettingsSection({ title, children }: { title: string; children: JSX.Element | JSX.Element[] }): JSX.Element {
  return (
    <Flex gap="$spacing4">
      <Text color="$neutral2" px={SCREEN_ITEM_HORIZONTAL_PAD} variant="subheading2">
        {title}
      </Text>
      {children}
    </Flex>
  )
}
