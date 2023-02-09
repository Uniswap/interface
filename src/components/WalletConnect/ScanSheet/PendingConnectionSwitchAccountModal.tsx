import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'src/components/layout'
import { ActionSheetModal } from 'src/components/modals/ActionSheetModal'
import { Text } from 'src/components/Text'
import { SwitchAccountOption } from 'src/components/WalletConnect/ScanSheet/SwitchAccountOption'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { Account } from 'src/features/wallet/accounts/types'
import { useSignerAccounts } from 'src/features/wallet/hooks'

type Props = {
  activeAccount: Account | null
  onPressAccount: (account: Account) => void
  onClose: () => void
}

export const PendingConnectionSwitchAccountModal = ({
  activeAccount,
  onPressAccount,
  onClose,
}: Props): JSX.Element => {
  const { t } = useTranslation()
  const signerAccounts = useSignerAccounts()

  const options = useMemo(
    () =>
      signerAccounts.map((account) => {
        return {
          key: `${ElementName.AccountCard}-${account.address}`,
          onPress: () => onPressAccount(account),
          render: () => <SwitchAccountOption account={account} activeAccount={activeAccount} />,
        }
      }),
    [signerAccounts, activeAccount, onPressAccount]
  )

  return (
    <ActionSheetModal
      header={
        <Flex centered gap="spacing4" py="spacing16">
          <Text variant="buttonLabelMedium">{t('Switch Account')}</Text>
        </Flex>
      }
      isVisible={true}
      name={ModalName.AccountEdit}
      options={options}
      onClose={onClose}
    />
  )
}
