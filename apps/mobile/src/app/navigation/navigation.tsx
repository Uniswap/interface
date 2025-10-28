import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import React, { useEffect } from 'react'
import { DevSettings } from 'react-native'
import { INCLUDE_PROTOTYPE_FEATURES, IS_E2E_TEST } from 'react-native-dotenv'
import { useSelector } from 'react-redux'
import { AccountSwitcherModal } from 'src/app/modals/AccountSwitcherModal'
import { BackupReminderModal } from 'src/app/modals/BackupReminderModal'
import { BackupWarningModal } from 'src/app/modals/BackupWarningModal'
import { BridgedAssetWarningWrapper } from 'src/app/modals/BridgedAssetWarningWrapper'
import { ExperimentsModal } from 'src/app/modals/ExperimentsModal'
import { ExploreModal } from 'src/app/modals/ExploreModal'
import { KoreaCexTransferInfoModal } from 'src/app/modals/KoreaCexTransferInfoModal'
import { NotificationsOSSettingsModal } from 'src/app/modals/NotificationsOSSettingsModal'
import { SmartWalletInfoModal } from 'src/app/modals/SmartWalletInfoModal'
import { SwapModal } from 'src/app/modals/SwapModal'
import { TokenWarningModalWrapper } from 'src/app/modals/TokenWarningModalWrapper'
import { ViewOnlyExplainerModal } from 'src/app/modals/ViewOnlyExplainerModal'
import { renderHeaderBackButton, renderHeaderBackImage } from 'src/app/navigation/components'
import { fiatOnRampNavigationRef, navigationRef } from 'src/app/navigation/navigationRef'
import { navNativeStackOptions, navStackOptions } from 'src/app/navigation/navStackOptions'
import { TabsNavigator } from 'src/app/navigation/tabs/TabsNavigator'
import { startTracking, stopTracking } from 'src/app/navigation/trackingHelpers'
import {
  AppStackParamList,
  FiatOnRampStackParamList,
  OnboardingStackParamList,
  SettingsStackParamList,
  useAppStackNavigation,
} from 'src/app/navigation/types'
import { FundWalletModal } from 'src/components/home/introCards/FundWalletModal'
import { HorizontalEdgeGestureTarget } from 'src/components/layout/screens/EdgeGestureTarget'
import { AdvancedSettingsModal } from 'src/components/modals/ReactNavigationModals/AdvancedSettingsModal'
import { BridgedAssetModalScreen } from 'src/components/modals/ReactNavigationModals/BridgedAssetModal'
import { HiddenTokenInfoModalScreen } from 'src/components/modals/ReactNavigationModals/HiddenTokenInfoModalScreen'
import { LanguageSettingsScreen } from 'src/components/modals/ReactNavigationModals/LanguageSettingsScreen'
import { PasskeyHelpModalScreen } from 'src/components/modals/ReactNavigationModals/PasskeyHelpModalScreen'
import { PasskeyManagementModalScreen } from 'src/components/modals/ReactNavigationModals/PasskeyManagementModalScreen'
import { PermissionsSettingsScreen } from 'src/components/modals/ReactNavigationModals/PermissionsSettingsScreen'
import { PortfolioBalanceSettingsScreen } from 'src/components/modals/ReactNavigationModals/PortfolioBalanceSettingsScreen'
import { SmartWalletEnabledModalScreen } from 'src/components/modals/ReactNavigationModals/SmartWalletEnabledModalScreen'
import { SmartWalletNudgeScreen } from 'src/components/modals/ReactNavigationModals/SmartWalletNudgeScreen'
import { TestnetModeModalScreen } from 'src/components/modals/ReactNavigationModals/TestnetModeModalScreen'
import { WormholeModalScreen } from 'src/components/modals/ReactNavigationModals/WormholeModal'
import { RemoveWalletModal } from 'src/components/RemoveWallet/RemoveWalletModal'
import { PrivateKeySpeedBumpModal } from 'src/components/RestoreWalletModal/PrivateKeySpeedBumpModal'
import { RestoreWalletModal } from 'src/components/RestoreWalletModal/RestoreWalletModal'
import { ConnectionsDappListModal } from 'src/components/Settings/ConnectionsDappModal/ConnectionsDappListModal'
import { EditLabelSettingsModal } from 'src/components/Settings/EditWalletModal/EditLabelSettingsModal'
import { EditProfileSettingsModal } from 'src/components/Settings/EditWalletModal/EditProfileSettingsModal'
import { ManageWalletsModal } from 'src/components/Settings/ManageWalletsModal'
import { SettingsAppearanceModal } from 'src/components/Settings/SettingsAppearanceModal'
import { SettingsBiometricModal } from 'src/components/Settings/SettingsBiometricModal'
import { BuyNativeTokenModal } from 'src/components/TokenDetails/BuyNativeTokenModal'
import { UnitagsIntroModal } from 'src/components/unitags/UnitagsIntroModal'
import { ExchangeTransferModal } from 'src/features/fiatOnRamp/ExchangeTransferModal'
import { FiatOnRampProvider } from 'src/features/fiatOnRamp/FiatOnRampContext'
import { ScreenshotWarningModal } from 'src/features/onboarding/ScreenshotWarningModal'
import { ScantasticModal } from 'src/features/scantastic/ScantasticModal'
import { TestnetSwitchModal } from 'src/features/testnetMode/TestnetSwitchModal'
import { ClaimUnitagScreen } from 'src/features/unitags/ClaimUnitagScreen'
import { EditUnitagProfileScreen } from 'src/features/unitags/EditUnitagProfileScreen'
import { UnitagChooseProfilePicScreen } from 'src/features/unitags/UnitagChooseProfilePicScreen'
import { UnitagConfirmationScreen } from 'src/features/unitags/UnitagConfirmationScreen'
import { AppLoadingScreen } from 'src/screens/AppLoadingScreen'
import { DevScreen } from 'src/screens/DevScreen'
import { EducationScreen } from 'src/screens/EducationScreen'
import { ExternalProfileScreen } from 'src/screens/ExternalProfileScreen'
import { FiatOnRampConnectingScreen } from 'src/screens/FiatOnRampConnecting'
import { FiatOnRampScreen } from 'src/screens/FiatOnRampScreen'
import { FiatOnRampServiceProvidersScreen } from 'src/screens/FiatOnRampServiceProviders'
import { WrappedHomeScreen } from 'src/screens/HomeScreen/HomeScreen'
import { ImportMethodScreen } from 'src/screens/Import/ImportMethodScreen'
import { OnDeviceRecoveryScreen } from 'src/screens/Import/OnDeviceRecoveryScreen'
import { OnDeviceRecoveryViewSeedPhraseScreen } from 'src/screens/Import/OnDeviceRecoveryViewSeedPhraseScreen'
import { PasskeyImportScreen } from 'src/screens/Import/PasskeyImportScreen'
import { RestoreCloudBackupLoadingScreen } from 'src/screens/Import/RestoreCloudBackupLoadingScreen'
import { RestoreCloudBackupPasswordScreen } from 'src/screens/Import/RestoreCloudBackupPasswordScreen'
import { RestoreCloudBackupScreen } from 'src/screens/Import/RestoreCloudBackupScreen'
import { RestoreMethodScreen } from 'src/screens/Import/RestoreMethodScreen'
import { SeedPhraseInputScreen } from 'src/screens/Import/SeedPhraseInputScreen/SeedPhraseInputScreen'
import { SelectWalletScreen } from 'src/screens/Import/SelectWalletScreen'
import { WatchWalletScreen } from 'src/screens/Import/WatchWalletScreen'
import { NFTCollectionScreen } from 'src/screens/NFTCollectionScreen'
import { NFTItemScreen } from 'src/screens/NFTItemScreen'
import { BackupScreen } from 'src/screens/Onboarding/BackupScreen'
import { CloudBackupPasswordConfirmScreen } from 'src/screens/Onboarding/CloudBackupPasswordConfirmScreen'
import { CloudBackupPasswordCreateScreen } from 'src/screens/Onboarding/CloudBackupPasswordCreateScreen'
import { CloudBackupProcessingScreen } from 'src/screens/Onboarding/CloudBackupProcessingScreen'
import { LandingScreen } from 'src/screens/Onboarding/LandingScreen'
import { ManualBackupScreen } from 'src/screens/Onboarding/ManualBackupScreen'
import { NotificationsSetupScreen } from 'src/screens/Onboarding/NotificationsSetupScreen'
import { SecuritySetupScreen } from 'src/screens/Onboarding/SecuritySetupScreen'
import { WelcomeWalletScreen } from 'src/screens/Onboarding/WelcomeWalletScreen'
import { ReceiveCryptoModal } from 'src/screens/ReceiveCryptoModal'
import { SettingsCloudBackupPasswordConfirmScreen } from 'src/screens/SettingsCloudBackupPasswordConfirmScreen'
import { SettingsCloudBackupPasswordCreateScreen } from 'src/screens/SettingsCloudBackupPasswordCreateScreen'
import { SettingsCloudBackupProcessingScreen } from 'src/screens/SettingsCloudBackupProcessingScreen'
import { SettingsCloudBackupStatus } from 'src/screens/SettingsCloudBackupStatus'
import { SettingsFiatCurrencyModal } from 'src/screens/SettingsFiatCurrencyModal'
import { SettingsNotificationsScreen } from 'src/screens/SettingsNotificationsScreen'
import { SettingsPrivacyScreen } from 'src/screens/SettingsPrivacyScreen'
import { SettingsScreen } from 'src/screens/SettingsScreen'
import { SettingsSmartWalletScreen } from 'src/screens/SettingsSmartWalletScreen'
import { SettingsViewSeedPhraseScreen } from 'src/screens/SettingsViewSeedPhraseScreen'
import { SettingsWalletManageConnection } from 'src/screens/SettingsWalletManageConnection'
import { TokenDetailsScreen } from 'src/screens/TokenDetailsScreen'
import { ViewPrivateKeysScreen } from 'src/screens/ViewPrivateKeys/ViewPrivateKeysScreen'
import { WebViewScreen } from 'src/screens/WebViewScreen'
import { useSporeColors } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import {
  FiatOnRampScreens,
  MobileScreens,
  OnboardingScreens,
  UnitagScreens,
  UnitagStackParamList,
} from 'uniswap/src/types/screens/mobile'
import { OnboardingContextProvider } from 'wallet/src/features/onboarding/OnboardingContext'
import { selectFinishedOnboarding } from 'wallet/src/features/wallet/selectors'

/**
 * Note that we need to explicitly check for the imports from 'react-native-dotenv'
 * in for the bundler to know to exclude this code from release builds.
 */
const enabledInEnvOrDev =
  INCLUDE_PROTOTYPE_FEATURES === 'true' ||
  process.env.INCLUDE_PROTOTYPE_FEATURES === 'true' ||
  IS_E2E_TEST === 'true' ||
  process.env.IS_E2E_TEST === 'true' ||
  __DEV__

const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>()
const AppStack = createNativeStackNavigator<AppStackParamList>()
const FiatOnRampStack = createNativeStackNavigator<FiatOnRampStackParamList>()
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>()
const UnitagStack = createStackNavigator<UnitagStackParamList>()

function SettingsStackGroup(): JSX.Element {
  return (
    <SettingsStack.Navigator
      screenOptions={{
        ...navNativeStackOptions.noHeader,
        fullScreenGestureEnabled: true,
        animation: 'slide_from_right',
      }}
    >
      <SettingsStack.Screen component={SettingsScreen} name={MobileScreens.Settings} />
      <SettingsStack.Screen
        component={SettingsWalletManageConnection}
        name={MobileScreens.SettingsWalletManageConnection}
      />
      <SettingsStack.Screen component={WebViewScreen} name={MobileScreens.WebView} />
      <SettingsStack.Screen component={DevScreen} name={MobileScreens.Dev} />
      <SettingsStack.Screen component={SettingsViewSeedPhraseScreen} name={MobileScreens.SettingsViewSeedPhrase} />
      <SettingsStack.Screen
        component={SettingsCloudBackupPasswordCreateScreen}
        name={MobileScreens.SettingsCloudBackupPasswordCreate}
      />
      <SettingsStack.Screen
        component={SettingsCloudBackupPasswordConfirmScreen}
        name={MobileScreens.SettingsCloudBackupPasswordConfirm}
      />
      <SettingsStack.Screen
        component={SettingsCloudBackupProcessingScreen}
        name={MobileScreens.SettingsCloudBackupProcessing}
      />
      <SettingsStack.Screen component={SettingsCloudBackupStatus} name={MobileScreens.SettingsCloudBackupStatus} />
      <SettingsStack.Screen component={SettingsSmartWalletScreen} name={MobileScreens.SettingsSmartWallet} />
      <SettingsStack.Screen component={SettingsPrivacyScreen} name={MobileScreens.SettingsPrivacy} />
      <SettingsStack.Screen component={SettingsNotificationsScreen} name={MobileScreens.SettingsNotifications} />
      <SettingsStack.Screen component={ViewPrivateKeysScreen} name={MobileScreens.ViewPrivateKeys} />
      <SettingsStack.Group screenOptions={navNativeStackOptions.presentationBottomSheet}>
        <SettingsStack.Screen component={NotificationsOSSettingsModal} name={ModalName.NotificationsOSSettings} />
        <SettingsStack.Screen component={UnitagsIntroModal} name={ModalName.UnitagsIntro} />
        <SettingsStack.Screen component={RestoreWalletModal} name={ModalName.RestoreWallet} />
        {enabledInEnvOrDev &&
          ((): JSX.Element => {
            return <SettingsStack.Screen component={ExperimentsModal} name={ModalName.Experiments} />
          })()}
      </SettingsStack.Group>
    </SettingsStack.Navigator>
  )
}

export function FiatOnRampStackNavigator(): JSX.Element {
  return (
    <NavigationIndependentTree>
      <NavigationContainer
        ref={fiatOnRampNavigationRef}
        onReady={() => startTracking(fiatOnRampNavigationRef)}
        onStateChange={stopTracking}
      >
        <HorizontalEdgeGestureTarget />
        <FiatOnRampProvider>
          <FiatOnRampStack.Navigator
            initialRouteName={FiatOnRampScreens.AmountInput}
            screenOptions={navNativeStackOptions.independentBsm}
          >
            <FiatOnRampStack.Screen component={FiatOnRampScreen} name={FiatOnRampScreens.AmountInput} />
            <FiatOnRampStack.Screen
              component={FiatOnRampServiceProvidersScreen}
              name={FiatOnRampScreens.ServiceProviders}
            />
            <FiatOnRampStack.Screen component={FiatOnRampConnectingScreen} name={FiatOnRampScreens.Connecting} />
          </FiatOnRampStack.Navigator>
        </FiatOnRampProvider>
      </NavigationContainer>
    </NavigationIndependentTree>
  )
}

function OnboardingStackNavigator(): JSX.Element {
  const colors = useSporeColors()

  const isOnboardingKeyringEnabled = useFeatureFlag(FeatureFlags.OnboardingKeyring)

  return (
    <OnboardingContextProvider>
      <OnboardingStack.Navigator>
        <OnboardingStack.Group
          screenOptions={{
            headerTitle: '',
            gestureEnabled: true,
            headerBackVisible: false,
            headerLeft: renderHeaderBackButton,
            headerTransparent: true,
            headerTintColor: colors.neutral2.val,
            animation: 'slide_from_right',
          }}
        >
          {isOnboardingKeyringEnabled && (
            <OnboardingStack.Screen
              component={AppLoadingScreen}
              name={OnboardingScreens.AppLoading}
              options={navNativeStackOptions.noHeader}
            />
          )}
          <OnboardingStack.Screen
            component={LandingScreen}
            name={OnboardingScreens.Landing}
            options={navNativeStackOptions.noHeader}
          />
          <OnboardingStack.Screen component={ClaimUnitagScreen} name={UnitagScreens.ClaimUnitag} />
          <OnboardingStack.Screen
            component={UnitagChooseProfilePicScreen}
            name={UnitagScreens.ChooseProfilePicture}
            options={{ animation: 'fade' }}
          />
          <OnboardingStack.Screen component={BackupScreen} name={OnboardingScreens.Backup} />
          <OnboardingStack.Screen component={NotificationsSetupScreen} name={OnboardingScreens.Notifications} />
          <OnboardingStack.Screen component={SecuritySetupScreen} name={OnboardingScreens.Security} />
          <OnboardingStack.Screen component={ManualBackupScreen} name={OnboardingScreens.BackupManual} />
          <OnboardingStack.Screen component={WelcomeWalletScreen} name={OnboardingScreens.WelcomeWallet} />
          <OnboardingStack.Screen component={PasskeyImportScreen} name={OnboardingScreens.PasskeyImport} />
          <OnboardingStack.Screen
            component={CloudBackupProcessingScreen}
            name={OnboardingScreens.BackupCloudProcessing}
          />
          <OnboardingStack.Screen
            component={CloudBackupPasswordCreateScreen}
            name={OnboardingScreens.BackupCloudPasswordCreate}
          />
          <OnboardingStack.Screen
            component={CloudBackupPasswordConfirmScreen}
            name={OnboardingScreens.BackupCloudPasswordConfirm}
          />
          <OnboardingStack.Screen component={ImportMethodScreen} name={OnboardingScreens.ImportMethod} />
          <OnboardingStack.Screen component={RestoreMethodScreen} name={OnboardingScreens.RestoreMethod} />
          <OnboardingStack.Screen
            component={OnDeviceRecoveryScreen}
            name={OnboardingScreens.OnDeviceRecovery}
            options={navNativeStackOptions.noHeader}
          />
          <OnboardingStack.Screen
            component={OnDeviceRecoveryViewSeedPhraseScreen}
            name={OnboardingScreens.OnDeviceRecoveryViewSeedPhrase}
            options={navNativeStackOptions.noHeader}
          />
          <OnboardingStack.Screen
            component={RestoreCloudBackupLoadingScreen}
            name={OnboardingScreens.RestoreCloudBackupLoading}
          />
          <OnboardingStack.Screen component={RestoreCloudBackupScreen} name={OnboardingScreens.RestoreCloudBackup} />
          <OnboardingStack.Screen
            component={RestoreCloudBackupPasswordScreen}
            name={OnboardingScreens.RestoreCloudBackupPassword}
          />
          <OnboardingStack.Screen component={SeedPhraseInputScreen} name={OnboardingScreens.SeedPhraseInput} />
          <OnboardingStack.Screen component={SelectWalletScreen} name={OnboardingScreens.SelectWallet} />
          <OnboardingStack.Screen component={WatchWalletScreen} name={OnboardingScreens.WatchWallet} />
          <OnboardingStack.Screen component={ViewPrivateKeysScreen} name={MobileScreens.ViewPrivateKeys} />
        </OnboardingStack.Group>
      </OnboardingStack.Navigator>
    </OnboardingContextProvider>
  )
}

function UnitagStackNavigator(): JSX.Element {
  const colors = useSporeColors()
  const insets = useAppInsets()

  return (
    <UnitagStack.Navigator>
      <UnitagStack.Group
        screenOptions={{
          headerMode: 'float',
          headerTitle: '',
          headerBackButtonDisplayMode: 'minimal',
          headerBackImage: renderHeaderBackImage,
          headerStatusBarHeight: insets.top + spacing.spacing8,
          headerTransparent: true,
          headerTintColor: colors.neutral2.val,
          headerLeftContainerStyle: { paddingLeft: spacing.spacing16 },
          headerRightContainerStyle: { paddingRight: spacing.spacing16 },
          ...TransitionPresets.SlideFromRightIOS,
        }}
      >
        <UnitagStack.Screen component={ClaimUnitagScreen} name={UnitagScreens.ClaimUnitag} />
        <UnitagStack.Screen
          component={UnitagChooseProfilePicScreen}
          name={UnitagScreens.ChooseProfilePicture}
          options={{ ...TransitionPresets.ModalFadeTransition }}
        />
        <UnitagStack.Screen
          component={UnitagConfirmationScreen}
          name={UnitagScreens.UnitagConfirmation}
          options={{ ...navStackOptions.noHeader, gestureEnabled: false }}
        />
        <UnitagStack.Screen
          component={EditUnitagProfileScreen}
          name={UnitagScreens.EditProfile}
          options={{ ...navStackOptions.noHeader, gestureEnabled: false }}
        />
      </UnitagStack.Group>
    </UnitagStack.Navigator>
  )
}

export function AppStackNavigator(): JSX.Element {
  const finishedOnboarding = useSelector(selectFinishedOnboarding)
  const navigation = useAppStackNavigation()

  const isBottomTabsEnabled = useFeatureFlag(FeatureFlags.BottomTabs)

  useEffect(() => {
    // Adds a menu item to navigate to Storybook in debug builds
    if (__DEV__) {
      DevSettings.addMenuItem('Toggle Storybook', () => {
        if (navigationRef.getCurrentRoute()?.name === MobileScreens.Storybook) {
          navigation.goBack()
        } else {
          navigation.navigate(MobileScreens.Storybook)
        }
      })
    }
  }, [navigation])

  return (
    <AppStack.Navigator
      screenOptions={{
        ...navNativeStackOptions.noHeader,
        fullScreenGestureEnabled: true,
        gestureEnabled: true,
        animation: 'slide_from_right',
      }}
    >
      {finishedOnboarding && (
        <AppStack.Screen
          component={isBottomTabsEnabled ? TabsNavigator : WrappedHomeScreen}
          name={MobileScreens.Home}
        />
      )}
      <AppStack.Screen
        component={OnboardingStackNavigator}
        name={MobileScreens.OnboardingStack}
        navigationKey={
          finishedOnboarding
            ? OnboardingEntryPoint.Sidebar.valueOf()
            : OnboardingEntryPoint.FreshInstallOrReplace.valueOf()
        }
      />
      <AppStack.Screen component={UnitagStackNavigator} name={MobileScreens.UnitagStack} />
      <AppStack.Screen component={ExternalProfileScreen} name={MobileScreens.ExternalProfile} />
      <AppStack.Screen component={TokenDetailsScreen} name={MobileScreens.TokenDetails} />
      <AppStack.Screen component={NFTItemScreen} name={MobileScreens.NFTItem} />
      <AppStack.Screen component={NFTCollectionScreen} name={MobileScreens.NFTCollection} />
      <AppStack.Screen component={WebViewScreen} name={MobileScreens.WebView} />
      <AppStack.Screen component={SettingsStackGroup} name={MobileScreens.SettingsStack} />
      <AppStack.Screen component={ViewPrivateKeysScreen} name={MobileScreens.ViewPrivateKeys} />
      <AppStack.Group screenOptions={navNativeStackOptions.presentationModal}>
        <AppStack.Screen component={EducationScreen} name={MobileScreens.Education} />
      </AppStack.Group>
      <AppStack.Group screenOptions={navNativeStackOptions.presentationBottomSheet}>
        <AppStack.Screen component={SwapModal} name={ModalName.Swap} />
        <AppStack.Screen component={ExploreModal} name={ModalName.Explore} />
        <AppStack.Screen component={NotificationsOSSettingsModal} name={ModalName.NotificationsOSSettings} />
        <AppStack.Screen component={FundWalletModal} name={ModalName.FundWallet} />
        <AppStack.Screen component={KoreaCexTransferInfoModal} name={ModalName.KoreaCexTransferInfoModal} />
        <AppStack.Screen component={SmartWalletInfoModal} name={ModalName.SmartWalletInfoModal} />
        <AppStack.Screen component={ExchangeTransferModal} name={ModalName.ExchangeTransferModal} />
        <AppStack.Screen component={TestnetSwitchModal} name={ModalName.TestnetSwitchModal} />
        <AppStack.Screen component={TokenWarningModalWrapper} name={ModalName.TokenWarning} />
        <AppStack.Screen component={BridgedAssetWarningWrapper} name={ModalName.BridgedAssetNav} />
        <AppStack.Screen component={ViewOnlyExplainerModal} name={ModalName.ViewOnlyExplainer} />
        <AppStack.Screen component={UnitagsIntroModal} name={ModalName.UnitagsIntro} />
        <AppStack.Screen component={RestoreWalletModal} name={ModalName.RestoreWallet} />
        <AppStack.Screen component={AccountSwitcherModal} name={ModalName.AccountSwitcher} />
        <AppStack.Screen component={ScantasticModal} name={ModalName.Scantastic} />
        <AppStack.Screen component={BackupReminderModal} name={ModalName.BackupReminder} />
        <AppStack.Screen component={BackupWarningModal} name={ModalName.BackupReminderWarning} />
        <AppStack.Screen component={RemoveWalletModal} name={ModalName.RemoveWallet} />
        <AppStack.Screen component={ReceiveCryptoModal} name={ModalName.ReceiveCryptoModal} />
        <AppStack.Screen component={TestnetModeModalScreen} name={ModalName.TestnetMode} />
        <AppStack.Screen component={BuyNativeTokenModal} name={ModalName.BuyNativeToken} />
        <AppStack.Screen component={HiddenTokenInfoModalScreen} name={ModalName.HiddenTokenInfoModal} />
        <AppStack.Screen component={ScreenshotWarningModal} name={ModalName.ScreenshotWarning} />
        <AppStack.Screen component={PasskeyManagementModalScreen} name={ModalName.PasskeyManagement} />
        <AppStack.Screen component={PasskeyHelpModalScreen} name={ModalName.PasskeysHelp} />
        <AppStack.Screen component={SettingsBiometricModal} name={ModalName.BiometricsModal} />
        <AppStack.Screen component={SettingsFiatCurrencyModal} name={ModalName.FiatCurrencySelector} />
        <AppStack.Screen component={ManageWalletsModal} name={ModalName.ManageWalletsModal} />
        <AppStack.Screen component={EditLabelSettingsModal} name={ModalName.EditLabelSettingsModal} />
        <AppStack.Screen component={EditProfileSettingsModal} name={ModalName.EditProfileSettingsModal} />
        <AppStack.Screen component={ConnectionsDappListModal} name={ModalName.ConnectionsDappListModal} />
        <AppStack.Screen component={PrivateKeySpeedBumpModal} name={ModalName.PrivateKeySpeedBumpModal} />
        <AppStack.Screen component={AdvancedSettingsModal} name={ModalName.SmartWalletAdvancedSettingsModal} />
        <AppStack.Screen component={SmartWalletEnabledModalScreen} name={ModalName.SmartWalletEnabledModal} />
        <AppStack.Screen component={SettingsAppearanceModal} name={ModalName.SettingsAppearance} />
        <AppStack.Screen component={PermissionsSettingsScreen} name={ModalName.PermissionsModal} />
        <AppStack.Screen component={PortfolioBalanceSettingsScreen} name={ModalName.PortfolioBalanceModal} />
        <AppStack.Screen component={LanguageSettingsScreen} name={ModalName.LanguageSelector} />
        <AppStack.Screen component={SmartWalletNudgeScreen} name={ModalName.SmartWalletNudge} />
        <AppStack.Screen component={BridgedAssetModalScreen} name={ModalName.BridgedAsset} />
        <AppStack.Screen component={WormholeModalScreen} name={ModalName.Wormhole} />
        {enabledInEnvOrDev &&
          ((): JSX.Element => {
            return <AppStack.Screen component={ExperimentsModal} name={ModalName.Experiments} />
          })()}
      </AppStack.Group>
      {/* Explicitly using __DEV__ so that the bundler knows to exclude this code from release builds */}
      {__DEV__ &&
        ((): JSX.Element => {
          const StorybookUIRoot = require('src/../.storybook').default
          return <AppStack.Screen component={StorybookUIRoot} name={MobileScreens.Storybook} />
        })()}
    </AppStack.Navigator>
  )
}
