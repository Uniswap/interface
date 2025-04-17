import React, { useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { SvgProps } from 'react-native-svg'
import { Text, ThemeKeys } from 'ui/src'
import AlertTriangleIcon from 'ui/src/assets/icons/alert-triangle.svg'
import TrashIcon from 'ui/src/assets/icons/trash.svg'
import WalletIcon from 'ui/src/assets/icons/wallet-filled.svg'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { getCloudProviderName } from 'uniswap/src/utils/cloud-backup/getCloudProviderName'
import { Account } from 'wallet/src/features/wallet/accounts/types'
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
            <Trans
              components={{ highlight: <Text color="$statusCritical" variant="body1" /> }}
              i18nKey="account.recoveryPhrase.remove.initial.title"
              values={{ walletName: displayName?.name }}
            />
          </Text>
        ),
        description: t('account.recoveryPhrase.remove.initial.description'),
        Icon: TrashIcon,
        iconColorLabel: 'statusCritical',
        actionButtonLabel: t('common.button.continue'),
      }
    }

    // 1st speed bump when replacing recovery phrase
    if (isRemovingRecoveryPhrase && isReplacing && currentStep === RemoveWalletStep.Warning) {
      return {
        title: t('account.wallet.button.import'),
        description: t('account.recoveryPhrase.remove.import.description'),
        Icon: WalletIcon,
        iconColorLabel: 'neutral2',
        actionButtonLabel: t('common.button.continue'),
      }
    }

    // 2nd and final speed bump when removing or replacing recovery phrase
    if (isRemovingRecoveryPhrase && currentStep === RemoveWalletStep.Final) {
      return {
        title: (
          <Text color="$neutral1" variant="body1">
            <Trans
              components={{ highlight: <Text color="$neutral1" variant="body1" /> }}
              i18nKey="account.recoveryPhrase.remove.final.title"
            />
          </Text>
        ),
        description: (
          <Trans
            components={{
              highlight: <Text color="$statusCritical" maxFontSizeMultiplier={1.4} variant="body3" />,
            }}
            i18nKey="account.recoveryPhrase.remove.final.description"
            values={{ cloudProviderName: getCloudProviderName() }}
          />
        ),
        Icon: AlertTriangleIcon,
        iconColorLabel: 'statusCritical',
      }
    }

    // removing mnemonic account
    if (account?.type === AccountType.SignerMnemonic && currentStep === RemoveWalletStep.Final) {
      const associatedAccountNames = associatedAccounts
        .filter((aa): aa is Account => aa.address !== account?.address)
        .map((aa) => aa.name ?? '')

      return {
        title: (
          <Text color="$neutral1" variant="body1">
            <Trans
              components={{
                highlight: <Text color="$statusCritical" variant="body1" />,
              }}
              i18nKey="account.recoveryPhrase.remove.initial.title"
              values={{ walletName: displayName?.name }}
            />
          </Text>
        ),
        description: t('account.recoveryPhrase.remove.mnemonic.description', { walletNames: associatedAccountNames }),
        Icon: TrashIcon,
        iconColorLabel: 'statusCritical',
        actionButtonLabel: t('common.button.remove'),
      }
    }

    // removing view-only account
    if (account?.type === AccountType.Readonly && currentStep === RemoveWalletStep.Final) {
      return {
        title: (
          <Text color="$neutral1" variant="body1">
            <Trans
              components={{
                highlight: <Text color="$neutral2" variant="body1" />,
              }}
              i18nKey="account.recoveryPhrase.remove.initial.title"
              values={{ walletName: displayName?.name }}
            />
          </Text>
        ),
        description: t('account.wallet.remove.viewOnly'),
        Icon: TrashIcon,
        iconColorLabel: 'neutral2',
        actionButtonLabel: t('common.button.remove'),
      }
    }

    return undefined
  }, [account, associatedAccounts, currentStep, displayName, isRemovingRecoveryPhrase, isReplacing, t])
}
