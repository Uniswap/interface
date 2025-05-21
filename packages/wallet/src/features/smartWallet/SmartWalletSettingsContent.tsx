import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ElementAfterText, Flex, Text, TouchableArea } from 'ui/src'
import { CloudSlash, QuestionInCircleFilled, Unitag } from 'ui/src/components/icons'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { iconSizes } from 'ui/src/theme'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { useAvatar } from 'uniswap/src/features/address/avatar'
import { useUnitagByAddress } from 'uniswap/src/features/unitags/hooks'
import { shortenAddress } from 'utilities/src/addresses'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { SmartWalletEducationalModal } from 'wallet/src/components/smartWallet/modals/SmartWalletEducationalModal'
import { SmartWalletEnabledModal } from 'wallet/src/components/smartWallet/modals/SmartWalletEnabledModal'
import { SmartWalletUnavailableModal } from 'wallet/src/components/smartWallet/modals/SmartWalletUnavailableModal'
import { SmartWalletDisableModal } from 'wallet/src/features/smartWallet/SmartWalletDisableModal'
import { useTranslateSmartWalletStatus } from 'wallet/src/features/smartWallet/hooks/useTranslateSmartWalletStatus'
import { WalletData, WalletStatus } from 'wallet/src/features/smartWallet/types'

// TODO(WALL-6562): Replace with actual data from the state/API
const mockWallets: WalletData[] = [
  {
    name: 'zack',
    walletAddress: '0x1db6aD3344F1Ae0A495b28B031B80cDDd99f2FD0',
    delegatorAddress: '0xB2cb3e92969828C2207367D9f4331a701B9464e6',
    status: WalletStatus.Active,
  },
  {
    name: 'fullylucid.eth',
    walletAddress: '0xE42f1873e7111d6D91C79B5ae946902A5C47f08D',
    delegatorAddress: '0xB2cb3e92969828C2207367D9f4331a701B9464e6',
    status: WalletStatus.Active,
  },
  {
    name: 'Wallet 2',
    walletAddress: '0x5258E00Ece6E2c99575cfE7067e8674a90c5E5BF',
    delegatorAddress: '0xB2cb3e92969828C2207367D9f4331a701B9464e6',
    status: WalletStatus.Inactive,
  },
  {
    name: 'Wallet 3',
    walletAddress: '0xb3b62D6b12Ac281Fd93746981EFE4BF42F12Eb10',
    delegatorAddress: '0xB2cb3e92969828C2207367D9f4331a701B9464e6',
    status: WalletStatus.Inactive,
  },
  {
    name: 'wowwow.eth',
    walletAddress: '0xa7D4be42bE3300523C2E6f297DD0b0dDfac39EA8',
    delegatorAddress: '0xB2cb3e92969828C2207367D9f4331a701B9464e6',
    status: WalletStatus.Unavailable,
  },
]

function WalletItem({
  wallet,
  setSelected,
  handleEnableSmartWallet,
  handleUnavailableWalletPress,
}: {
  wallet: WalletData
  setSelected: (wallet: WalletData) => void
  handleEnableSmartWallet: (wallet: WalletData) => void
  handleUnavailableWalletPress: () => void
}): JSX.Element {
  const { t } = useTranslation()

  const isInactive = wallet.status === WalletStatus.Inactive
  const isUnavailable = wallet.status === WalletStatus.Unavailable
  const isActive = wallet.status === WalletStatus.Active

  const actionIcon = useMemo(() => {
    if (isInactive) {
      // need to use touchable area so it fits to the text on mobile
      return (
        <TouchableArea
          justifyContent="center"
          borderRadius="$rounded12"
          backgroundColor="$accent2"
          height="$spacing36"
          px="$padding12"
          onPress={() => handleEnableSmartWallet(wallet)}
        >
          <Text color="$accent1" variant="buttonLabel4">
            {t('settings.setting.smartWallet.action.enable')}
          </Text>
        </TouchableArea>
      )
    }
    if (isUnavailable) {
      return <CloudSlash size="$icon.20" color="$neutral3" />
    }
    return <RotatableChevron color="$neutral3" direction="right" height={iconSizes.icon20} width={iconSizes.icon20} />
  }, [isInactive, isUnavailable, handleEnableSmartWallet, wallet, t])

  const { avatar } = useAvatar(wallet.walletAddress)
  const { unitag } = useUnitagByAddress(wallet?.walletAddress)

  const onPress = useCallback((): void => {
    if (isActive) {
      setSelected(wallet)
    } else if (isUnavailable) {
      handleUnavailableWalletPress()
    }
  }, [isActive, isUnavailable, setSelected, wallet, handleUnavailableWalletPress])

  return (
    <TouchableArea
      key={wallet.walletAddress}
      alignItems="center"
      borderRadius="$rounded16"
      flexDirection="row"
      gap="$spacing12"
      justifyContent="space-between"
      mb="$spacing12"
      opacity={isUnavailable ? 0.5 : 1}
      // we need to listen to the onPress event to trigger the unavailable modal
      disabled={!isActive && !isUnavailable}
      cursor={!isActive ? 'default' : 'pointer'}
      onPress={onPress}
    >
      <Flex row alignItems="center" gap="$spacing12">
        <Flex
          backgroundColor="$surface1"
          borderRadius="$roundedFull"
          height={32}
          width={32}
          overflow="hidden"
          alignItems="center"
          justifyContent="center"
        >
          <AccountIcon avatarUri={avatar} address={wallet.walletAddress} size={32} />
        </Flex>
        <Flex>
          <ElementAfterText
            wrapperProps={{
              grow: true,
              shrink: true,
              gap: '$gap4',
            }}
            textProps={{
              variant: 'subheading2',
              color: '$neutral1',
            }}
            element={unitag?.username ? <Unitag size="$icon.16" /> : undefined}
            text={wallet.name}
          />

          <Text variant="body3" color="$neutral2">
            {shortenAddress(wallet.walletAddress)}
          </Text>
        </Flex>
      </Flex>
      <Flex row alignItems="center" gap="$spacing12">
        {actionIcon}
      </Flex>
    </TouchableArea>
  )
}

export function SmartWalletSettingsContent(): JSX.Element {
  const getTranslatedStatus = useTranslateSmartWalletStatus()

  const [selectedWallet, setSelectedWallet] = useState<WalletData | undefined>(undefined)

  const {
    value: showSmartWalletEnabledModal,
    setTrue: setShowSmartWalletEnabledModal,
    setFalse: setHideSmartWalletEnabledModal,
  } = useBooleanState(false)

  const {
    value: showSmartWalletUnavailableModal,
    setTrue: setShowSmartWalletUnavailableModal,
    setFalse: setHideSmartWalletUnavailableModal,
  } = useBooleanState(false)

  const handleDisableConfirm = useCallback(() => {
    // TODO: Implement actual disable logic
    setSelectedWallet(undefined)
  }, [])

  const handleEnableSmartWallet = useCallback(
    (_: WalletData): void => {
      // TODO(WALL-6561): Implement actual enable logic
      setShowSmartWalletEnabledModal()
    },
    [setShowSmartWalletEnabledModal],
  )

  const renderWalletSection = useCallback(
    (status: WalletStatus): JSX.Element | undefined => {
      const wallets = mockWallets.filter((w) => w.status === status)
      if (!wallets.length) {
        return undefined
      }

      return (
        <Flex gap="$spacing12">
          <Text color="$neutral1" variant="subheading2">
            {getTranslatedStatus(status)}
          </Text>
          {wallets.map((wallet) => (
            <WalletItem
              key={wallet.walletAddress}
              handleEnableSmartWallet={handleEnableSmartWallet}
              handleUnavailableWalletPress={setShowSmartWalletUnavailableModal}
              setSelected={setSelectedWallet}
              wallet={wallet}
            />
          ))}
        </Flex>
      )
    },
    [getTranslatedStatus, handleEnableSmartWallet, setSelectedWallet, setShowSmartWalletUnavailableModal],
  )

  return (
    <>
      <Flex px="$padding8" gap="$gap20">
        {renderWalletSection(WalletStatus.Active)}
        {renderWalletSection(WalletStatus.Inactive)}
        {renderWalletSection(WalletStatus.Unavailable)}
      </Flex>

      <SmartWalletDisableModal
        selectedWallet={selectedWallet}
        onClose={() => setSelectedWallet(undefined)}
        onConfirm={handleDisableConfirm}
      />
      <SmartWalletEnabledModal isOpen={showSmartWalletEnabledModal} onClose={setHideSmartWalletEnabledModal} />
      <SmartWalletUnavailableModal
        isOpen={showSmartWalletUnavailableModal}
        onClose={setHideSmartWalletUnavailableModal}
      />
    </>
  )
}

export function SmartWalletHelpIcon(): JSX.Element {
  const {
    value: isSmartWalletEducationModalOpen,
    setTrue: showSmartWalletEducationModal,
    setFalse: hideSmartWalletEducationModal,
  } = useBooleanState(false)

  return (
    <>
      <TouchableArea alignItems="center" alignSelf="center" py="$spacing12" onPress={showSmartWalletEducationModal}>
        <QuestionInCircleFilled color="$neutral2" size="$icon.20" />
      </TouchableArea>
      <SmartWalletEducationalModal isOpen={isSmartWalletEducationModalOpen} onClose={hideSmartWalletEducationModal} />
    </>
  )
}
