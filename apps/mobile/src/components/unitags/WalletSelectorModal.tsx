import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { navigate } from 'src/app/navigation/rootNavigation'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Unicon } from 'src/components/unicons/Unicon'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { OnboardingScreens, Screens } from 'src/screens/Screens'
import { Button, Flex, Icons, Separator, Text, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { ImportType, OnboardingEntryPoint } from 'wallet/src/features/onboarding/types'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { createAccountActions } from 'wallet/src/features/wallet/create/createAccountSaga'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'wallet/src/features/wallet/create/pendingAccountsSaga'
import {
  useDisplayName,
  useNativeAccountExists,
  useSignerAccounts,
} from 'wallet/src/features/wallet/hooks'
import { shortenAddress } from 'wallet/src/utils/addresses'
type WalletSelectorModalProps = {
  activeAccount: Account | null
  onPressAccount: (account: Account) => void
  onClose: () => void
}

export const WalletSelectorModal = ({
  activeAccount,
  onPressAccount,
  onClose,
}: WalletSelectorModalProps): JSX.Element => {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const signerAccounts = useSignerAccounts()
  const dispatch = useAppDispatch()
  const hasImportedSeedPhrase = useNativeAccountExists()

  const options = signerAccounts.map((account) => {
    return {
      key: `${ElementName.AccountCard}-${account.address}`,
      onPress: () => onPressAccount(account),
      render: () => <SwitchAccountOption account={account} activeAccount={activeAccount} />,
    }
  })

  const onPressNewWallet = (): void => {
    // Clear any existing pending accounts first.
    dispatch(pendingAccountActions.trigger(PendingAccountActions.Delete))
    dispatch(createAccountActions.trigger())

    navigate(Screens.OnboardingStack, {
      screen: OnboardingScreens.EditName,
      params: {
        importType: hasImportedSeedPhrase ? ImportType.CreateAdditional : ImportType.CreateNew,
        entryPoint: OnboardingEntryPoint.Sidebar,
      },
    })
    onClose()
  }

  return (
    <BottomSheetModal
      isDismissible
      backgroundColor={colors.surface1.get()}
      hideHandlebar={false}
      name={ModalName.AccountSwitcher}
      onClose={onClose}>
      <Flex centered gap="$spacing16" px="$spacing24">
        <Flex centered gap="$spacing8" py="$spacing16">
          <Text variant="subheading1">{t('Choose a wallet to map to')}</Text>
          <Text color="$neutral2" textAlign="center" variant="body2">
            {t(
              'Choose which wallet you want to assign your username to. You can only claim on 1 wallet, so choose wisely.'
            )}
          </Text>
        </Flex>
        <Flex gap="$spacing12" width="100%">
          {options.map((option) => (
            <Flex key={option.key} onPress={option.onPress}>
              {option.render()}
            </Flex>
          ))}
          <Flex row justifyContent="center">
            <Separator borderColor="$surface3" pt="$spacing12" />
            <Text color="$neutral3" px="$spacing12" variant="body2">
              {t('or')}
            </Text>
            <Separator borderColor="$surface3" pt="$spacing12" />
          </Flex>
        </Flex>
        <Flex centered row gap="$spacing12">
          <Button
            fill
            gap="$spacing16"
            justifyContent="flex-start"
            px="$spacing24"
            py="$spacing16"
            theme="secondary"
            onPress={onPressNewWallet}>
            <Flex centered backgroundColor="$accentSoft" borderRadius="$roundedFull" p="$spacing8">
              <Icons.WalletFilled color="$accent1" size={iconSizes.icon20} />
            </Flex>
            <Text variant="subheading1">{t('Create a new wallet')}</Text>
          </Button>
        </Flex>
        <Flex centered row gap="$spacing12" pt="$spacing12">
          <Button
            fill
            backgroundColor="$surface1"
            color="$accent1"
            theme="secondary"
            onPress={onClose}>
            {t('Close')}
          </Button>
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}

export const SwitchAccountOption = ({
  account,
  activeAccount,
}: {
  account: Account
  activeAccount: Account | null
}): JSX.Element => {
  const displayName = useDisplayName(account.address)
  return (
    <Flex
      row
      alignItems="center"
      backgroundColor="$surface3"
      borderColor="$accent1"
      borderRadius="$rounded20"
      borderWidth={activeAccount?.address === account.address ? 1 : undefined}
      gap="$spacing16"
      justifyContent="flex-start"
      px="$spacing24"
      py="$spacing12">
      <Unicon address={account.address} size={iconSizes.icon40} />
      <Flex shrink alignItems="flex-start">
        <Text
          color="$neutral1"
          numberOfLines={1}
          testID={`address-display/name/${displayName?.name}`}
          variant="body1">
          {displayName?.name}
        </Text>
        <Text color="$neutral2" variant="subheading2">
          {shortenAddress(account.address)}
        </Text>
      </Flex>
    </Flex>
  )
}
