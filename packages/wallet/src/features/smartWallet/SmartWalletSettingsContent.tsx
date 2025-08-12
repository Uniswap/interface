import { useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Flex, ScrollView, Text, TouchableArea } from 'ui/src'
import { CloudSlash, QuestionInCircleFilled, RoundExclamation } from 'ui/src/components/icons'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { fonts, iconSizes, zIndexes } from 'ui/src/theme'
import { DisplayNameText } from 'uniswap/src/components/accounts/DisplayNameText'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { useAvatar } from 'uniswap/src/features/address/avatar'
import { shortenAddress } from 'utilities/src/addresses'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { SmartWalletEducationalModal } from 'wallet/src/components/smartWallet/modals/SmartWalletEducationalModal'
import { setIsAllSmartWalletNudgesDisabled } from 'wallet/src/features/behaviorHistory/slice'
import {
  SmartWalletModalsManager,
  useSmartWalletModals,
} from 'wallet/src/features/smartWallet/SmartWalletModalsManager'
import { useWalletDelegationContext } from 'wallet/src/features/smartWallet/WalletDelegationProvider'
import { useSmartWalletData } from 'wallet/src/features/smartWallet/hooks/useSmartWalletData'
import { useTranslateSmartWalletStatus } from 'wallet/src/features/smartWallet/hooks/useTranslateSmartWalletStatus'
import { SmartWalletModalState, WalletData, WalletStatus } from 'wallet/src/features/smartWallet/types'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'
import { setSmartWalletConsent } from 'wallet/src/features/wallet/slice'

function WalletItem({ wallet, onPress }: { wallet: WalletData; onPress: (wallet: WalletData) => void }): JSX.Element {
  const { t } = useTranslation()

  const isInactive = wallet.status === WalletStatus.Inactive
  const isUnavailable = wallet.status === WalletStatus.Unavailable

  const onPressCallback = useCallback((): void => {
    onPress(wallet)
  }, [onPress, wallet])

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
          onPress={onPressCallback}
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
  }, [isInactive, isUnavailable, onPressCallback, t])

  const { avatar } = useAvatar(wallet.walletAddress)
  const displayName = useDisplayName(wallet.walletAddress)

  return (
    <TouchableArea
      key={wallet.walletAddress}
      alignItems="center"
      borderRadius="$rounded16"
      flexDirection="row"
      gap="$spacing12"
      justifyContent="space-between"
      mb="$spacing12"
      cursor={isInactive ? 'default' : 'pointer'}
      onPress={!isInactive ? onPressCallback : undefined}
    >
      <Flex
        row
        shrink
        minWidth={0}
        alignItems="center"
        gap="$spacing12"
        opacity={isUnavailable || isInactive ? 0.5 : 1}
      >
        <Flex>
          {wallet.status === WalletStatus.ActionRequired && (
            <Flex bottom={-2} position="absolute" right={-3} zIndex={zIndexes.mask}>
              <Flex
                centered
                backgroundColor="$surface1"
                borderRadius="$roundedFull"
                width={iconSizes.icon16}
                height={iconSizes.icon16}
              >
                <RoundExclamation size={iconSizes.icon16} />
              </Flex>
            </Flex>
          )}
          <Flex
            centered
            backgroundColor="$surface1"
            borderRadius="$roundedFull"
            height={iconSizes.icon32}
            width={iconSizes.icon32}
            overflow="hidden"
          >
            <AccountIcon avatarUri={avatar} address={wallet.walletAddress} size={iconSizes.icon32} />
          </Flex>
        </Flex>
        <Flex shrink minWidth={0}>
          <DisplayNameText
            displayName={displayName}
            textProps={{
              // update unitag icon size if font size changes
              variant: 'subheading2',
              color: '$neutral1',
            }}
            includeUnitagSuffix={false}
            unitagIconSize={fonts.subheading2.fontSize}
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
  const dispatch = useDispatch()
  const getTranslatedStatus = useTranslateSmartWalletStatus()
  const wallets = useSmartWalletData()
  const { refreshDelegationData } = useWalletDelegationContext()

  const { selectedWallet, modalState, setSelectedWallet, setModalState } = useSmartWalletModals()

  // Refresh delegation data when component mounts
  useEffect(() => {
    refreshDelegationData().catch((error) => {
      logger.error(error, {
        tags: { file: 'SmartWalletSettingsContent', function: 'useEffect' },
      })
    })
  }, [refreshDelegationData])

  const handleOnWalletPress = useEvent((wallet: WalletData) => {
    setSelectedWallet(wallet)

    const statusActionMap = {
      [WalletStatus.Active]: () => setModalState(SmartWalletModalState.Disable),
      [WalletStatus.ActionRequired]: () => setModalState(SmartWalletModalState.ActionRequired),
      [WalletStatus.Unavailable]: () => setModalState(SmartWalletModalState.Unavailable),
      [WalletStatus.Inactive]: (): void => {
        dispatch(
          setSmartWalletConsent({
            address: wallet.walletAddress,
            smartWalletConsent: true,
          }),
        )
        setModalState(SmartWalletModalState.EnabledSuccess)
        dispatch(setIsAllSmartWalletNudgesDisabled({ walletAddress: wallet.walletAddress, isDisabled: false }))
      },
    }

    statusActionMap[wallet.status]()
  })

  const renderWalletSection = useCallback(
    (status: WalletStatus): JSX.Element | undefined => {
      const walletsForStatus = wallets.filter((w) => w.status === status)
      if (!walletsForStatus.length) {
        return undefined
      }

      return (
        <Flex gap="$spacing12">
          <Text color="$neutral1" variant="subheading2">
            {getTranslatedStatus(status)}
          </Text>
          {walletsForStatus.map((wallet) => (
            <WalletItem key={wallet.walletAddress} wallet={wallet} onPress={handleOnWalletPress} />
          ))}
        </Flex>
      )
    },
    [wallets, getTranslatedStatus, handleOnWalletPress],
  )

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Flex gap="$gap20" px="$padding8">
          {renderWalletSection(WalletStatus.ActionRequired)}
          {renderWalletSection(WalletStatus.Active)}
          {renderWalletSection(WalletStatus.Inactive)}
          {renderWalletSection(WalletStatus.Unavailable)}
        </Flex>
      </ScrollView>

      <SmartWalletModalsManager
        selectedWallet={selectedWallet}
        modalState={modalState}
        onModalStateChange={setModalState}
        onWalletChange={setSelectedWallet}
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
