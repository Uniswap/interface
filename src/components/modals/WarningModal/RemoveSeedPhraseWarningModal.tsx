import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Flex } from 'src/components/layout'
import { WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { DecimalNumber } from 'src/components/text/DecimalNumber'
import { useAccountListQuery } from 'src/data/__generated__/types-and-hooks'
import { ModalName } from 'src/features/telemetry/constants'
import { Account } from 'src/features/wallet/accounts/types'
import { formatUSDPrice } from 'src/utils/format'

export type RemoveSeedPhraseWarningModalProps = {
  associatedAccounts: Account[]
  onContinue?: () => void
  onClose?: () => void
  isReplacingSeedPhrase?: boolean
}
export default function RemoveSeedPhraseWarningModal({
  associatedAccounts,
  onContinue,
  onClose,
  isReplacingSeedPhrase,
}: RemoveSeedPhraseWarningModalProps): JSX.Element {
  const { t } = useTranslation()

  const { data, loading } = useAccountListQuery({
    variables: {
      addresses: associatedAccounts.map((account) => account.address),
    },
    notifyOnNetworkStatusChange: true,
  })

  const totalBalanceAtIndex = useCallback(
    (index: number) => data?.portfolios?.at(index)?.tokensTotalDenominatedValue?.value,
    [data?.portfolios]
  )
  return (
    <WarningModal
      caption={
        isReplacingSeedPhrase
          ? t(
              'Uniswap Wallet can only store one recovery phrase at a time. In order to import a new wallet, you have to delete your current recovery phrase and any associated wallets from this device.'
            )
          : t(
              'This action will remove your recovery phrase from this device. You will not be able to access these funds unless you’ve backed up the recovery phrase manually or on iCloud.'
            )
      }
      closeText={t('Close')}
      confirmText={t('Continue')}
      modalName={ModalName.RemoveSeedPhraseWarningModal}
      severity={WarningSeverity.High}
      title={
        isReplacingSeedPhrase
          ? t('Delete your recovery phrase to import a different wallet')
          : t('Are you sure?')
      }
      onCancel={onClose}
      onConfirm={onContinue}>
      <Flex grow row>
        {associatedAccounts.map((account, index) => {
          return (
            <Flex grow row alignItems="center" justifyContent="space-between">
              <AddressDisplay address={account.address} size={36} variant="subheadSmall" />
              <DecimalNumber
                adjustsFontSizeToFit={!loading}
                formattedNumber={formatUSDPrice(totalBalanceAtIndex(index))}
                loading={loading}
                number={totalBalanceAtIndex(index)}
                numberOfLines={1}
                variant="monospace"
              />
            </Flex>
          )
        })}
      </Flex>
    </WarningModal>
  )
}
