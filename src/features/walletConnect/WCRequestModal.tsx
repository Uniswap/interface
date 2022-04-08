import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { Button } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Box } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { ModalName } from 'src/features/telemetry/constants'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { signMessageActions } from 'src/features/walletConnect/saga'
import { EthMethod } from 'src/features/walletConnect/types'
import { rejectRequest } from 'src/features/walletConnect/WalletConnect'
import { WalletConnectRequest } from 'src/features/walletConnect/walletConnectSlice'

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
      <Box padding="xl">
        <Text variant="h6">Request for account: {request.account}</Text>
        <Text variant="h6">{request.message}</Text>
        <Button onPress={onReject}>
          <Text>Cancel</Text>
        </Button>
        <PrimaryButton label={t('Confirm')} onPress={onConfirm} />
      </Box>
    </BottomSheetModal>
  )
}
