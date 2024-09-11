import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SwitchAccountOption } from 'src/components/Requests/ScanSheet/SwitchAccountOption'
import { Flex, Text } from 'ui/src'
import { ActionSheetModal } from 'uniswap/src/components/modals/ActionSheetModal'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'

type Props = {
  activeAccount: Account | null
  onPressAccount: (account: Account) => void
  onClose: () => void
}

export const PendingConnectionSwitchAccountModal = ({ activeAccount, onPressAccount, onClose }: Props): JSX.Element => {
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
    [signerAccounts, activeAccount, onPressAccount],
  )

  return (
    <ActionSheetModal
      header={
        <Flex centered gap="$spacing4" py="$spacing16">
          <Text variant="buttonLabel2">{t('walletConnect.pending.switchAccount')}</Text>
        </Flex>
      }
      isDismissible={false}
      isVisible={true}
      name={ModalName.AccountEdit}
      options={options}
      onClose={onClose}
    />
  )
}
