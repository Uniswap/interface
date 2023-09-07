import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack'
import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppSelector, useAppTheme } from 'src/app/hooks'
import {
  AppStackParamList,
  AppStackScreenProp,
  ExploreStackParamList,
  OnboardingStackParamList,
  SettingsStackParamList,
} from 'src/app/navigation/types'
import { HorizontalEdgeGestureTarget } from 'src/components/layout/screens/EdgeGestureTarget'
import { useBiometricCheck } from 'src/features/biometrics/useBiometricCheck'
import { OnboardingEntryPoint } from 'src/features/onboarding/utils'
import { DevScreen } from 'src/screens/DevScreen'
import { EducationScreen } from 'src/screens/EducationScreen'
import { ExploreScreen } from 'src/screens/ExploreScreen'
import { ExternalProfileScreen } from 'src/screens/ExternalProfileScreen'
import { HomeScreen } from 'src/screens/HomeScreen'
import { ImportMethodScreen } from 'src/screens/Import/ImportMethodScreen'
import { RestoreCloudBackupLoadingScreen } from 'src/screens/Import/RestoreCloudBackupLoadingScreen'
import { RestoreCloudBackupPasswordScreen } from 'src/screens/Import/RestoreCloudBackupPasswordScreen'
import { RestoreCloudBackupScreen } from 'src/screens/Import/RestoreCloudBackupScreen'
import { SeedPhraseInputScreen } from 'src/screens/Import/SeedPhraseInputScreen'
import { SelectWalletScreen } from 'src/screens/Import/SelectWalletScreen'
import { WatchWalletScreen } from 'src/screens/Import/WatchWalletScreen'
import { NFTCollectionScreen } from 'src/screens/NFTCollectionScreen'
import { NFTItemScreen } from 'src/screens/NFTItemScreen'
import { BackupScreen } from 'src/screens/Onboarding/BackupScreen'
import { CloudBackupPasswordConfirmScreen } from 'src/screens/Onboarding/CloudBackupPasswordConfirmScreen'
import { CloudBackupPasswordCreateScreen } from 'src/screens/Onboarding/CloudBackupPasswordCreateScreen'
import { CloudBackupProcessingScreen } from 'src/screens/Onboarding/CloudBackupProcessingScreen'
import { EditNameScreen } from 'src/screens/Onboarding/EditNameScreen'
import { LandingScreen } from 'src/screens/Onboarding/LandingScreen'
import { ManualBackupScreen } from 'src/screens/Onboarding/ManualBackupScreen'
import { NotificationsSetupScreen } from 'src/screens/Onboarding/NotificationsSetupScreen'
import { QRAnimationScreen } from 'src/screens/Onboarding/QRAnimationScreen'
import { SecuritySetupScreen } from 'src/screens/Onboarding/SecuritySetupScreen'
import { OnboardingScreens, Screens } from 'src/screens/Screens'
import { SettingsAppearanceScreen } from 'src/screens/SettingsAppearanceScreen'
import { SettingsBiometricAuthScreen } from 'src/screens/SettingsBiometricAuthScreen'
import { SettingsChainsScreen } from 'src/screens/SettingsChainsScreen'
import { SettingsCloudBackupPasswordConfirmScreen } from 'src/screens/SettingsCloudBackupPasswordConfirmScreen'
import { SettingsCloudBackupPasswordCreateScreen } from 'src/screens/SettingsCloudBackupPasswordCreateScreen'
import { SettingsCloudBackupProcessingScreen } from 'src/screens/SettingsCloudBackupProcessingScreen'
import { SettingsCloudBackupStatus } from 'src/screens/SettingsCloudBackupStatus'
import { SettingsScreen } from 'src/screens/SettingsScreen'
import { SettingsViewSeedPhraseScreen } from 'src/screens/SettingsViewSeedPhraseScreen'
import { SettingsWallet } from 'src/screens/SettingsWallet'
import { SettingsWalletEdit } from 'src/screens/SettingsWalletEdit'
import { SettingsWalletManageConnection } from 'src/screens/SettingsWalletManageConnection'
import { TokenDetailsScreen } from 'src/screens/TokenDetailsScreen'
import { WebViewScreen } from 'src/screens/WebViewScreen'
import { Icons } from 'ui/src'
import { selectFinishedOnboarding } from 'wallet/src/features/wallet/selectors'

const OnboardingStack = createStackNavigator<OnboardingStackParamList>()
const AppStack = createNativeStackNavigator<AppStackParamList>()
const ExploreStack = createNativeStackNavigator<ExploreStackParamList>()
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>()

function SettingsStackGroup(): JSX.Element {
  return (
    <SettingsStack.Navigator
      screenOptions={{
        ...navOptions.noHeader,
        fullScreenGestureEnabled: true,
        animation: 'slide_from_right',
      }}>
      <SettingsStack.Screen component={SettingsScreen} name={Screens.Settings} />
      <SettingsStack.Screen component={SettingsWallet} name={Screens.SettingsWallet} />
      <SettingsStack.Screen component={SettingsWalletEdit} name={Screens.SettingsWalletEdit} />
      <SettingsStack.Screen
        component={SettingsWalletManageConnection}
        name={Screens.SettingsWalletManageConnection}
      />
      <SettingsStack.Screen component={WebViewScreen} name={Screens.WebView} />
      <SettingsStack.Screen component={SettingsChainsScreen} name={Screens.SettingsChains} />
      <SettingsStack.Screen component={DevScreen} name={Screens.Dev} />
      <SettingsStack.Screen
        component={SettingsBiometricAuthScreen}
        name={Screens.SettingsBiometricAuth}
      />
      <SettingsStack.Screen
        component={SettingsViewSeedPhraseScreen}
        name={Screens.SettingsViewSeedPhrase}
      />
      <SettingsStack.Screen
        component={SettingsCloudBackupPasswordCreateScreen}
        name={Screens.SettingsCloudBackupPasswordCreate}
      />
      <SettingsStack.Screen
        component={SettingsCloudBackupPasswordConfirmScreen}
        name={Screens.SettingsCloudBackupPasswordConfirm}
      />
      <SettingsStack.Screen
        component={SettingsCloudBackupProcessingScreen}
        name={Screens.SettingsCloudBackupProcessing}
      />
      <SettingsStack.Screen
        component={SettingsCloudBackupStatus}
        name={Screens.SettingsCloudBackupStatus}
      />
      <SettingsStack.Screen
        component={SettingsAppearanceScreen}
        name={Screens.SettingsAppearance}
      />
    </SettingsStack.Navigator>
  )
}

export function WrappedHomeScreen(props: AppStackScreenProp<Screens.Home>): JSX.Element {
  useBiometricCheck()
  return <HomeScreen {...props} />
}

export function ExploreStackNavigator(): JSX.Element {
  const theme = useAppTheme()

  return (
    <NavigationContainer
      independent={true}
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
      }}>
      <HorizontalEdgeGestureTarget />
      <ExploreStack.Navigator
        initialRouteName={Screens.Explore}
        screenOptions={{
          ...navOptions.noHeader,
          fullScreenGestureEnabled: true,
          gestureEnabled: true,
          animation: 'slide_from_right',
        }}>
        <ExploreStack.Screen component={ExploreScreen} name={Screens.Explore} />
        <ExploreStack.Group
          screenOptions={{ contentStyle: { backgroundColor: theme.colors.surface1 } }}>
          <ExploreStack.Screen component={ExternalProfileScreen} name={Screens.ExternalProfile} />
          <ExploreStack.Screen component={NFTCollectionScreen} name={Screens.NFTCollection} />
          <ExploreStack.Screen component={NFTItemScreen} name={Screens.NFTItem} />
          <ExploreStack.Screen component={TokenDetailsScreen} name={Screens.TokenDetails} />
        </ExploreStack.Group>
      </ExploreStack.Navigator>
    </NavigationContainer>
  )
}

const renderEmptyBackImage = (): JSX.Element => <></>

export function OnboardingStackNavigator(): JSX.Element {
  // TODO (MOB-1211): import these values from Tamagui
  const theme = useAppTheme()
  const insets = useSafeAreaInsets()

  const renderHeaderBackImage = (): JSX.Element => (
    <Icons.RotatableChevron color="$neutral2" height={28} width={28} />
  )

  return (
    <OnboardingStack.Navigator>
      <OnboardingStack.Group
        screenOptions={{
          headerMode: 'float',
          headerTitle: '',
          headerBackTitleVisible: false,
          headerBackImage: renderHeaderBackImage,
          headerStatusBarHeight: insets.top + theme.spacing.spacing8,
          headerTransparent: true,
          headerTintColor: theme.colors.neutral2,
          headerLeftContainerStyle: { paddingLeft: theme.spacing.spacing16 },
          headerRightContainerStyle: { paddingRight: theme.spacing.spacing16 },
          ...TransitionPresets.SlideFromRightIOS,
        }}>
        <OnboardingStack.Screen
          component={LandingScreen}
          name={OnboardingScreens.Landing}
          options={{ headerShown: false }}
        />
        <OnboardingStack.Screen component={EditNameScreen} name={OnboardingScreens.EditName} />
        <OnboardingStack.Screen component={BackupScreen} name={OnboardingScreens.Backup} />
        <OnboardingStack.Screen
          component={NotificationsSetupScreen}
          name={OnboardingScreens.Notifications}
        />
        <OnboardingStack.Screen component={SecuritySetupScreen} name={OnboardingScreens.Security} />
        <OnboardingStack.Screen
          component={ManualBackupScreen}
          name={OnboardingScreens.BackupManual}
        />
        <OnboardingStack.Screen
          component={QRAnimationScreen}
          name={OnboardingScreens.QRAnimation}
          // There should be no header shown on this screen but if headerShown: false and the user is adding a wallet from the
          // sidebar then when this screen is navigated away from the header will reappear on the home screen on top of the account
          // header.
          // To fix this the header is shown but the backImage is hidden so it appears as if there is no header. This is v hacky but
          // I think it's a react navigation bug and I couldn't find a better solution. Feel free to debug if you're bored.
          options={{
            headerShown: true,
            gestureEnabled: false,
            headerBackImage: renderEmptyBackImage,
          }}
        />
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
        <OnboardingStack.Screen
          component={ImportMethodScreen}
          name={OnboardingScreens.ImportMethod}
        />
        <OnboardingStack.Screen
          component={RestoreCloudBackupLoadingScreen}
          name={OnboardingScreens.RestoreCloudBackupLoading}
        />
        <OnboardingStack.Screen
          component={RestoreCloudBackupScreen}
          name={OnboardingScreens.RestoreCloudBackup}
        />
        <OnboardingStack.Screen
          component={RestoreCloudBackupPasswordScreen}
          name={OnboardingScreens.RestoreCloudBackupPassword}
        />
        <OnboardingStack.Screen
          component={SeedPhraseInputScreen}
          name={OnboardingScreens.SeedPhraseInput}
        />
        <OnboardingStack.Screen
          component={SelectWalletScreen}
          name={OnboardingScreens.SelectWallet}
        />
        <OnboardingStack.Screen
          component={WatchWalletScreen}
          name={OnboardingScreens.WatchWallet}
        />
      </OnboardingStack.Group>
    </OnboardingStack.Navigator>
  )
}

export function AppStackNavigator(): JSX.Element {
  const finishedOnboarding = useAppSelector(selectFinishedOnboarding)

  return (
    <AppStack.Navigator
      screenOptions={{
        headerShown: false,
        fullScreenGestureEnabled: true,
        gestureEnabled: true,
        animation: 'slide_from_right',
      }}>
      {finishedOnboarding && <AppStack.Screen component={WrappedHomeScreen} name={Screens.Home} />}
      <AppStack.Screen
        component={OnboardingStackNavigator}
        name={Screens.OnboardingStack}
        navigationKey={
          finishedOnboarding
            ? OnboardingEntryPoint.Sidebar.valueOf()
            : OnboardingEntryPoint.FreshInstallOrReplace.valueOf()
        }
      />
      <AppStack.Screen component={ExternalProfileScreen} name={Screens.ExternalProfile} />
      <AppStack.Screen component={TokenDetailsScreen} name={Screens.TokenDetails} />
      <AppStack.Screen component={NFTItemScreen} name={Screens.NFTItem} />
      <AppStack.Screen component={NFTCollectionScreen} name={Screens.NFTCollection} />
      <AppStack.Screen component={WebViewScreen} name={Screens.WebView} />
      <AppStack.Screen component={SettingsStackGroup} name={Screens.SettingsStack} />
      <AppStack.Group screenOptions={navOptions.presentationModal}>
        <AppStack.Screen component={EducationScreen} name={Screens.Education} />
      </AppStack.Group>
    </AppStack.Navigator>
  )
}

const navOptions = {
  noHeader: { headerShown: false },
  presentationModal: { presentation: 'modal' },
} as const
