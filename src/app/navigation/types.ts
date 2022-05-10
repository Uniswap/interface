import { BottomTabNavigationProp, BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import {
  CompositeNavigationProp,
  CompositeScreenProps,
  NavigatorScreenParams,
  useNavigation,
} from '@react-navigation/native'
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'
import { Currency } from '@uniswap/sdk-core'
import { EducationContentType } from 'src/components/education'
import { ChainId } from 'src/constants/chains'
import { NFTAsset } from 'src/features/nfts/types'
import { TransactionState } from 'src/features/transactions/transactionState/transactionState'
import { OnboardingScreens, Screens, Tabs } from 'src/screens/Screens'

export type TabParamList = {
  [Tabs.Home]: undefined
  [Tabs.Portfolio]: undefined
  [Tabs.Swap]: { swapFormState?: TransactionState } | undefined
  [Tabs.Explore]: undefined
  [Tabs.NFT]: undefined
}

export type AccountStackParamList = {
  [Screens.Accounts]: undefined
  [Screens.ImportAccount]: undefined
  [Screens.Ledger]: undefined
}

export type SettingsStackParamList = {
  [Screens.Settings]: undefined
  [Screens.SettingsChains]: undefined
  [Screens.SettingsSupport]: undefined
  [Screens.SettingsTestConfigs]: undefined
  [Screens.Dev]: undefined
  [OnboardingScreens.Landing]: undefined // temporary to be able to view onboarding from settings
}

export type OnboardingStackParamList = {
  [OnboardingScreens.BackupCloud]: {
    pin?: string
  }
  [OnboardingScreens.BackupCloudProcessing]: {
    pin: string
    type: 'restore' | 'backup'
  }
  [OnboardingScreens.BackupManual]: undefined
  [OnboardingScreens.Backup]: undefined
  [OnboardingScreens.Landing]: undefined
  [OnboardingScreens.NameAndColor]: undefined
  [OnboardingScreens.Notifications]: undefined
  [OnboardingScreens.Outro]: undefined
  [OnboardingScreens.Security]: undefined
}

export type AppStackParamList = {
  [Screens.AccountStack]: NavigatorScreenParams<AccountStackParamList>
  [Screens.CurrencySelector]: {
    showNonZeroBalancesOnly: boolean
    onSelectCurrency: (currency: Currency) => void
    otherCurrencyAddress?: string
    otherCurrencyChainId?: ChainId
    selectedCurrencyAddress?: string
    selectedCurrencyChainId?: ChainId
  }
  [Screens.Education]: {
    type: EducationContentType
  }
  [Screens.Notifications]: undefined | { txHash: string }
  [Screens.NFTCollection]: {
    nftAssets: NFTAsset.Asset[]
  }
  [Screens.OnboardingStack]: NavigatorScreenParams<OnboardingStackParamList>
  [Screens.RecipientSelector]: {
    selectedRecipient?: string
    setSelectedRecipient: (newRecipient: string) => void
  }
  [Screens.SettingsStack]: NavigatorScreenParams<SettingsStackParamList>
  [Screens.Swap]: { swapFormState?: TransactionState } | undefined
  [Screens.SwapConfig]: undefined
  [Screens.TabNavigator]: NavigatorScreenParams<TabParamList>
  [Screens.Transfer]: { transferFormState?: TransactionState } | undefined
  [Screens.TokenDetails]: { currency: Currency }
}

export type AppStackNavigationProp = NativeStackNavigationProp<AppStackParamList>
export type AppStackScreenProps = NativeStackScreenProps<AppStackParamList>
export type AppStackScreenProp<Screen extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  Screen
>

export type TabNavigationProp<Screen extends keyof TabParamList> = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, Screen>,
  AppStackNavigationProp
>
export type TabScreenProp<Screen extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, Screen>,
  AppStackScreenProps
>

export type AccountStackNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<AccountStackParamList>,
  AppStackNavigationProp
>

export type AccountStackScreenProp<Screen extends keyof AccountStackParamList> =
  CompositeScreenProps<NativeStackScreenProps<AccountStackParamList, Screen>, AppStackScreenProps>

export type SettingsStackNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<SettingsStackParamList>,
  AppStackNavigationProp
>

export type SettingsStackScreenProp<Screen extends keyof SettingsStackParamList> =
  CompositeScreenProps<NativeStackScreenProps<SettingsStackParamList, Screen>, AppStackScreenProps>

export type OnboardingStackNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<OnboardingStackParamList>,
  AppStackNavigationProp
>

export type RootParamList = TabParamList &
  AccountStackParamList &
  SettingsStackParamList &
  OnboardingStackParamList &
  AppStackParamList

export const useAppStackNavigation = () => useNavigation<AppStackNavigationProp>()
export const useAccountStackNavigation = () => useNavigation<AccountStackNavigationProp>()
export const useSettingsStackNavigation = () => useNavigation<SettingsStackNavigationProp>()
export const useOnboardingStackNavigation = () => useNavigation<OnboardingStackNavigationProp>()
