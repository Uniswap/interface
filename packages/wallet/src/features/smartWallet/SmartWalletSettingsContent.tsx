import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Flex, ScrollView, Text, TouchableArea } from 'ui/src'
import { CloudSlash, QuestionInCircleFilled, RoundExclamation } from 'ui/src/components/icons'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { iconSizes, zIndexes } from 'ui/src/theme'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useAvatar } from 'uniswap/src/features/address/avatar'
import { shortenAddress } from 'utilities/src/addresses'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { DisplayNameText } from 'wallet/src/components/accounts/DisplayNameText'
import { SmartWalletEducationalModal } from 'wallet/src/components/smartWallet/modals/SmartWalletEducationalModal'
import { SmartWalletEnabledModal } from 'wallet/src/components/smartWallet/modals/SmartWalletEnabledModal'
import { SmartWalletUnavailableModal } from 'wallet/src/components/smartWallet/modals/SmartWalletUnavailableModal'
import { setHasDismissedSmartWalletHomeScreenNudge } from 'wallet/src/features/behaviorHistory/slice'
import { SmartWalletDisableModal } from 'wallet/src/features/smartWallet/SmartWalletDisableModal'
import { useWalletDelegationContext } from 'wallet/src/features/smartWallet/WalletDelegationProvider'
import { useNetworkBalances } from 'wallet/src/features/smartWallet/hooks/useNetworkBalances'
import { useSmartWalletData } from 'wallet/src/features/smartWallet/hooks/useSmartWalletData'
import { useTranslateSmartWalletStatus } from 'wallet/src/features/smartWallet/hooks/useTranslateSmartWalletStatus'
import { SmartWalletActionRequiredModal } from 'wallet/src/features/smartWallet/modals/SmartWalletActionRequiredModal'
import { SmartWalletConfirmDisableModal } from 'wallet/src/features/smartWallet/modals/SmartWalletConfirmDisableModal'
import { WalletData, WalletStatus } from 'wallet/src/features/smartWallet/types'
import { useActiveAccountWithThrow, useDisplayName } from 'wallet/src/features/wallet/hooks'
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
      <Flex row alignItems="center" gap="$spacing12" opacity={isUnavailable || isInactive ? 0.5 : 1}>
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
        <Flex>
          <DisplayNameText
            displayName={displayName}
            textProps={{
              variant: 'subheading2',
              color: '$neutral1',
            }}
            includeUnitagSuffix={false}
            unitagIconSize="$icon.20"
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
  const activeAccount = useActiveAccountWithThrow()
  const { refreshDelegationData } = useWalletDelegationContext()

  const [selectedWallet, setSelectedWallet] = useState<WalletData | undefined>(undefined)

  const {
    value: showDisableSmartWalletModal,
    setTrue: setShowDisableSmartWalletModal,
    setFalse: setHideDisableSmartWalletModal,
  } = useBooleanState(false)
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

  const {
    value: showConfirmDisableSmartWalletModal,
    setTrue: setShowConfirmDisableSmartWalletModal,
    setFalse: setHideConfirmDisableSmartWalletModal,
  } = useBooleanState(false)

  const {
    value: showActionRequiredModal,
    setTrue: setShowActionRequiredModal,
    setFalse: setHideActionRequiredModal,
  } = useBooleanState(false)

  const networkBalances = useNetworkBalances(selectedWallet?.walletAddress)
  const selectedWalletDisplayName = useDisplayName(selectedWallet?.walletAddress, { includeUnitagSuffix: true })

  // Refresh delegation data when component mounts
  useEffect(() => {
    refreshDelegationData().catch((error) => {
      logger.error(error, {
        tags: { file: 'SmartWalletSettingsContent', function: 'useEffect' },
      })
    })
  }, [refreshDelegationData])

  const handleDisableConfirm = useCallback(async () => {
    if (!selectedWallet?.walletAddress || activeAccount.type !== AccountType.SignerMnemonic) {
      return
    }

    const activeDelegations = selectedWallet.activeDelegationNetworkToAddress
    if (Object.keys(activeDelegations).length === 0) {
      // No active delegations
      dispatch(
        setSmartWalletConsent({
          address: selectedWallet.walletAddress,
          smartWalletConsent: false,
        }),
      )
      // Prevent the nudge from showing again
      dispatch(
        setHasDismissedSmartWalletHomeScreenNudge({ walletAddress: selectedWallet.walletAddress, hasDismissed: true }),
      )
      setHideDisableSmartWalletModal()
      setSelectedWallet(undefined)
      return
    }

    setShowConfirmDisableSmartWalletModal()
  }, [dispatch, selectedWallet, activeAccount, setShowConfirmDisableSmartWalletModal, setHideDisableSmartWalletModal])

  const handleReactivateSmartWallet = useCallback(() => {
    if (selectedWallet) {
      dispatch(
        setSmartWalletConsent({
          address: selectedWallet.walletAddress,
          smartWalletConsent: true,
        }),
      )
    }
  }, [dispatch, selectedWallet])

  const handleOnWalletPress = useEvent((wallet: WalletData) => {
    setSelectedWallet(wallet)
    if (wallet.status === WalletStatus.Active) {
      setShowDisableSmartWalletModal()
    } else if (wallet.status === WalletStatus.ActionRequired) {
      setShowActionRequiredModal()
    } else if (wallet.status === WalletStatus.Unavailable) {
      setShowSmartWalletUnavailableModal()
    } else {
      dispatch(
        setSmartWalletConsent({
          address: wallet.walletAddress,
          smartWalletConsent: true,
        }),
      )
      setShowSmartWalletEnabledModal()
    }
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

  const unavailableWalletDisplayName = selectedWalletDisplayName?.name || selectedWallet?.walletAddress

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

      <SmartWalletEnabledModal isOpen={showSmartWalletEnabledModal} onClose={setHideSmartWalletEnabledModal} />
      {unavailableWalletDisplayName && (
        <SmartWalletUnavailableModal
          isOpen={showSmartWalletUnavailableModal}
          displayName={unavailableWalletDisplayName}
          onClose={setHideSmartWalletUnavailableModal}
        />
      )}
      {selectedWallet && (
        <>
          <SmartWalletDisableModal
            wallet={selectedWallet}
            isOpen={showDisableSmartWalletModal}
            onClose={() => {
              setHideDisableSmartWalletModal()
              setSelectedWallet(undefined)
            }}
            onConfirm={handleDisableConfirm}
          />
          <SmartWalletConfirmDisableModal
            isOpen={showConfirmDisableSmartWalletModal}
            networkBalances={networkBalances}
            walletAddress={selectedWallet.walletAddress}
            onClose={() => {
              setHideConfirmDisableSmartWalletModal()
              setHideDisableSmartWalletModal()
              setSelectedWallet(undefined)
            }}
          />
          <SmartWalletActionRequiredModal
            isOpen={showActionRequiredModal}
            networkBalances={networkBalances}
            onClose={setHideActionRequiredModal}
            onConfirm={() => {
              setHideActionRequiredModal()
              setShowConfirmDisableSmartWalletModal()
            }}
            onReactivate={() => {
              setHideActionRequiredModal()
              handleReactivateSmartWallet()
            }}
          />
        </>
      )}
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
