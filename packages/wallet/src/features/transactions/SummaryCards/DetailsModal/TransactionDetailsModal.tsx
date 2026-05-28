import dayjs from 'dayjs'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Separator, Text, TouchableArea, isWeb } from 'ui/src'
import { AnglesDownUp, Ellipsis, SortVertical, UniswapX } from 'ui/src/components/icons'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { AssetType } from 'uniswap/src/entities/assets'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { AuthTrigger } from 'uniswap/src/features/auth/types'
import { FORMAT_DATE_TIME_MEDIUM, useFormattedDateTime } from 'uniswap/src/features/language/localizedDayjs'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import {
  TransactionDetails,
  TransactionType,
  TransactionTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { ContextMenu } from 'wallet/src/components/menu/ContextMenu'
import { ApproveTransactionDetails } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/ApproveTransactionDetails'
import { BridgeTransactionDetails } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/BridgeTransactionDetails'
import { HeaderLogo } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/HeaderLogo'
import { NftTransactionDetails } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/NftTransactionDetails'
import { OffRampPendingSupportCard } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/OffRampPendingSupportCard'
import { OffRampTransactionDetails } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/OffRampTransactionDetails'
import { OnRampTransactionDetails } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/OnRampTransactionDetails'
import { SwapTransactionDetails } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/SwapTransactionDetails'
import { TransactionDetailsInfoRows } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/TransactionDetailsInfoRows'
import { TransferTransactionDetails } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/TransferTransactionDetails'
import { WrapTransactionDetails } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/WrapTransactionDetails'
import {
  isApproveTransactionInfo,
  isBridgeTransactionInfo,
  isNFTApproveTransactionInfo,
  isNFTMintTransactionInfo,
  isNFTTradeTransactionInfo,
  isOffRampSaleTransactionInfo,
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
import { getIsCancelable } from 'wallet/src/features/transactions/utils'
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
      <Flex centered row gap="$spacing12" flexShrink={1}>
        <HeaderLogo transactionDetails={transactionDetails} />
        <Flex flexDirection="column" flexShrink={1}>
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
      {menuItems.length > 0 ? (
        isWeb ? (
          <ContextMenu closeOnClick itemId={transactionDetails.id} menuOptions={menuItems} onLeftClick>
            <TouchableArea hoverable borderRadius="$roundedFull" p="$spacing4">
              <Ellipsis color="$neutral2" size="$icon.20" />
            </TouchableArea>
          </ContextMenu>
        ) : (
          <TouchableArea flexGrow={0} ml="$spacing12" onPress={openActionsModal}>
            <Ellipsis color="$neutral2" size="$icon.20" />
          </TouchableArea>
        )
      ) : null}
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
    } else if (isBridgeTransactionInfo(typeInfo)) {
      return <BridgeTransactionDetails typeInfo={typeInfo} onClose={onClose} />
    } else if (isSwapTransactionInfo(typeInfo)) {
      return <SwapTransactionDetails typeInfo={typeInfo} onClose={onClose} />
    } else if (isWCConfirmTransactionInfo(typeInfo)) {
      return <></>
    } else if (isWrapTransactionInfo(typeInfo)) {
      return <WrapTransactionDetails transactionDetails={transactionDetails} typeInfo={typeInfo} onClose={onClose} />
    } else if (isOnRampPurchaseTransactionInfo(typeInfo) || isOnRampTransferTransactionInfo(typeInfo)) {
      return <OnRampTransactionDetails transactionDetails={transactionDetails} typeInfo={typeInfo} onClose={onClose} />
    } else if (isOffRampSaleTransactionInfo(typeInfo)) {
      return <OffRampTransactionDetails transactionDetails={transactionDetails} typeInfo={typeInfo} onClose={onClose} />
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
  const { typeInfo, status, addedTime } = transactionDetails
  const [isShowingMore, setIsShowingMore] = useState(false)
  const hasMoreInfoRows = [TransactionType.Swap, TransactionType.Bridge].includes(transactionDetails.typeInfo.type)

  // Hide both separators if it's an Nft transaction. Hide top separator if it's an unknown type transaction.
  const isNftTransaction = isNFTActivity(typeInfo)
  const hideTopSeparator = isNftTransaction || isUnknownTransactionInfo(typeInfo)
  const hideBottomSeparator = isNftTransaction

  const { type } = useActiveAccountWithThrow()
  const readonly = type === AccountType.Readonly
  const isCancelable = !readonly && getIsCancelable(transactionDetails)

  const transactionActions = useTransactionActions({
    authTrigger,
    transaction: transactionDetails,
  })

  const { openCancelModal, renderModals } = transactionActions

  const buttons: JSX.Element[] = []
  if (isCancelable) {
    buttons.push(
      <Flex key="cancel" row>
        <Button variant="critical" emphasis="secondary" onPress={openCancelModal}>
          {t('transaction.action.cancel.button')}
        </Button>
      </Flex>,
    )
  }
  if (isWeb) {
    buttons.push(
      <Flex key="close" row>
        <Button emphasis="secondary" onPress={onClose}>
          {t('common.button.close')}
        </Button>
      </Flex>,
    )
  }

  const OFFRAMP_PENDING_STALE_TIME_IN_MINUTES = 20
  const isTransactionStale = dayjs().diff(dayjs(addedTime), 'minute') >= OFFRAMP_PENDING_STALE_TIME_IN_MINUTES
  const showOffRampPendingCard = isOffRampSaleTransactionInfo(typeInfo) && status === 'pending' && isTransactionStale

  return (
    <>
      <Modal isDismissible alignment="top" name={ModalName.TransactionDetails} onClose={onClose}>
        <Flex gap="$spacing12" pb={isWeb ? '$none' : '$spacing12'} px={isWeb ? '$none' : '$spacing24'}>
          <TransactionDetailsHeader transactionActions={transactionActions} transactionDetails={transactionDetails} />
          {!hideTopSeparator && <Separator />}
          <TransactionDetailsContent transactionDetails={transactionDetails} onClose={onClose} />
          {!hideBottomSeparator && hasMoreInfoRows && (
            <ShowMoreSeparator isShowingMore={isShowingMore} setIsShowingMore={setIsShowingMore} />
          )}
          {!hideBottomSeparator && !hasMoreInfoRows && <Separator />}
          <TransactionDetailsInfoRows
            isShowingMore={isShowingMore}
            transactionDetails={transactionDetails}
            pt={!hideBottomSeparator && !hasMoreInfoRows ? '$spacing8' : undefined}
            onClose={onClose}
          />
          {showOffRampPendingCard && <OffRampPendingSupportCard />}
          {buttons.length > 0 && (
            <Flex gap="$spacing8" pt="$spacing8">
              {buttons}
            </Flex>
          )}
        </Flex>
      </Modal>
      {renderModals()}
    </>
  )
}

function ShowMoreSeparator({
  isShowingMore,
  setIsShowingMore,
}: {
  isShowingMore: boolean
  setIsShowingMore: (showMore: boolean) => void
}): JSX.Element {
  const { t } = useTranslation()

  const onPressShowMore = (): void => {
    setIsShowingMore(!isShowingMore)
  }

  return (
    <Flex centered row gap="$spacing16">
      <Separator />
      <TouchableArea onPress={onPressShowMore}>
        <Flex centered row gap="$spacing4">
          <Text color="$neutral3" variant="body4">
            {isShowingMore ? t('common.button.showLess') : t('common.button.showMore')}
          </Text>
          {isShowingMore ? (
            <AnglesDownUp color="$neutral3" size="$icon.16" />
          ) : (
            <SortVertical color="$neutral3" size="$icon.16" />
          )}
        </Flex>
      </TouchableArea>
      <Separator />
    </Flex>
  )
}
