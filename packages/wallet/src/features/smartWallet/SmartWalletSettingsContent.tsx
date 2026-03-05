import { useCallback, useEffect } from 'react'
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
import { useSmartWalletData } from 'wallet/src/features/smartWallet/hooks/useSmartWalletData'
import { useTranslateSmartWalletStatus } from 'wallet/src/features/smartWallet/hooks/useTranslateSmartWalletStatus'
import {
  SmartWalletModalsManager,
  useSmartWalletModals,
} from 'wallet/src/features/smartWallet/SmartWalletModalsManager'
import { SmartWalletModalState, type WalletData, WalletStatus } from 'wallet/src/features/smartWallet/types'
import { useWalletDelegationContext } from 'wallet/src/features/smartWallet/WalletDelegationProvider'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'

function WalletItem({ wallet, onPress }: { wallet: WalletData; onPress: (wallet: WalletData) => void }): JSX.Element {
  const getTranslatedStatus = useTranslateSmartWalletStatus()

  const isUnavailable = wallet.status === WalletStatus.Unavailable
  const isPending = wallet.status === WalletStatus.Pending
  const isActive = wallet.status === WalletStatus.Active || wallet.status === WalletStatus.ActionRequired

  const onPressCallback = useCallback((): void => {
    onPress(wallet)
  }, [onPress, wallet])

  const displayName = useDisplayName(wallet.walletAddress)

  return (
    <TouchableArea
      key={wallet.walletAddress}
      alignItems="center"
      borderRadius="$rounded16"
      flexDirection="row"
      gap="$spacing12"
      justifyContent="space-between"
      disabled={isPending}
      onPress={onPressCallback}
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
      <Flex row alignItems="center" gap="$spacing8">
        <Text variant="body3" color={isActive ? '$accent1' : '$neutral2'}>
          {getTranslatedStatus(wallet.status)}
        </Text>
        <RotatableChevron color="$neutral3" direction="right" size="$icon.20" />
      </Flex>
    </TouchableArea>
  )
}

export function SmartWalletSettingsContent(): JSX.Element {
  const getTranslatedStatus = useTranslateSmartWalletStatus()
  const wallets = useSmartWalletData()
  const { refreshDelegationData } = useWalletDelegationContext()

  const { selectedWallet, modalState, setSelectedWallet, setModalState } = useSmartWalletModals()

  // Refresh delegation data when component mounts
  useEffect(() => {
    refreshDelegationData().catch((error) => {
      logger.error(error, {
        tags: { file: 'SmartWalletSettingsContent', function: 'refreshDelegationData' },
      })
    })
  }, [refreshDelegationData])

  const handleOnWalletPress = useEvent((wallet: WalletData) => {
    setSelectedWallet(wallet)

    const statusActionMap = {
      [WalletStatus.Active]: () => setModalState(SmartWalletModalState.Disable),
      [WalletStatus.ActionRequired]: () => setModalState(SmartWalletModalState.ActionRequired),
      [WalletStatus.Unavailable]: () => setModalState(SmartWalletModalState.Unavailable),
      [WalletStatus.Inactive]: () => setModalState(SmartWalletModalState.Disable),
      [WalletStatus.Pending]: (): void => {},
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
            {renderWalletSection(WalletStatus.Pending)}
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
