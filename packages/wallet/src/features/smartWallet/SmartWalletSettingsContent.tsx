import { useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Flex, ScrollView, Separator, Text, TouchableArea } from 'ui/src'
import { QuestionInCircleFilled, RoundExclamation } from 'ui/src/components/icons'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { fonts, iconSizes, zIndexes } from 'ui/src/theme'
import { DisplayNameText } from 'uniswap/src/components/accounts/DisplayNameText'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { shortenAddress } from 'utilities/src/addresses'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { SmartWalletEducationalModal } from 'wallet/src/components/smartWallet/modals/SmartWalletEducationalModal'
import { setIsAllSmartWalletNudgesDisabled } from 'wallet/src/features/behaviorHistory/slice'
import { useSmartWalletData } from 'wallet/src/features/smartWallet/hooks/useSmartWalletData'
import { useTranslateSmartWalletStatus } from 'wallet/src/features/smartWallet/hooks/useTranslateSmartWalletStatus'
import {
  SmartWalletModalsManager,
  useSmartWalletModals,
} from 'wallet/src/features/smartWallet/SmartWalletModalsManager'
import { SmartWalletModalState, WalletData, WalletStatus } from 'wallet/src/features/smartWallet/types'
import { useWalletDelegationContext } from 'wallet/src/features/smartWallet/WalletDelegationProvider'
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
      return (
        <Text variant="body4" color="$neutral2">
          {t('settings.setting.smartWallet.notEligible')}
        </Text>
      )
    }
    return <RotatableChevron color="$neutral3" direction="right" height={iconSizes.icon20} width={iconSizes.icon20} />
  }, [isInactive, isUnavailable, onPressCallback, t])

  const displayName = useDisplayName(wallet.walletAddress)

  return (
    <TouchableArea
      key={wallet.walletAddress}
      alignItems="center"
      borderRadius="$rounded16"
      flexDirection="row"
      gap="$spacing12"
      justifyContent="space-between"
      cursor={isInactive ? 'default' : 'pointer'}
      onPress={!isInactive ? onPressCallback : undefined}
    >
      <Flex row shrink minWidth={0} alignItems="center" gap="$spacing12" opacity={isUnavailable ? 0.5 : 1}>
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
            height={iconSizes.icon40}
            width={iconSizes.icon40}
            overflow="hidden"
          >
            <AccountIcon address={wallet.walletAddress} size={iconSizes.icon40} />
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
            {shortenAddress({ address: wallet.walletAddress })}
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

      const isActionRequired = status === WalletStatus.ActionRequired

      return (
        <Flex gap="$spacing16">
          {isActionRequired && (
            <Text color="$statusCritical" variant="subheading2">
              {getTranslatedStatus(status)}
            </Text>
          )}
          {walletsForStatus.map((wallet) => (
            <WalletItem key={wallet.walletAddress} wallet={wallet} onPress={handleOnWalletPress} />
          ))}
        </Flex>
      )
    },
    [wallets, handleOnWalletPress, getTranslatedStatus],
  )

  const hasActionRequiredWallets = wallets.some((w) => w.status === WalletStatus.ActionRequired)

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Flex px="$padding8">
          {renderWalletSection(WalletStatus.ActionRequired)}
          {hasActionRequiredWallets && (
            <Flex py="$spacing20">
              <Separator backgroundColor="$surface3" mt="$spacing4" />
            </Flex>
          )}
          <Flex gap="$spacing16">
            {renderWalletSection(WalletStatus.Active)}
            {renderWalletSection(WalletStatus.Inactive)}
            {renderWalletSection(WalletStatus.Unavailable)}
          </Flex>
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
