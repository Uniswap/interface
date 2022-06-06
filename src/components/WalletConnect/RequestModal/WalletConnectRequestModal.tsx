import { providers } from 'ethers'
import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { ClientDetails, PermitInfo } from 'src/components/WalletConnect/RequestModal/ClientDetails'
import { RequestMessage } from 'src/components/WalletConnect/RequestModal/RequestMessage'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { signWcRequestActions } from 'src/features/walletConnect/saga'
import { EthMethod, isPrimaryTypePermit, PermitMessage } from 'src/features/walletConnect/types'
import { rejectRequest } from 'src/features/walletConnect/WalletConnect'
import { WalletConnectRequest } from 'src/features/walletConnect/walletConnectSlice'
import { toSupportedChainId } from 'src/utils/chainId'
import { opacify } from 'src/utils/colors'
import { buildCurrencyId } from 'src/utils/currencyId'
import { logger } from 'src/utils/logger'

const MAX_MODAL_MESSAGE_HEIGHT = 200

interface Props {
  isVisible: boolean
  onClose: () => void
  request: WalletConnectRequest | null
}

const isPotentiallyUnsafe = (request: WalletConnectRequest) =>
  request.type === EthMethod.EthSign && !request.message

const methodCostsGas = (type: EthMethod) => type === EthMethod.EthSendTransaction

/** If the request is a permit then parse the relevant information otherwise return undefined. */
const getPermitInfo = (request: WalletConnectRequest): PermitInfo | undefined => {
  if (request.type !== EthMethod.SignTypedDataV4) {
    return undefined
  }

  try {
    const message = JSON.parse(request.rawMessage)
    if (!isPrimaryTypePermit(message)) {
      return undefined
    }

    const { domain, message: permitPayload } = message as PermitMessage
    const currencyId = buildCurrencyId(domain.chainId, domain.verifyingContract)
    const amount = permitPayload.value

    return { currencyId, amount }
  } catch (e) {
    logger.info('WalletConnectRequestModal', 'getPermitInfo', 'invalid JSON message', e)
    return undefined
  }
}

const VALID_REQUEST_TYPES = [
  EthMethod.PersonalSign,
  EthMethod.SignTypedData,
  EthMethod.SignTypedDataV4,
  EthMethod.EthSign,
  EthMethod.EthSignTransaction,
  EthMethod.EthSendTransaction,
]

export function WalletConnectRequestModal({ isVisible, onClose, request }: Props) {
  const theme = useAppTheme()
  const activeAccount = useActiveAccount()
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [maybeUnsafeConfirmation, setMaybeUnsafeConfirmation] = useState(false)

  /**
   * TODO: implement this behavior in a less janky way. Ideally if we can distinguish between `onClose` being called programmatically and `onClose` as a results of a user dismissing the modal then we can determine what this value should be without this class variable.
   * Indicates that the modal can reject the request when the modal happens. This will be false when the modal closes as a result of the user explicitly confirming or rejecting a request and true otherwise.
   */
  const rejectOnCloseRef = useRef(true)

  if (!request?.type || !VALID_REQUEST_TYPES.includes(request?.type)) {
    return null
  }

  const canSubmit = !isPotentiallyUnsafe(request) || maybeUnsafeConfirmation

  const onReject = () => {
    if (!activeAccount) return

    rejectRequest(request.internalId, activeAccount.address)
    rejectOnCloseRef.current = false
    onClose()
  }

  const onConfirm = async () => {
    if (!activeAccount || !canSubmit) return
    if (
      request.type === EthMethod.EthSignTransaction ||
      request.type === EthMethod.EthSendTransaction
    ) {
      const { to, from, gasPrice, data, nonce } = request.transaction
      const transaction: providers.TransactionRequest = {
        to,
        from,
        gasPrice,
        data,
        nonce,
        chainId: toSupportedChainId(request.dapp.chain_id) ?? undefined,
      }
      dispatch(
        signWcRequestActions.trigger({
          requestInternalId: request.internalId,
          method: request.type,
          transaction,
          account: activeAccount,
          dapp: request.dapp,
        })
      )
    } else {
      dispatch(
        signWcRequestActions.trigger({
          requestInternalId: request.internalId,
          method: request.type,
          // @ts-ignore this is EthSignMessage type
          message: request.message || request.rawMessage,
          account: activeAccount,
          dapp: request.dapp,
        })
      )
    }

    rejectOnCloseRef.current = false
    onClose()
  }

  const handleClose = () => {
    if (rejectOnCloseRef.current) {
      onReject()
    } else {
      onClose()
    }
  }

  let permitInfo = getPermitInfo(request)

  return (
    <BottomSheetModal isVisible={isVisible} name={ModalName.WCSignRequest} onClose={handleClose}>
      <Flex gap="lg" paddingBottom="xxl" paddingHorizontal="md" paddingTop="xl">
        <ClientDetails permitInfo={permitInfo} request={request} />
        {!permitInfo && (
          <Flex
            borderColor="deprecated_gray100"
            borderRadius="lg"
            borderWidth={1}
            gap="sm"
            /* need a fixed height here or else modal gets confused about total height */
            maxHeight={MAX_MODAL_MESSAGE_HEIGHT}
            overflow="hidden">
            <RequestMessage request={request} />
          </Flex>
        )}
        {isPotentiallyUnsafe(request) ? (
          <Flex
            centered
            borderRadius="lg"
            gap="sm"
            padding="md"
            style={{ backgroundColor: opacify(5, theme.colors.deprecated_yellow) }}>
            <AlertTriangle color={theme.colors.deprecated_yellow} height={22} width={22} />
            <Text color="deprecated_yellow" textAlign="center" variant="body1">
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

        <Flex
          backgroundColor="deprecated_gray50"
          borderRadius="lg"
          gap="xs"
          justifyContent="space-between"
          p="md">
          <AddressDisplay showAddressAsSubtitle address={request.account} />
          {methodCostsGas(request.type) ? null : (
            <Text color="neutralTextTertiary" fontSize={12} fontStyle="italic">
              This request will not cost any gas fees.
            </Text>
          )}
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
