import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { Button, ContextMenu, Flex, Separator, Text, TouchableArea, isWeb } from 'ui/src'
import { TripleDots, UniswapX } from 'ui/src/components/icons'
import { BottomSheetModal } from 'uniswap/src/components/modals/BottomSheetModal'
import { AssetType } from 'uniswap/src/entities/assets'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { Routing } from 'wallet/src/data/tradingApi/__generated__/index'
import { AuthTrigger } from 'wallet/src/features/auth/types'
import { FORMAT_DATE_TIME_MEDIUM, useFormattedDateTime } from 'wallet/src/features/language/localizedDayjs'
import { ApproveTransactionDetails } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/ApproveTransactionDetails'
import { HeaderLogo } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/HeaderLogo'
import { NftTransactionDetails } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/NftTransactionDetails'
import { OnRampTransactionDetails } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/OnRampTransactionDetails'
import { SwapTransactionDetails } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/SwapTransactionDetails'
import { TransactionDetailsInfoRows } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/TransactionDetailsInfoRows'
import { TransferTransactionDetails } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/TransferTransactionDetails'
import { WrapTransactionDetails } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/WrapTransactionDetails'
import {
  isApproveTransactionInfo,
  isFiatPurchaseTransactionInfo,
  isNFTApproveTransactionInfo,
  isNFTMintTransactionInfo,
  isNFTTradeTransactionInfo,
  isOnRampPurchaseTransactionInfo,
  isOnRampTransferTransactionInfo,
  isReceiveTokenTransactionInfo,
  isSendTokenTransactionInfo,
  isSwapTransactionInfo,
  isUnknownTransactionInfo,
  isWCConfirmTransactionInfo,
  isWrapTransactionInfo,
} from 'wallet/src/features/transactions/SummaryCards/DetailsModal/types'
import { useTransactionActions } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/useTransactionActions'
import { getTransactionSummaryTitle } from 'wallet/src/features/transactions/SummaryCards/utils'
import { TransactionDetails, TransactionTypeInfo } from 'wallet/src/features/transactions/types'
import { getIsCancelable } from 'wallet/src/features/transactions/utils'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

type TransactionDetailsModalProps = {
  authTrigger?: AuthTrigger
  onClose: () => void
  transactionDetails: TransactionDetails
}

export function TransactionDetailsHeader({
  transactionDetails,
  transactionActions,
}: {
  transactionDetails: TransactionDetails
  transactionActions: ReturnType<typeof useTransactionActions>
}): JSX.Element {
  const { t } = useTranslation()

  const dateString = useFormattedDateTime(dayjs(transactionDetails.addedTime), FORMAT_DATE_TIME_MEDIUM)
  const title = getTransactionSummaryTitle(transactionDetails, t)

  const { menuItems, openActionsModal } = transactionActions

  return (
    <Flex centered row justifyContent="space-between">
      <Flex centered row gap="$spacing12">
        <HeaderLogo transactionDetails={transactionDetails} />
        <Flex flexDirection="column">
          <Flex centered row gap="$spacing4" justifyContent="flex-start">
            {(transactionDetails.routing === Routing.DUTCH_V2 ||
              transactionDetails.routing === Routing.DUTCH_LIMIT) && <UniswapX size="$icon.16" />}
            <Text variant="body2">{title}</Text>
          </Flex>
          <Text color="$neutral2" variant="body4">
            {dateString}
          </Text>
        </Flex>
      </Flex>
      {isWeb ? (
        <ContextMenu closeOnClick itemId={transactionDetails.id} menuOptions={menuItems} onLeftClick>
          <TouchableArea hoverable borderRadius="$roundedFull" p="$spacing4">
            <TripleDots color="$neutral2" size="$icon.20" />
          </TouchableArea>
        </ContextMenu>
      ) : (
        <TouchableArea onPress={openActionsModal}>
          <TripleDots color="$neutral2" size="$icon.20" />
        </TouchableArea>
      )}
    </Flex>
  )
}

export function TransactionDetailsContent({
  transactionDetails,
  onClose,
}: {
  transactionDetails: TransactionDetails
  onClose: () => void
}): JSX.Element | null {
  const { typeInfo } = transactionDetails

  const getContentComponent = (): JSX.Element | null => {
    if (isApproveTransactionInfo(typeInfo)) {
      return <ApproveTransactionDetails transactionDetails={transactionDetails} typeInfo={typeInfo} onClose={onClose} />
    } else if (isFiatPurchaseTransactionInfo(typeInfo)) {
      return <></>
    } else if (isNFTApproveTransactionInfo(typeInfo)) {
      return <NftTransactionDetails transactionDetails={transactionDetails} typeInfo={typeInfo} onClose={onClose} />
    } else if (isNFTMintTransactionInfo(typeInfo)) {
      return <NftTransactionDetails transactionDetails={transactionDetails} typeInfo={typeInfo} onClose={onClose} />
    } else if (isNFTTradeTransactionInfo(typeInfo)) {
      return <NftTransactionDetails transactionDetails={transactionDetails} typeInfo={typeInfo} onClose={onClose} />
    } else if (isReceiveTokenTransactionInfo(typeInfo) || isSendTokenTransactionInfo(typeInfo)) {
      return (
        <TransferTransactionDetails transactionDetails={transactionDetails} typeInfo={typeInfo} onClose={onClose} />
      )
    } else if (isSwapTransactionInfo(typeInfo)) {
      return <SwapTransactionDetails typeInfo={typeInfo} onClose={onClose} />
    } else if (isWCConfirmTransactionInfo(typeInfo)) {
      return <></>
    } else if (isWrapTransactionInfo(typeInfo)) {
      return <WrapTransactionDetails transactionDetails={transactionDetails} typeInfo={typeInfo} onClose={onClose} />
    } else if (isOnRampPurchaseTransactionInfo(typeInfo) || isOnRampTransferTransactionInfo(typeInfo)) {
      return <OnRampTransactionDetails transactionDetails={transactionDetails} typeInfo={typeInfo} onClose={onClose} />
    } else {
      return null
    }
  }

  const contentComponent = getContentComponent()
  if (contentComponent === null) {
    return null
  }
  return <Flex>{contentComponent}</Flex>
}

const isNFTActivity = (typeInfo: TransactionTypeInfo): boolean => {
  const isTransferNft =
    (isReceiveTokenTransactionInfo(typeInfo) || isSendTokenTransactionInfo(typeInfo)) &&
    typeInfo.assetType !== AssetType.Currency
  const isNft =
    isTransferNft ||
    isNFTApproveTransactionInfo(typeInfo) ||
    isNFTMintTransactionInfo(typeInfo) ||
    isNFTTradeTransactionInfo(typeInfo)
  return isNft
}

export function TransactionDetailsModal({
  authTrigger,
  onClose,
  transactionDetails,
}: TransactionDetailsModalProps): JSX.Element {
  const { t } = useTranslation()
  const { typeInfo } = transactionDetails

  // Hide both separators if it's an Nft transaction. Hide top separator if it's an unknown type transaction.
  const isNftTransaction = isNFTActivity(typeInfo)
  const hideTopSeparator = isNftTransaction || isUnknownTransactionInfo(typeInfo)
  const hideBottomSeparator = isNftTransaction

  const { type } = useActiveAccountWithThrow()
  const readonly = type === AccountType.Readonly
  const isCancelable = !readonly && getIsCancelable(transactionDetails)

  const transactionActions = useTransactionActions({
    authTrigger,
    onNavigateAway: onClose,
    transaction: transactionDetails,
  })

  const { openCancelModal, renderModals } = transactionActions

  const buttons: JSX.Element[] = []
  if (isCancelable) {
    buttons.push(
      <Button
        backgroundColor="$DEP_accentCriticalSoft"
        color="$statusCritical"
        size="small"
        theme="secondary"
        onPress={openCancelModal}
      >
        {t('transaction.action.cancel.button')}
      </Button>,
    )
  }
  if (isWeb) {
    buttons.push(
      <Button size="small" theme="secondary" onPress={onClose}>
        {t('common.button.close')}
      </Button>,
    )
  }

  return (
    <>
      <BottomSheetModal isDismissible alignment="top" name={ModalName.TransactionDetails} onClose={onClose}>
        <Flex gap="$spacing12" pb={isWeb ? '$none' : '$spacing12'} px={isWeb ? '$none' : '$spacing24'}>
          <TransactionDetailsHeader transactionActions={transactionActions} transactionDetails={transactionDetails} />
          {!hideTopSeparator && <Separator />}
          <TransactionDetailsContent transactionDetails={transactionDetails} onClose={onClose} />
          {!hideBottomSeparator && <Separator />}
          <TransactionDetailsInfoRows transactionDetails={transactionDetails} />
          {buttons.length > 0 && (
            <Flex gap="$spacing8" pt="$spacing8">
              {buttons}
            </Flex>
          )}
        </Flex>
      </BottomSheetModal>
      {renderModals()}
    </>
  )
}
