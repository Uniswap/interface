import { useNavigation } from '@react-navigation/core'
import { default as React, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo, SectionList } from 'react-native'
import { navigate } from 'src/app/navigation/rootNavigation'
import {
  AppStackScreenProp,
  OnboardingStackNavigationProp,
  SettingsStackNavigationProp,
} from 'src/app/navigation/types'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import { RemoveWalletContent } from 'src/components/RemoveWallet/RemoveWalletContent'
import {
  SettingsRow,
  SettingsSection,
  SettingsSectionItem,
  SettingsSectionItemComponent,
} from 'src/components/Settings/SettingsRow'
import { UnitagBanner } from 'src/components/unitags/UnitagBanner'
import { useWalletConnect } from 'src/features/walletConnect/useWalletConnect'
import { Button, Flex, IconProps, useSporeColors } from 'ui/src'
import { Edit, Global } from 'ui/src/components/icons'
import { Person } from 'ui/src/components/icons/Person'
import { iconSizes, spacing } from 'ui/src/theme'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useENS } from 'uniswap/src/features/ens/useENS'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { useCanAddressClaimUnitag } from 'wallet/src/features/unitags/hooks/useCanAddressClaimUnitag'
import { useAccounts } from 'wallet/src/features/wallet/hooks'

export function ManageWalletsModal({ route }: AppStackScreenProp<typeof ModalName.ManageWalletsModal>): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const addressToAccount = useAccounts()
  const { onClose } = useReactNavigationModal()
  const navigation = useNavigation<SettingsStackNavigationProp & OnboardingStackNavigationProp>()

  const [isRemoveWalletOpen, setRemoveWalletState] = useState(false)

  const { address } = route.params

  const currentAccount = addressToAccount[address]
  const { sessions } = useWalletConnect(address)

  const { defaultChainId } = useEnabledChains()
  const { data: unitag } = useUnitagsAddressQuery({
    params: address ? { address } : undefined,
  })
  const ensName = useENS({ nameOrAddress: address, chainId: defaultChainId }).name
  const onlyLabeledWallet = ensName === null && unitag?.username === undefined

  const { canClaimUnitag } = useCanAddressClaimUnitag(address)
  const showUnitagBanner = currentAccount?.type === AccountType.SignerMnemonic && canClaimUnitag

  const onRemoveWallet = (): void => {
    setRemoveWalletState(true)
  }

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<SettingsSectionItem | SettingsSectionItemComponent>): JSX.Element | null => {
      if (item.isHidden) {
        return null
      }
      if ('component' in item) {
        return item.component
      }
      return (
        <SettingsRow
          key={item.screen}
          navigation={navigation}
          page={item}
          checkIfCanProceed={() => {
            onClose()
            return item.checkIfCanProceed ? item.checkIfCanProceed() : true
          }}
        />
      )
    },
    [navigation, onClose],
  )

  const renderItemSeparator = (): JSX.Element => <Flex pt="$spacing8" />

  const sections: SettingsSection[] = useMemo((): SettingsSection[] => {
    const iconProps: IconProps = {
      color: colors.neutral2.get(),
      size: iconSizes.icon24,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeWidth: 2,
    }

    const editNicknameSectionOption: SettingsSectionItem = {
      navigationModal: ModalName.EditLabelSettingsModal,
      text: t('settings.setting.wallet.action.editLabel'),
      icon: <Edit color="$neutral2" size="$icon.24" />,
      screenProps: { address },
      isHidden: !!ensName || !!unitag?.username,
      checkIfCanProceed: (): boolean => {
        navigate(ModalName.EditLabelSettingsModal, {
          address,
          accessPoint: MobileScreens.SettingsWallet,
        })
        return false
      },
    }

    const editLabelSectionOption: SettingsSectionItem = {
      navigationModal: ModalName.EditProfileSettingsModal,
      text: unitag?.username
        ? t('settings.setting.wallet.action.editProfile')
        : t('settings.setting.wallet.action.editLabel'),
      icon: unitag?.username ? (
        <Person color="$neutral2" size="$icon.24" />
      ) : (
        <Edit color="$neutral2" size="$icon.24" />
      ),
      screenProps: { address },
      isHidden: currentAccount?.type === AccountType.Readonly,
      checkIfCanProceed: (): boolean => {
        navigate(ModalName.EditProfileSettingsModal, {
          address,
          accessPoint: MobileScreens.SettingsWallet,
        })
        return false
      },
    }

    return [
      {
        data: [
          ...(currentAccount?.type === AccountType.SignerMnemonic && !onlyLabeledWallet
            ? []
            : [editNicknameSectionOption]),
          ...(unitag?.username !== undefined ? [editLabelSectionOption] : []),
          {
            navigationModal: ModalName.ConnectionsDappListModal,
            text: t('settings.setting.wallet.connections.title'),
            count: sessions.length,
            icon: <Global {...iconProps} />,
            isHidden: currentAccount?.type === AccountType.Readonly,
            checkIfCanProceed: (): boolean => {
              navigate(ModalName.ConnectionsDappListModal, {
                address,
              })
              return false
            },
          },
        ],
      },
    ]
  }, [onlyLabeledWallet, ensName, unitag, address, sessions, colors, currentAccount?.type, t])

  return (
    <Modal backgroundColor={colors.surface1.val} name={ModalName.ManageWalletsModal} onClose={onClose}>
      <Flex backgroundColor={colors.surface1.val}>
        {isRemoveWalletOpen ? (
          <RemoveWalletContent address={address} onClose={onClose} />
        ) : (
          <Flex gap="$spacing12" px="$spacing24" pb="$spacing24" pt="$spacing20">
            <Flex>
              <AddressDisplay
                showCopy
                centered
                address={address}
                direction="column"
                showViewOnlyBadge={currentAccount?.type === AccountType.Readonly}
                size={spacing.spacing60 - spacing.spacing4}
                variant="subheading1"
              />
            </Flex>

            {showUnitagBanner && (
              <UnitagBanner compact address={address} entryPoint={MobileScreens.Settings} onPressClaim={onClose} />
            )}

            <Flex>
              <SectionList
                ItemSeparatorComponent={renderItemSeparator}
                keyExtractor={(_item, index): string => 'wallet_settings' + index}
                renderItem={renderItem}
                sections={sections.filter((p) => !p.isHidden)}
                showsVerticalScrollIndicator={false}
                stickySectionHeadersEnabled={false}
              />
            </Flex>
            <Flex row pb="$padding20" pt="$padding12">
              <Button lineHeightDisabled variant="critical" emphasis="secondary" onPress={onRemoveWallet}>
                {t('settings.setting.wallet.action.remove')}
              </Button>
            </Flex>
          </Flex>
        )}
      </Flex>
    </Modal>
  )
}
