import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
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
import { opacify } from 'src/utils/colors'
import { logger } from 'src/utils/logger'

interface Props {
  isVisible: boolean
  onClose: () => void
  request: WalletConnectRequest | null
}

const isPotentiallyUnsafeMethod = (type: EthMethod) => type === EthMethod.EthSign

const getMessage = (request: WalletConnectRequest) => {
  if ([EthMethod.PersonalSign, EthMethod.EthSign].includes(request.type)) {
    return request.message
  }

  if (request.type === EthMethod.SignTypedData) {
    try {
      const message = JSON.parse(request.message)
      return JSON.stringify(message, null, 4)
    } catch (e) {
      logger.error('WCRequestModal', 'getMessage', 'invalid JSON message', e)
    }
  }

  return ''
}

const VALID_REQUEST_TYPES = [EthMethod.PersonalSign, EthMethod.SignTypedData, EthMethod.EthSign]

export function WCRequestModal({ isVisible, onClose, request }: Props) {
  const theme = useAppTheme()
  const activeAccount = useActiveAccount()
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [maybeUnsafeConfirmation, setMaybeUnsafeConfirmation] = useState(false)

  if (!request?.type || !VALID_REQUEST_TYPES.includes(request?.type)) {
    return null
  }

  const canSubmit = !isPotentiallyUnsafeMethod(request.type) || maybeUnsafeConfirmation

  const onReject = () => {
    if (!activeAccount) return

    rejectRequest(request.internalId, activeAccount.address)
    onClose()
  }

  const onConfirm = async () => {
    if (!activeAccount || !canSubmit) return

    dispatch(
      signMessageActions.trigger({
        requestInternalId: request.internalId,
        method: request.type,
        message: request.message,
        account: activeAccount,
      })
    )

    onClose()
  }

  const message = getMessage(request)

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
          maxHeight={200}
          overflow="hidden">
          <ScrollView>
            <Flex p="md">
              <Text variant="bodySmSoft">{t('Message')}</Text>
              <Text variant="body">{message}</Text>
            </Flex>
          </ScrollView>
        </Flex>
        {isPotentiallyUnsafeMethod(request.type) ? (
          <Flex
            centered
            borderRadius="lg"
            gap="sm"
            padding="md"
            style={{ backgroundColor: opacify(5, theme.colors.yellow) }}>
            <AlertTriangle height={22} stroke={theme.colors.yellow} width={22} />
            <Text color="yellow" textAlign="center" variant="body">
              {t('This method of authorization could be insecure.')}
            </Text>
            <PrimaryButton
              disabled={maybeUnsafeConfirmation}
              label={t('I understand')}
              variant="yellow"
              onPress={() => setMaybeUnsafeConfirmation(true)}
            />
          </Flex>
        ) : null}

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
            disabled={!canSubmit}
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
