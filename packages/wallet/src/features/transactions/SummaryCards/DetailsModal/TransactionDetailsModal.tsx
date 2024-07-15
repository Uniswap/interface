import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Separator, Text, TouchableArea } from 'ui/src'
import { CopyAlt, TripleDots } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { BottomSheetModal } from 'uniswap/src/components/modals/BottomSheetModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { AuthTrigger } from 'wallet/src/features/auth/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import {
  FORMAT_DATE_TIME_MEDIUM,
  useFormattedDateTime,
} from 'wallet/src/features/language/localizedDayjs'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'wallet/src/features/notifications/types'
import { useCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'
import { HeaderLogo } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/HeaderLogo'
import { SwapTransactionDetails } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/SwapTransactionDetails'
import {
  isApproveTransactionInfo,
  isFiatPurchaseTransactionInfo,
  isNFTApproveTransactionInfo,
  isNFTMintTransactionInfo,
  isNFTTradeTransactionInfo,
  isReceiveTokenTransactionInfo,
  isSendTokenTransactionInfo,
  isSwapTransactionInfo,
  isWCConfirmTransactionInfo,
  isWrapTransactionInfo,
} from 'wallet/src/features/transactions/SummaryCards/DetailsModal/types'
import { useTransactionActionsCancelModals } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/useTransactionActionsCancelModals'
import { useFormattedCurrencyAmountAndUSDValue } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/utils'
import { getTransactionSummaryTitle } from 'wallet/src/features/transactions/SummaryCards/utils'
import { TransactionDetails } from 'wallet/src/features/transactions/types'
import { useAppDispatch } from 'wallet/src/state'
import { setClipboard } from 'wallet/src/utils/clipboard'
import { buildCurrencyId } from 'wallet/src/utils/currencyId'
import { ValueType } from 'wallet/src/utils/getCurrencyAmount'

type TransactionDetailsModalProps = {
  authTrigger?: AuthTrigger
  onClose: () => void
  transactionDetails: TransactionDetails
}

const TransactionDetailsHeader = ({
  authTrigger,
  onClose,
  transactionDetails,
}: TransactionDetailsModalProps): JSX.Element => {
  const { t } = useTranslation()

  const { openActionsModal, renderModals } = useTransactionActionsCancelModals({
    authTrigger,
    onNavigateAway: onClose,
    transaction: transactionDetails,
  })

  const dateString = useFormattedDateTime(
    dayjs(transactionDetails.addedTime),
    FORMAT_DATE_TIME_MEDIUM
  )
  const title = getTransactionSummaryTitle(transactionDetails, t)

  return (
    <>
      <Flex centered row justifyContent="space-between">
        <Flex centered row gap="$spacing12">
          <HeaderLogo transactionDetails={transactionDetails} />
          <Flex flexDirection="column">
            <Text variant="body2">{title}</Text>
            <Text variant="body4">{dateString}</Text>
          </Flex>
        </Flex>
        <TouchableArea onPress={openActionsModal}>
          <TripleDots color="$neutral2" size="$icon.24" />
        </TouchableArea>
      </Flex>
      {renderModals()}
    </>
  )
}

const TransactionDetailsContent = ({
  transactionDetails,
}: {
  transactionDetails: TransactionDetails
}): JSX.Element => {
  const { typeInfo } = transactionDetails

  const getContentComponent = (): JSX.Element => {
    if (isApproveTransactionInfo(typeInfo)) {
      return <></>
    } else if (isFiatPurchaseTransactionInfo(typeInfo)) {
      return <></>
    } else if (isNFTApproveTransactionInfo(typeInfo)) {
      return <></>
    } else if (isNFTMintTransactionInfo(typeInfo)) {
      return <></>
    } else if (isNFTTradeTransactionInfo(typeInfo)) {
      return <></>
    } else if (isReceiveTokenTransactionInfo(typeInfo)) {
      return <></>
    } else if (isSendTokenTransactionInfo(typeInfo)) {
      return <></>
    } else if (isSwapTransactionInfo(typeInfo)) {
      return <SwapTransactionDetails typeInfo={typeInfo} />
    } else if (isWCConfirmTransactionInfo(typeInfo)) {
      return <></>
    } else if (isWrapTransactionInfo(typeInfo)) {
      return <></>
    } else {
      return <></>
    }
  }

  return (
    <Flex flexDirection="column" p="$spacing8">
      {getContentComponent()}
    </Flex>
  )
}

const TransactionDetailsInfoRows = ({
  transactionDetails,
}: {
  transactionDetails: TransactionDetails
}): JSX.Element => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { value: networkFeeValue } = useNetworkFee(transactionDetails)

  const onPressCopy = async (): Promise<void> => {
    if (!transactionDetails.hash) {
      return
    }

    await setClipboard(transactionDetails.hash)
    dispatch(
      pushNotification({
        type: AppNotificationType.Copied,
        copyType: CopyNotificationType.TransactionId,
      })
    )
  }

  return (
    <Flex p="$spacing8">
      <Flex centered row justifyContent="space-between" py="$spacing4">
        <Text variant="body4">{t('transaction.details.networkFee')}</Text>
        <Flex row gap="$spacing4">
          <NetworkLogo chainId={transactionDetails.chainId} size={iconSizes.icon16} />
          <Text variant="body4">{networkFeeValue}</Text>
        </Flex>
      </Flex>
      <Flex centered row justifyContent="space-between">
        <Text variant="body4">{t('transaction.details.transactionId')}</Text>
        <Flex row gap="$spacing4">
          <Text variant="body4">{shortenHash(transactionDetails.hash)}</Text>
          <TouchableArea onPress={onPressCopy}>
            <CopyAlt color="$neutral3" size="$icon.16" />
          </TouchableArea>
        </Flex>
      </Flex>
    </Flex>
  )
}

export const TransactionDetailsModal = ({
  authTrigger,
  onClose,
  transactionDetails,
}: TransactionDetailsModalProps): JSX.Element => {
  const { t } = useTranslation()
  return (
    <BottomSheetModal
      hideHandlebar
      isDismissible
      alignment="top"
      name={ModalName.TransactionDetails}
      onClose={onClose}>
      <Flex gap="$spacing12" px="$spacing12">
        <TransactionDetailsHeader
          authTrigger={authTrigger}
          transactionDetails={transactionDetails}
          onClose={onClose}
        />
        <Separator />
        <TransactionDetailsContent transactionDetails={transactionDetails} />
        <Separator />
        <TransactionDetailsInfoRows transactionDetails={transactionDetails} />
        <Button size="small" theme="secondary" onPress={onClose}>
          <Text>{t('common.button.close')}</Text>
        </Button>
      </Flex>
    </BottomSheetModal>
  )
}

function shortenHash(hash: string | undefined, chars: NumberRange<1, 20> = 4): string {
  if (!hash) {
    return ''
  }
  return `${hash.substring(0, chars + 2)}...${hash.substring(hash.length - chars)}`
}

function useNetworkFee(transactionDetails: TransactionDetails): {
  value: string
  amount: string
} {
  const formatter = useLocalizationContext()

  const currencyId = transactionDetails.networkFee
    ? buildCurrencyId(transactionDetails.chainId, transactionDetails.networkFee.tokenAddress)
    : undefined
  const currencyInfo = useCurrencyInfo(currencyId)

  return useFormattedCurrencyAmountAndUSDValue({
    currency: currencyInfo?.currency,
    currencyAmountRaw: transactionDetails.networkFee?.quantity,
    valueType: ValueType.Exact,
    formatter,
    isApproximateAmount: false,
  })
}
