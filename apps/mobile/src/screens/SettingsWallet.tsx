import { useNavigation } from '@react-navigation/core'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo, SectionList } from 'react-native'
import { SvgProps } from 'react-native-svg'
import { useDispatch } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import {
  OnboardingStackNavigationProp,
  SettingsStackNavigationProp,
  SettingsStackParamList,
} from 'src/app/navigation/types'
import {
  SettingsRow,
  SettingsSection,
  SettingsSectionItem,
  SettingsSectionItemComponent,
} from 'src/components/Settings/SettingsRow'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import { openModal } from 'src/features/modals/modalSlice'
import { useWalletConnect } from 'src/features/walletConnect/useWalletConnect'
import { DeprecatedButton, Flex, Text, useSporeColors } from 'ui/src'
import GlobalIcon from 'ui/src/assets/icons/global.svg'
import TextEditIcon from 'ui/src/assets/icons/textEdit.svg'
import { iconSizes, spacing } from 'ui/src/theme'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useENS } from 'uniswap/src/features/ens/useENS'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useUnitagByAddress } from 'uniswap/src/features/unitags/hooks'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { MobileScreens, UnitagScreens } from 'uniswap/src/types/screens/mobile'
import { AddressDisplay } from 'wallet/src/components/accounts/AddressDisplay'
import { useAccounts } from 'wallet/src/features/wallet/hooks'

type Props = NativeStackScreenProps<SettingsStackParamList, MobileScreens.SettingsWallet>

// Specific design request not in standard sizing type
const UNICON_ICON_SIZE = 56

export function SettingsWallet({
  route: {
    params: { address },
  },
}: Props): JSX.Element {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const colors = useSporeColors()
  const addressToAccount = useAccounts()
  const { defaultChainId } = useEnabledChains()
  const currentAccount = addressToAccount[address]
  const ensName = useENS({ nameOrAddress: address, chainId: defaultChainId })?.name
  const { unitag } = useUnitagByAddress(address)
  const readonly = currentAccount?.type === AccountType.Readonly
  const navigation = useNavigation<SettingsStackNavigationProp & OnboardingStackNavigationProp>()
  const { sessions } = useWalletConnect(address)

  const showEditProfile = !readonly

  useEffect(() => {
    // If the user deletes the account while on this screen, go back
    if (!currentAccount) {
      navigation.goBack()
    }
  }, [currentAccount, navigation])

  const iconProps: SvgProps = {
    color: colors.neutral2.get(),
    height: iconSizes.icon24,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: '2',
    width: iconSizes.icon24,
  }

  const editNicknameSectionOption: SettingsSectionItem = {
    screen: MobileScreens.SettingsWalletEdit,
    text: t('settings.setting.wallet.label'),
    icon: <TextEditIcon fill={colors.neutral2.get()} {...iconProps} />,
    screenProps: { address },
    isHidden: !!ensName || !!unitag?.username,
  }

  const sections: SettingsSection[] = [
    {
      data: [
        ...(showEditProfile ? [] : [editNicknameSectionOption]),
        {
          screen: MobileScreens.SettingsWalletManageConnection,
          text: t('settings.setting.wallet.connections.title'),
          count: sessions.length,
          icon: <GlobalIcon {...iconProps} />,
          screenProps: { address },
          isHidden: readonly,
        },
      ],
    },
  ]

  const renderItem = ({
    item,
  }: ListRenderItemInfo<SettingsSectionItem | SettingsSectionItemComponent>): JSX.Element | null => {
    if ('component' in item) {
      return item.component
    }
    if (item.isHidden) {
      return null
    }
    return <SettingsRow key={item.screen} navigation={navigation} page={item} />
  }

  const onRemoveWallet = (): void => {
    dispatch(
      openModal({
        name: ModalName.RemoveWallet,
        initialState: { address },
      }),
    )
  }

  return (
    <Screen>
      <BackHeader alignment="center" mx="$spacing16" pt="$spacing16">
        <Flex shrink>
          <AddressDisplay hideAddressInSubtitle address={address} showAccountIcon={false} variant="body1" />
        </Flex>
      </BackHeader>

      <Flex fill p="$spacing24" pb="$spacing12">
        <Flex fill>
          <SectionList
            ItemSeparatorComponent={renderItemSeparator}
            ListHeaderComponent={showEditProfile ? <AddressDisplayHeader address={address} /> : undefined}
            keyExtractor={(_item, index): string => 'wallet_settings' + index}
            renderItem={renderItem}
            renderSectionFooter={(): JSX.Element => <Flex pt="$spacing24" />}
            renderSectionHeader={({ section: { subTitle } }): JSX.Element =>
              subTitle ? (
                <Flex backgroundColor="$surface1" pb="$spacing12">
                  <Text color="$neutral2" variant="body1">
                    {subTitle}
                  </Text>
                </Flex>
              ) : (
                <></>
              )
            }
            sections={sections.filter((p) => !p.isHidden)}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
          />
        </Flex>
        <DeprecatedButton testID={TestID.Remove} theme="detrimental" onPress={onRemoveWallet}>
          {t('settings.setting.wallet.action.remove')}
        </DeprecatedButton>
      </Flex>
    </Screen>
  )
}

const renderItemSeparator = (): JSX.Element => <Flex pt="$spacing8" />

function AddressDisplayHeader({ address }: { address: Address }): JSX.Element {
  const { t } = useTranslation()
  const { defaultChainId } = useEnabledChains()
  const ensName = useENS({ nameOrAddress: address, chainId: defaultChainId })?.name
  const { unitag } = useUnitagByAddress(address)

  const onPressEditProfile = (): void => {
    if (unitag?.username) {
      navigate(MobileScreens.UnitagStack, {
        screen: UnitagScreens.EditProfile,
        params: {
          address,
          unitag: unitag.username,
          entryPoint: MobileScreens.SettingsWallet,
        },
      })
    } else {
      navigate(MobileScreens.SettingsWalletEdit, {
        address,
      })
    }
  }

  return (
    <Flex gap="$spacing12" justifyContent="flex-start" pb="$spacing24">
      <Flex shrink>
        <AddressDisplay
          address={address}
          captionVariant="subheading2"
          gapBetweenLines={spacing.spacing4}
          showIconBackground={true}
          size={UNICON_ICON_SIZE}
          variant="body1"
        />
      </Flex>
      {(!ensName || !!unitag) && (
        <DeprecatedButton color="$neutral1" size="medium" theme="secondary_Button" onPress={onPressEditProfile}>
          {unitag?.username
            ? t('settings.setting.wallet.action.editProfile')
            : t('settings.setting.wallet.action.editLabel')}
        </DeprecatedButton>
      )}
    </Flex>
  )
}
