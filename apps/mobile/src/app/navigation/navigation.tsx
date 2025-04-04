import { DdRumReactNavigationTracking } from '@datadog/mobile-react-navigation'
import {
  NavigationContainer,
  NavigationContainerRefWithCurrent,
  NavigationState,
  createNavigationContainerRef,
} from '@react-navigation/native'
import { NativeStackNavigationOptions, createNativeStackNavigator } from '@react-navigation/native-stack'
import { StackNavigationOptions, TransitionPresets, createStackNavigator } from '@react-navigation/stack'
import React, { useEffect } from 'react'
import { DevSettings } from 'react-native'
import { INCLUDE_PROTOTYPE_FEATURES } from 'react-native-dotenv'
import { useSelector } from 'react-redux'
import { ExperimentsModal } from 'src/app/modals/ExperimentsModal'
import { KoreaCexTransferInfoModal } from 'src/app/modals/KoreaCexTransferInfoModal'
import { NotificationsOSSettingsModal } from 'src/app/modals/NotificationsOSSettingsModal'
import { renderHeaderBackButton, renderHeaderBackImage } from 'src/app/navigation/components'
import { navigationRef } from 'src/app/navigation/navigationRef'
import {
  AppStackParamList,
  AppStackScreenProp,
  ExploreStackParamList,
  FiatOnRampStackParamList,
  OnboardingStackParamList,
  SettingsStackParamList,
  useAppStackNavigation,
} from 'src/app/navigation/types'
import { FundWalletModal } from 'src/components/home/introCards/FundWalletModal'
import { HorizontalEdgeGestureTarget } from 'src/components/layout/screens/EdgeGestureTarget'
import { ExchangeTransferModal } from 'src/features/fiatOnRamp/ExchangeTransferModal'
import { FiatOnRampProvider } from 'src/features/fiatOnRamp/FiatOnRampContext'
import { ClaimUnitagScreen } from 'src/features/unitags/ClaimUnitagScreen'
import { EditUnitagProfileScreen } from 'src/features/unitags/EditUnitagProfileScreen'
import { UnitagChooseProfilePicScreen } from 'src/features/unitags/UnitagChooseProfilePicScreen'
import { UnitagConfirmationScreen } from 'src/features/unitags/UnitagConfirmationScreen'
import { AppLoadingScreen } from 'src/screens/AppLoadingScreen'
import { DevScreen } from 'src/screens/DevScreen'
import { EducationScreen } from 'src/screens/EducationScreen'
import { ExploreScreen } from 'src/screens/ExploreScreen'
import { ExternalProfileScreen } from 'src/screens/ExternalProfileScreen'
import { FiatOnRampConnectingScreen } from 'src/screens/FiatOnRampConnecting'
import { FiatOnRampScreen } from 'src/screens/FiatOnRampScreen'
import { FiatOnRampServiceProvidersScreen } from 'src/screens/FiatOnRampServiceProviders'
import { HomeScreen } from 'src/screens/HomeScreen/HomeScreen'
import { ImportMethodScreen } from 'src/screens/Import/ImportMethodScreen'
import { OnDeviceRecoveryScreen } from 'src/screens/Import/OnDeviceRecoveryScreen'
import { OnDeviceRecoveryViewSeedPhraseScreen } from 'src/screens/Import/OnDeviceRecoveryViewSeedPhraseScreen'
import { RestoreCloudBackupLoadingScreen } from 'src/screens/Import/RestoreCloudBackupLoadingScreen'
import { RestoreCloudBackupPasswordScreen } from 'src/screens/Import/RestoreCloudBackupPasswordScreen'
import { RestoreCloudBackupScreen } from 'src/screens/Import/RestoreCloudBackupScreen'
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
import { SettingsCloudBackupPasswordConfirmScreen } from 'src/screens/SettingsCloudBackupPasswordConfirmScreen'
import { SettingsCloudBackupPasswordCreateScreen } from 'src/screens/SettingsCloudBackupPasswordCreateScreen'
import { SettingsCloudBackupProcessingScreen } from 'src/screens/SettingsCloudBackupProcessingScreen'
import { SettingsCloudBackupStatus } from 'src/screens/SettingsCloudBackupStatus'
import { SettingsNotificationsScreen } from 'src/screens/SettingsNotificationsScreen'
import { SettingsPrivacyScreen } from 'src/screens/SettingsPrivacyScreen'
import { SettingsScreen } from 'src/screens/SettingsScreen'
import { SettingsViewSeedPhraseScreen } from 'src/screens/SettingsViewSeedPhraseScreen'
import { SettingsWalletManageConnection } from 'src/screens/SettingsWalletManageConnection'
import { TokenDetailsScreen } from 'src/screens/TokenDetailsScreen'
import { WebViewScreen } from 'src/screens/WebViewScreen'
import { useSporeColors } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
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
import { datadogEnabled } from 'utilities/src/environment/constants'
import { OnboardingContextProvider } from 'wallet/src/features/onboarding/OnboardingContext'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'
import { selectFinishedOnboarding } from 'wallet/src/features/wallet/selectors'

const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>()
const AppStack = createNativeStackNavigator<AppStackParamList>()
const ExploreStack = createNativeStackNavigator<ExploreStackParamList>()
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
      <SettingsStack.Screen component={SettingsPrivacyScreen} name={MobileScreens.SettingsPrivacy} />
      <SettingsStack.Screen component={SettingsNotificationsScreen} name={MobileScreens.SettingsNotifications} />
      <SettingsStack.Group screenOptions={navNativeStackOptions.presentationBottomSheet}>
        <SettingsStack.Screen component={NotificationsOSSettingsModal} name={ModalName.NotificationsOSSettings} />
      </SettingsStack.Group>
    </SettingsStack.Navigator>
  )
}

function WrappedHomeScreen(props: AppStackScreenProp<MobileScreens.Home>): JSX.Element {
  const activeAccount = useActiveAccountWithThrow()
  // Adding `key` forces a full re-render and re-mount when switching accounts
  // to avoid issues with wrong cached data being shown in some memoized components that are already mounted.
  return <HomeScreen key={activeAccount.address} {...props} />
}

export const exploreNavigationRef = createNavigationContainerRef<ExploreStackParamList>()
const fiatOnRampNavigationRef = createNavigationContainerRef<FiatOnRampStackParamList>()
const navRefs = [exploreNavigationRef, fiatOnRampNavigationRef, navigationRef]

/**
 * Since we are using multiple navigation containers, we need to start and stop tracking views
 * manually since multiple nav containers are not supported by the Datadog RUM.
 *
 * https://docs.datadoghq.com/real_user_monitoring/mobile_and_tv_monitoring/integrated_libraries/reactnative/#track-view-navigation
 */
const startTracking = (
  navRefToStartTracking: NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>,
): void => {
  if (!datadogEnabled) {
    return
  }
  navRefs.forEach((navRef) => {
    DdRumReactNavigationTracking.stopTrackingViews(navRef.current)
  })
  DdRumReactNavigationTracking.startTrackingViews(navRefToStartTracking.current)
}

/**
 * Since we are using multiple navigation containers, we need to start and stop tracking views
 * manually since multiple nav containers are not supported by the Datadog RUM.
 *
 * https://docs.datadoghq.com/real_user_monitoring/mobile_and_tv_monitoring/integrated_libraries/reactnative/#track-view-navigation
 */
const stopTracking = (state: NavigationState | undefined): void => {
  if (!datadogEnabled) {
    return
  }
  const navContainerIsClosing = !state || state.routes.length === 0
  if (navContainerIsClosing) {
    navRefs.forEach((navRef) => {
      DdRumReactNavigationTracking.stopTrackingViews(navRef.current)
    })
    DdRumReactNavigationTracking.startTrackingViews(navigationRef.current)
  }
}

export function ExploreStackNavigator(): JSX.Element {
  const colors = useSporeColors()

  return (
    <NavigationContainer
      ref={exploreNavigationRef}
      independent
      theme={{
        dark: false,
        colors: {
          primary: 'transparent',
          background: 'transparent',
          card: 'transparent',
          text: 'transparent',
          border: 'transparent',
          notification: 'transparent',
        },
      }}
      onStateChange={stopTracking}
      onReady={() => startTracking(exploreNavigationRef)}
    >
      <HorizontalEdgeGestureTarget />
      <ExploreStack.Navigator
        initialRouteName={MobileScreens.Explore}
        screenOptions={navNativeStackOptions.independentBsm}
      >
        <ExploreStack.Screen component={ExploreScreen} name={MobileScreens.Explore} />
        <ExploreStack.Group screenOptions={{ contentStyle: { backgroundColor: colors.surface1.val } }}>
          <ExploreStack.Screen name={MobileScreens.ExternalProfile}>
            {(props): JSX.Element => <ExternalProfileScreen {...props} renderedInModal />}
          </ExploreStack.Screen>
          <ExploreStack.Screen name={MobileScreens.NFTCollection}>
            {(props): JSX.Element => <NFTCollectionScreen {...props} renderedInModal />}
          </ExploreStack.Screen>
          <ExploreStack.Screen component={NFTItemScreen} name={MobileScreens.NFTItem} />
          <ExploreStack.Screen component={TokenDetailsScreen} name={MobileScreens.TokenDetails} />
        </ExploreStack.Group>
      </ExploreStack.Navigator>
    </NavigationContainer>
  )
}

export function FiatOnRampStackNavigator(): JSX.Element {
  return (
    <NavigationContainer
      ref={fiatOnRampNavigationRef}
      independent
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
          headerBackTitleVisible: false,
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
  const enabledInEnvOrDev =
    INCLUDE_PROTOTYPE_FEATURES === 'true' || process.env.INCLUDE_PROTOTYPE_FEATURES === 'true' || __DEV__

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
      {finishedOnboarding && <AppStack.Screen component={WrappedHomeScreen} name={MobileScreens.Home} />}
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
      <AppStack.Group screenOptions={navNativeStackOptions.presentationModal}>
        <AppStack.Screen component={EducationScreen} name={MobileScreens.Education} />
      </AppStack.Group>
      <AppStack.Group screenOptions={navNativeStackOptions.presentationBottomSheet}>
        <AppStack.Screen component={NotificationsOSSettingsModal} name={ModalName.NotificationsOSSettings} />
        <AppStack.Screen component={FundWalletModal} name={ModalName.FundWallet} />
        <AppStack.Screen component={KoreaCexTransferInfoModal} name={ModalName.KoreaCexTransferInfoModal} />
        <AppStack.Screen component={ExchangeTransferModal} name={ModalName.ExchangeTransferModal} />
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

const navNativeStackOptions: Record<string, NativeStackNavigationOptions> = {
  noHeader: { headerShown: false },
  presentationModal: { presentation: 'modal' },
  presentationBottomSheet: {
    presentation: 'containedTransparentModal',
    animation: 'none',
    animationDuration: 0,
    contentStyle: { backgroundColor: 'transparent' },
  },
  independentBsm: {
    fullScreenGestureEnabled: true,
    gestureEnabled: true,
    headerShown: false,
    animation: 'slide_from_right',
  },
}

const navStackOptions: Record<string, StackNavigationOptions> = {
  noHeader: { headerShown: false },
}
