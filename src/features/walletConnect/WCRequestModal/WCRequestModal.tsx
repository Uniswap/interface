import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import { useAppDispatch } from 'src/app/hooks'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { signMessageActions } from 'src/features/walletConnect/saga'
import { EthMethod } from 'src/features/walletConnect/types'
import { rejectRequest } from 'src/features/walletConnect/WalletConnect'
import { WalletConnectRequest } from 'src/features/walletConnect/walletConnectSlice'
import { ClientDetails } from 'src/features/walletConnect/WCRequestModal/ClientDetails'

interface Props {
  isVisible: boolean
  onClose: () => void
  request: WalletConnectRequest | null
}

export function WCRequestModal({ isVisible, onClose, request }: Props) {
  const activeAccount = useActiveAccount()
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  if (request?.type !== EthMethod.PersonalSign) {
    return null
  }

  const onReject = () => {
    if (!activeAccount) return

    rejectRequest(request.internalId, activeAccount.address)
    onClose()
  }

  const onConfirm = async () => {
    if (!activeAccount) return

    dispatch(
      signMessageActions.trigger({
        requestInternalId: request.internalId,
        message: request.message,
        account: activeAccount,
      })
    )

    onClose()
  }

  return (
    <BottomSheetModal isVisible={isVisible} name={ModalName.WCSignRequest} onClose={onClose}>
      <Flex gap="lg" paddingBottom="xxl" paddingHorizontal="md" paddingTop="xl">
        <ClientDetails dapp={request.dapp} method={request.type} />
        <Flex
          borderColor="gray100"
          borderRadius="lg"
          borderWidth={1}
          gap="sm"
          /* need a fixed height here or else modal gets confused about total height */
          height={200}
          overflow="hidden">
          <ScrollView>
            <Flex p="md">
              <Text variant="bodySmSoft">{t('Message')}</Text>
              <Text variant="body">{request.message}</Text>
            </Flex>
          </ScrollView>
        </Flex>

        <Flex row backgroundColor="gray50" borderRadius="lg" justifyContent="space-between" p="md">
          <Text color="gray600" variant="body">
            {t('Signing as')}
          </Text>
          <AddressDisplay address={request.account} />
        </Flex>
        <Flex row gap="sm">
          <PrimaryButton
            flex={1}
            label={t('Cancel')}
            name={ElementName.Confirm}
            variant="gray"
            onPress={onReject}
          />
          <PrimaryButton
            flex={1}
            label={t('Confirm')}
            name={ElementName.Confirm}
            variant="blue"
            onPress={onConfirm}
          />
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}
