import React, { useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { SvgProps } from 'react-native-svg'
import { concatListOfAccountNames } from 'src/components/RemoveWallet/utils'
import { Text, ThemeKeys } from 'ui/src'
import AlertTriangleIcon from 'ui/src/assets/icons/alert-triangle.svg'
import TrashIcon from 'ui/src/assets/icons/trash.svg'
import WalletIcon from 'ui/src/assets/icons/wallet-filled.svg'
import { ThemeNames } from 'ui/src/theme'
import { Account, AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'
import { getCloudProviderName } from 'wallet/src/utils/platform'

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

  const displayName = useDisplayName(account?.address, { includeUnitagSuffix: true })

  return useMemo(() => {
    // 1st speed bump when removing recovery phrase
    if (isRemovingRecoveryPhrase && !isReplacing && currentStep === RemoveWalletStep.Warning) {
      return {
        title: (
          <Text color="$neutral1" variant="body1">
            <Trans i18nKey="account.seedPhrase.remove.initial.title">
              You’re removing
              <Text color="$statusCritical" variant="body1">
                {{ walletName: displayName?.name }}
              </Text>
            </Trans>
          </Text>
        ),
        description: t('account.seedPhrase.remove.initial.description'),
        Icon: TrashIcon,
        iconColorLabel: 'statusCritical',
        actionButtonLabel: t('common.button.continue'),
        actionButtonTheme: 'detrimental',
      }
    }

    // 1st speed bump when replacing recovery phrase
    if (isRemovingRecoveryPhrase && isReplacing && currentStep === RemoveWalletStep.Warning) {
      return {
        title: t('account.wallet.button.import'),
        description: t('account.seedPhrase.remove.import.description'),
        Icon: WalletIcon,
        iconColorLabel: 'neutral2',
        actionButtonLabel: t('common.button.continue'),
        actionButtonTheme: 'secondary',
      }
    }

    // 2nd and final speed bump when removing or replacing recovery phrase
    if (isRemovingRecoveryPhrase && currentStep === RemoveWalletStep.Final) {
      return {
        title: (
          <Text color="$neutral1" variant="body1">
            <Trans i18nKey="account.seedPhrase.remove.final.title">
              You’re removing your
              <Text color="$neutral1" variant="body1">
                recovery phrase
              </Text>
            </Trans>
          </Text>
        ),
        description: (
          <Trans i18nKey="account.seedPhrase.remove.final.description">
            Make sure you’ve written down your recovery phrase or backed it up on
            {{ cloudProviderName: getCloudProviderName() }}.
            <Text color="$statusCritical" maxFontSizeMultiplier={1.4} variant="body3">
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
        ', '
      )

      return {
        title: (
          <Text color="$neutral1" variant="body1">
            <Trans i18nKey="account.seedPhrase.remove.initial.title">
              You’re removing
              <Text color="$statusCritical" variant="body1">
                {{ walletName: displayName?.name }}
              </Text>
            </Trans>
          </Text>
        ),
        description: (
          <Trans i18nKey="account.seedPhrase.remove.mnemonic.description">
            It shares the same recovery phrase as
            <Text color="$neutral1" variant="body3">
              {{ walletNames: associatedAccountNames }}
            </Text>
            . Your recovery phrase will remain stored until you delete all remaining wallets.
          </Trans>
        ),
        Icon: TrashIcon,
        iconColorLabel: 'statusCritical',
        actionButtonLabel: t('common.button.remove'),
        actionButtonTheme: 'detrimental',
      }
    }

    // removing view-only account
    if (account?.type === AccountType.Readonly && currentStep === RemoveWalletStep.Final) {
      return {
        title: (
          <Text color="$neutral1" variant="body1">
            <Trans i18nKey="account.seedPhrase.remove.initial.title">
              You’re removing
              <Text color="$neutral2" variant="body1">
                {{ walletName: displayName?.name }}
              </Text>
            </Trans>
          </Text>
        ),
        description: t('account.wallet.remove.viewOnly'),
        Icon: TrashIcon,
        iconColorLabel: 'neutral2',
        actionButtonLabel: t('common.button.remove'),
        actionButtonTheme: 'secondary',
      }
    }
  }, [
    account,
    associatedAccounts,
    currentStep,
    displayName,
    isRemovingRecoveryPhrase,
    isReplacing,
    t,
  ])
}
