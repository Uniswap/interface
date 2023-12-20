import React, { useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { SvgProps } from 'react-native-svg'
import { concatListOfAccountNames } from 'src/components/RemoveWallet/utils'
import { IS_ANDROID } from 'src/constants/globals'
import { Text, ThemeKeys } from 'ui/src'
import AlertTriangleIcon from 'ui/src/assets/icons/alert-triangle.svg'
import TrashIcon from 'ui/src/assets/icons/trash.svg'
import WalletIcon from 'ui/src/assets/icons/wallet-filled.svg'
import { ThemeNames } from 'ui/src/theme'
import { Account, AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'

export enum RemoveWalletStep {
  Warning = 'warning',
  Final = 'final',
}

interface ModalContentParams {
  account: Account | undefined
  isReplacing: boolean
  currentStep: string
  isRemovingRecoveryPhrase: boolean
  associatedAccounts: Account[]
}

interface ModalContentResult {
  title: React.ReactNode
  description: React.ReactNode
  Icon: React.ComponentType<SvgProps>
  iconColorLabel: ThemeKeys
  actionButtonLabel?: string
  actionButtonTheme?: ThemeNames
}

export const useModalContent = ({
  account,
  isReplacing,
  currentStep,
  isRemovingRecoveryPhrase,
  associatedAccounts,
}: ModalContentParams): ModalContentResult | undefined => {
  const { t } = useTranslation()

  const displayName = useDisplayName(account?.address)

  return useMemo(() => {
    // 1st speed bump when removing recovery phrase
    if (isRemovingRecoveryPhrase && !isReplacing && currentStep === RemoveWalletStep.Warning) {
      return {
        title: (
          <Trans t={t}>
            <Text color="$neutral1" variant="body1">
              You’re removing{' '}
              <Text color="$statusCritical" variant="body1">
                {{ wallet: displayName?.name }}
              </Text>
            </Text>
          </Trans>
        ),
        description: t(
          'This will remove your wallet from this device along with your recovery phrase.'
        ),
        Icon: TrashIcon,
        iconColorLabel: 'statusCritical',
        actionButtonLabel: t('Continue'),
        actionButtonTheme: 'detrimental',
      }
    }

    // 1st speed bump when replacing recovery phrase
    if (isRemovingRecoveryPhrase && isReplacing && currentStep === RemoveWalletStep.Warning) {
      return {
        title: t('Import a new wallet'),
        description: t(
          'You can only store one recovery phrase at a time. To continue importing a new one, you’ll need to remove your current recovery phrase and any associated wallets from this device.'
        ),
        Icon: WalletIcon,
        iconColorLabel: 'neutral2',
        actionButtonLabel: t('Continue'),
        actionButtonTheme: 'secondary',
      }
    }

    // 2nd and final speed bump when removing or replacing recovery phrase
    if (isRemovingRecoveryPhrase && currentStep === RemoveWalletStep.Final) {
      return {
        title: (
          <Trans t={t}>
            <Text color="$neutral1" variant="body1">
              You’re removing your{' '}
              <Text color="$statusCritical" variant="body1">
                recovery phrase
              </Text>
            </Text>
          </Trans>
        ),
        description: IS_ANDROID ? (
          <Trans t={t}>
            Make sure you’ve written down your recovery phrase or backed it up on Google Drive.{' '}
            <Text color="$neutral2" maxFontSizeMultiplier={1.4} variant="buttonLabel3">
              You will not be able to access your funds otherwise.
            </Text>
          </Trans>
        ) : (
          <Trans t={t}>
            Make sure you’ve written down your recovery phrase or backed it up on iCloud.{' '}
            <Text color="$neutral2" maxFontSizeMultiplier={1.4} variant="buttonLabel3">
              You will not be able to access your funds otherwise.
            </Text>
          </Trans>
        ),
        Icon: AlertTriangleIcon,
        iconColorLabel: 'statusCritical',
      }
    }

    // removing mnemonic account
    if (account?.type === AccountType.SignerMnemonic && currentStep === RemoveWalletStep.Final) {
      const associatedAccountNames = concatListOfAccountNames(
        associatedAccounts.filter((aa) => aa.address !== account?.address),
        t('and')
      )

      return {
        title: (
          <Trans t={t}>
            <Text color="$neutral1" variant="body1">
              You’re removing{' '}
              <Text color="$statusCritical" variant="body1">
                {{ wallet: displayName?.name }}
              </Text>
            </Text>
          </Trans>
        ),
        description: (
          <Trans t={t}>
            It shares the same recovery phrase as{' '}
            <Text fontWeight="bold">{{ wallets: associatedAccountNames }}</Text>. Your recovery
            phrase will remain stored until you delete all remaining wallets.
          </Trans>
        ),
        Icon: TrashIcon,
        iconColorLabel: 'statusCritical',
        actionButtonLabel: t('Remove'),
        actionButtonTheme: 'detrimental',
      }
    }

    // removing view-only account
    if (account?.type === AccountType.Readonly && currentStep === RemoveWalletStep.Final) {
      return {
        title: (
          <Trans t={t}>
            <Text color="$neutral1" variant="body1">
              You’re removing{' '}
              <Text color="$neutral2" variant="body1">
                {{ wallet: displayName?.name }}
              </Text>
            </Text>
          </Trans>
        ),
        description: t(
          'You can always add back view-only wallets by entering the wallet’s address.'
        ),
        Icon: TrashIcon,
        iconColorLabel: 'neutral2',
        actionButtonLabel: t('Remove'),
        actionButtonTheme: 'secondary',
      }
    }
  }, [
    account,
    associatedAccounts,
    currentStep,
    displayName?.name,
    isRemovingRecoveryPhrase,
    isReplacing,
    t,
  ])
}
