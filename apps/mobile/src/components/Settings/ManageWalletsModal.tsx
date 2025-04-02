import { useNavigation } from '@react-navigation/core'
import { default as React, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo, SectionList } from 'react-native'
import { SvgProps } from 'react-native-svg'
import { useDispatch, useSelector } from 'react-redux'
import { OnboardingStackNavigationProp, SettingsStackNavigationProp } from 'src/app/navigation/types'
import { RemoveWalletContent } from 'src/components/RemoveWallet/RemoveWalletContent'
import {
  SettingsRow,
  SettingsSection,
  SettingsSectionItem,
  SettingsSectionItemComponent,
} from 'src/components/Settings/SettingsRow'
import { UnitagBanner } from 'src/components/unitags/UnitagBanner'
import { closeModal, openModal } from 'src/features/modals/modalSlice'
import { selectModalState } from 'src/features/modals/selectModalState'
import { useWalletConnect } from 'src/features/walletConnect/useWalletConnect'
import { Button, Flex, useSporeColors } from 'ui/src'
import GlobalIcon from 'ui/src/assets/icons/global.svg'
import { Edit } from 'ui/src/components/icons'
import { Person } from 'ui/src/components/icons/Person'
import { iconSizes, spacing } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useENS } from 'uniswap/src/features/ens/useENS'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useUnitagByAddress } from 'uniswap/src/features/unitags/hooks'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { AddressDisplay } from 'wallet/src/components/accounts/AddressDisplay'
import { useCanAddressClaimUnitag } from 'wallet/src/features/unitags/hooks/useCanAddressClaimUnitag'
import { useAccounts } from 'wallet/src/features/wallet/hooks'

export function ManageWalletsModal(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const colors = useSporeColors()
  const addressToAccount = useAccounts()
  const navigation = useNavigation<SettingsStackNavigationProp & OnboardingStackNavigationProp>()

  const [isRemoveWalletOpen, setRemoveWalletState] = useState(false)

  const { initialState } = useSelector(selectModalState(ModalName.ManageWalletsModal))
  const address = initialState?.address ?? ''

  const currentAccount = addressToAccount[address]
  const { sessions } = useWalletConnect(address)

  const { defaultChainId } = useEnabledChains()
  const { unitag } = useUnitagByAddress(address)
  const ensName = useENS({ nameOrAddress: address, chainId: defaultChainId })?.name
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
            dispatch(closeModal({ name: ModalName.ManageWalletsModal }))
            return item.checkIfCanProceed ? item.checkIfCanProceed() : true
          }}
        />
      )
    },
    [navigation, dispatch],
  )

  const renderItemSeparator = (): JSX.Element => <Flex pt="$spacing8" />

  const sections: SettingsSection[] = useMemo((): SettingsSection[] => {
    const iconProps: SvgProps = {
      color: colors.neutral2.get(),
      height: iconSizes.icon24,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeWidth: '2',
      width: iconSizes.icon24,
    }

    const editNicknameSectionOption: SettingsSectionItem = {
      modal: ModalName.EditLabelSettingsModal,
      text: t('settings.setting.wallet.action.editLabel'),
      icon: <Edit color="$neutral2" size="$icon.24" />,
      screenProps: { address },
      isHidden: !!ensName || !!unitag?.username,
      checkIfCanProceed: (): boolean => {
        dispatch(openModal({ name: ModalName.EditLabelSettingsModal, initialState: { address } }))
        return false
      },
    }

    const editLabelSectionOption: SettingsSectionItem = {
      modal: ModalName.EditProfileSettingsModal,
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
        dispatch(openModal({ name: ModalName.EditProfileSettingsModal, initialState: { address } }))
        return false
      },
    }

    return [
      {
        data: [
          ...(currentAccount?.type === AccountType.SignerMnemonic && !onlyLabeledWallet
            ? []
            : [editNicknameSectionOption]),
          ...(ensName === undefined || unitag?.username !== undefined ? [editLabelSectionOption] : []),
          {
            screen: MobileScreens.ConnectionsDappListModal,
            text: t('settings.setting.wallet.connections.title'),
            count: sessions.length,
            icon: <GlobalIcon {...iconProps} />,
            isHidden: currentAccount?.type === AccountType.Readonly,
            checkIfCanProceed: (): boolean => {
              dispatch(openModal({ name: ModalName.ConnectionsDappListModal, initialState: { address } }))
              return false
            },
          },
        ],
      },
    ]
  }, [onlyLabeledWallet, ensName, unitag, dispatch, address, sessions, colors, currentAccount?.type, t])

  const onClose = useCallback((): void => {
    dispatch(closeModal({ name: ModalName.ManageWalletsModal }))
  }, [dispatch])

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

            {showUnitagBanner && currentAccount?.type === AccountType.SignerMnemonic && (
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
              <Button variant="critical" emphasis="secondary" onPress={onRemoveWallet}>
                {t('settings.setting.wallet.action.remove')}
              </Button>
            </Flex>
          </Flex>
        )}
      </Flex>
    </Modal>
  )
}
