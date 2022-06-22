import { providers } from 'ethers'
import React, { ComponentProps, PropsWithChildren, useMemo, useRef } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleProp, ViewStyle } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Box, Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { AccountDetails } from 'src/components/WalletConnect/RequestModal/AccountDetails'
import { ClientDetails, PermitInfo } from 'src/components/WalletConnect/RequestModal/ClientDetails'
import { useHasSufficientFunds } from 'src/components/WalletConnect/RequestModal/hooks'
import { NetworkFee } from 'src/components/WalletConnect/RequestModal/NetworkFee'
import { RequestMessage } from 'src/components/WalletConnect/RequestModal/RequestMessage'
import { SpendingDetails } from 'src/components/WalletConnect/RequestModal/SpendingDetails'
import { ChainId } from 'src/constants/chains'
import { useGasFeeInfo } from 'src/features/gas/hooks'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'
import { useActiveAccount, useSignerAccounts } from 'src/features/wallet/hooks'
import { signWcRequestActions } from 'src/features/walletConnect/saga'
import { EthMethod, isPrimaryTypePermit, PermitMessage } from 'src/features/walletConnect/types'
import { rejectRequest } from 'src/features/walletConnect/WalletConnect'
import {
  isTransactionRequest,
  TransactionRequest,
  WalletConnectRequest,
} from 'src/features/walletConnect/walletConnectSlice'
import { toSupportedChainId } from 'src/utils/chainId'
import { buildCurrencyId } from 'src/utils/currencyId'
import { logger } from 'src/utils/logger'
import { tryParseRawAmount } from 'src/utils/tryParseAmount'

const MAX_MODAL_MESSAGE_HEIGHT = 200

interface Props {
  isVisible: boolean
  onClose: () => void
  request: WalletConnectRequest | null
}

const isPotentiallyUnsafe = (request: WalletConnectRequest) =>
  request.type !== EthMethod.PersonalSign

const methodCostsGas = (request: WalletConnectRequest): request is TransactionRequest =>
  request.type === EthMethod.EthSendTransaction

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

const getTransactionCurrencyAmount = (chainId: ChainId | undefined, value: string) => {
  const nativeCurrency = NativeCurrency.onChain(chainId || ChainId.Mainnet)
  return tryParseRawAmount(value, nativeCurrency)
}

const VALID_REQUEST_TYPES = [
  EthMethod.PersonalSign,
  EthMethod.SignTypedData,
  EthMethod.SignTypedDataV4,
  EthMethod.EthSign,
  EthMethod.EthSignTransaction,
  EthMethod.EthSendTransaction,
]

function SectionContainer({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return children ? (
    <Box p="md" style={style}>
      {children}
    </Box>
  ) : null
}

const spacerProps: ComponentProps<typeof Box> = {
  borderBottomColor: 'neutralOutline',
  borderBottomWidth: 1,
}

export function WalletConnectRequestModal({ isVisible, onClose, request }: Props) {
  const chainId = toSupportedChainId(request?.dapp.chain_id) ?? undefined

  const tx: providers.TransactionRequest | null = useMemo(() => {
    if (!chainId || !request || !isTransactionRequest(request)) {
      return null
    }

    const { to, from, value, data, gasPrice, nonce } = request.transaction

    return {
      to,
      from,
      value,
      data,
      gasPrice,
      nonce,
      chainId,
    }
  }, [chainId, request])

  const activeAccount = useActiveAccount()
  const hasMultipleAccounts = useSignerAccounts().length > 1
  const gasFeeInfo = useGasFeeInfo(chainId, tx)
  const hasSufficientFunds = useHasSufficientFunds({
    account: request?.account,
    chainId,
    gasFeeInfo,
    value: request && isTransactionRequest(request) ? request.transaction.value : undefined,
  })

  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  /**
   * TODO: implement this behavior in a less janky way. Ideally if we can distinguish between `onClose` being called programmatically and `onClose` as a results of a user dismissing the modal then we can determine what this value should be without this class variable.
   * Indicates that the modal can reject the request when the modal happens. This will be false when the modal closes as a result of the user explicitly confirming or rejecting a request and true otherwise.
   */
  const rejectOnCloseRef = useRef(true)

  if (!request?.type || !VALID_REQUEST_TYPES.includes(request?.type)) {
    return null
  }

  const onReject = () => {
    rejectRequest(request.internalId)
    rejectOnCloseRef.current = false
    onClose()
  }

  const onConfirm = async () => {
    if (!activeAccount) return
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
        chainId,
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

  const currencyAmount =
    isTransactionRequest(request) &&
    getTransactionCurrencyAmount(chainId, request.transaction.value)
  const hasCurrencyAmount = currencyAmount && !currencyAmount.equalTo(0)
  const nativeCurrency = chainId && NativeCurrency.onChain(chainId)

  let permitInfo = getPermitInfo(request)

  return (
    <BottomSheetModal isVisible={isVisible} name={ModalName.WCSignRequest} onClose={handleClose}>
      <Flex gap="lg" paddingBottom="xxl" paddingHorizontal="md" paddingTop="xl">
        <ClientDetails permitInfo={permitInfo} request={request} />

        <Flex
          backgroundColor="neutralContainer"
          borderRadius="lg"
          gap="none"
          spacerProps={spacerProps}>
          {hasCurrencyAmount && (
            <SectionContainer>
              <SpendingDetails currencyAmount={currencyAmount} />
            </SectionContainer>
          )}

          {!permitInfo && (
            <SectionContainer style={requestMessageStyle}>
              <RequestMessage request={request} />
            </SectionContainer>
          )}

          {isPotentiallyUnsafe(request) && (
            <SectionContainer>
              <Text color="accentBackgroundWarning" variant="body2">
                <Trans t={t}>
                  <Text fontWeight="bold">Be careful:</Text>{' '}
                  {isTransactionRequest(request)
                    ? 'Accepting this request'
                    : 'Signing this message'}{' '}
                  could allow the requesting app to perform any action with your wallet and its
                  contents.
                </Trans>
              </Text>
            </SectionContainer>
          )}

          {methodCostsGas(request) && chainId && (
            <SectionContainer>
              <NetworkFee
                chainId={chainId}
                gasFeeInfo={gasFeeInfo}
                transaction={request.transaction}
              />
            </SectionContainer>
          )}

          {hasMultipleAccounts && (
            <SectionContainer>
              <AccountDetails address={request.account} />
              {!hasSufficientFunds && (
                <Text color="accentBackgroundWarning" paddingTop="xs" variant="caption">
                  {t("You don't have enough {{symbol}} to complete this transaction.", {
                    symbol: nativeCurrency?.symbol,
                  })}
                </Text>
              )}
            </SectionContainer>
          )}
        </Flex>

        <Flex row gap="sm">
          <PrimaryButton
            borderColor="neutralOutline"
            borderWidth={1}
            flex={1}
            label={t('Cancel')}
            name={ElementName.Cancel}
            variant="black"
            onPress={onReject}
          />
          <PrimaryButton
            borderRadius="md"
            disabled={!activeAccount || !hasSufficientFunds}
            flex={1}
            label={isTransactionRequest(request) ? t('Accept') : t('Sign')}
            name={ElementName.Confirm}
            variant="blue"
            onPress={onConfirm}
          />
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}

const requestMessageStyle: StyleProp<ViewStyle> = {
  // need a fixed height here or else modal gets confused about total height
  maxHeight: MAX_MODAL_MESSAGE_HEIGHT,
  overflow: 'hidden',
}
