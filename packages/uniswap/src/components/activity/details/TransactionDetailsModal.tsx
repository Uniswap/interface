import { TradingApi } from '@universe/api'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Separator, Text, TouchableArea } from 'ui/src'
import { AnglesDownUp } from 'ui/src/components/icons/AnglesDownUp'
import { Ellipsis } from 'ui/src/components/icons/Ellipsis'
import { SortVertical } from 'ui/src/components/icons/SortVertical'
import { UniswapX } from 'ui/src/components/icons/UniswapX'
import { TransactionDetailsHeaderLogo } from 'uniswap/src/components/activity/details/TransactionDetailsHeaderLogo'
import { TransactionDetailsInfoRows } from 'uniswap/src/components/activity/details/TransactionDetailsInfoRows'
import { ApproveTransactionDetails } from 'uniswap/src/components/activity/details/transactions/ApproveTransactionDetails'
import { BridgeTransactionDetails } from 'uniswap/src/components/activity/details/transactions/BridgeTransactionDetails'
import { LiquidityTransactionDetails } from 'uniswap/src/components/activity/details/transactions/LiquidityTransactionDetails'
import { NftTransactionDetails } from 'uniswap/src/components/activity/details/transactions/NftTransactionDetails'
import { OffRampPendingSupportCard } from 'uniswap/src/components/activity/details/transactions/OffRampPendingSupportCard'
import { OffRampTransactionDetails } from 'uniswap/src/components/activity/details/transactions/OffRampTransactionDetails'
import { OnRampTransactionDetails } from 'uniswap/src/components/activity/details/transactions/OnRampTransactionDetails'
import { SwapTransactionDetails } from 'uniswap/src/components/activity/details/transactions/SwapTransactionDetails'
import { TransferTransactionDetails } from 'uniswap/src/components/activity/details/transactions/TransferTransactionDetails'
import { WrapTransactionDetails } from 'uniswap/src/components/activity/details/transactions/WrapTransactionDetails'
import {
  isOffRampSaleTransactionInfo,
  isReceiveTokenTransactionInfo,
  isSendTokenTransactionInfo,
  isUnknownTransactionInfo,
} from 'uniswap/src/components/activity/details/types'
import { ContextMenu, MenuOptionItem } from 'uniswap/src/components/menus/ContextMenuV2'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { AssetType } from 'uniswap/src/entities/assets'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useTransactionActions } from 'uniswap/src/features/activity/hooks/useTransactionActions'
import { getTransactionSummaryTitle } from 'uniswap/src/features/activity/utils/getTransactionSummaryTitle'
import { AuthTrigger } from 'uniswap/src/features/auth/types'
import { FORMAT_DATE_TIME_MEDIUM, useFormattedDateTime } from 'uniswap/src/features/language/localizedDayjs'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useIsCancelable } from 'uniswap/src/features/transactions/hooks/useIsCancelable'
import {
  TransactionDetails,
  TransactionType,
  TransactionTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { isExtensionApp, isWebPlatform } from 'utilities/src/platform'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

type TransactionDetailsModalProps = {
  isExternalProfile?: boolean
  transactionDetails: TransactionDetails
  authTrigger?: AuthTrigger
  onClose: () => void
  onReportSuccess?: () => void
  onUnhideTransaction?: () => void
}

export function TransactionDetailsHeader({
  transactionDetails,
  transactionActions,
  hideTransactionActions = false,
}: {
  transactionDetails: TransactionDetails
  transactionActions: MenuOptionItem[]
  hideTransactionActions?: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const { value: isContextMenuOpen, setTrue: openContextMenu, setFalse: closeContextMenu } = useBooleanState(false)
  const showTransactionActions = transactionActions.length > 0 && !hideTransactionActions

  const dateString = useFormattedDateTime(dayjs(transactionDetails.addedTime), FORMAT_DATE_TIME_MEDIUM)
  const title = getTransactionSummaryTitle(transactionDetails, t)

  return (
    <Flex centered row justifyContent="space-between">
      <Flex centered row gap="$spacing12" flexShrink={1}>
        <Flex>
          <TransactionDetailsHeaderLogo transactionDetails={transactionDetails} />
        </Flex>
        <Flex flexDirection="column" flexShrink={1}>
          <Flex centered row gap="$spacing4" justifyContent="flex-start">
            {(transactionDetails.routing === TradingApi.Routing.DUTCH_V2 ||
              transactionDetails.routing === TradingApi.Routing.DUTCH_LIMIT) && <UniswapX size="$icon.16" />}
            <Text variant="body2">{title}</Text>
          </Flex>
          <Text color="$neutral2" variant="body4">
            {dateString}
          </Text>
        </Flex>
      </Flex>
      {showTransactionActions && (
        <ContextMenu
          menuItems={transactionActions}
          triggerMode={ContextMenuTriggerMode.Primary}
          isOpen={isContextMenuOpen}
          closeMenu={closeContextMenu}
        >
          <TouchableArea borderRadius="$roundedFull" p="$spacing4" onPress={openContextMenu}>
            <Ellipsis color="$neutral2" size="$icon.20" />
          </TouchableArea>
        </ContextMenu>
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

  // eslint-disable-next-line complexity
  const getContentComponent = (): JSX.Element | null => {
    switch (typeInfo.type) {
      case TransactionType.Approve:
      case TransactionType.Permit2Approve:
        return (
          <ApproveTransactionDetails transactionDetails={transactionDetails} typeInfo={typeInfo} onClose={onClose} />
        )
      case TransactionType.NFTApprove:
      case TransactionType.NFTMint:
      case TransactionType.NFTTrade:
        return <NftTransactionDetails transactionDetails={transactionDetails} typeInfo={typeInfo} onClose={onClose} />
      case TransactionType.Receive:
      case TransactionType.Send:
        return (
          <TransferTransactionDetails transactionDetails={transactionDetails} typeInfo={typeInfo} onClose={onClose} />
        )
      case TransactionType.Bridge:
        return <BridgeTransactionDetails typeInfo={typeInfo} onClose={onClose} />
      case TransactionType.Swap:
        return <SwapTransactionDetails typeInfo={typeInfo} onClose={onClose} />
      case TransactionType.WCConfirm:
        return <></>
      case TransactionType.Wrap:
        return <WrapTransactionDetails transactionDetails={transactionDetails} typeInfo={typeInfo} onClose={onClose} />
      case TransactionType.OnRampPurchase:
      case TransactionType.OnRampTransfer:
        return (
          <OnRampTransactionDetails transactionDetails={transactionDetails} typeInfo={typeInfo} onClose={onClose} />
        )
      case TransactionType.OffRampSale:
        return (
          <OffRampTransactionDetails transactionDetails={transactionDetails} typeInfo={typeInfo} onClose={onClose} />
        )
      case TransactionType.LiquidityDecrease:
      case TransactionType.LiquidityIncrease:
      case TransactionType.CollectFees:
      case TransactionType.CreatePair:
      case TransactionType.CreatePool:
      case TransactionType.MigrateLiquidityV3ToV4:
        return <LiquidityTransactionDetails typeInfo={typeInfo} onClose={onClose} />
      default:
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
    [TransactionType.NFTApprove, TransactionType.NFTMint, TransactionType.NFTTrade].includes(typeInfo.type)
  return isNft
}

// eslint-disable-next-line complexity
export function TransactionDetailsModal({
  isExternalProfile = false,
  transactionDetails,
  authTrigger,
  onClose,
  onReportSuccess,
  onUnhideTransaction,
}: TransactionDetailsModalProps): JSX.Element {
  const { t } = useTranslation()
  const { typeInfo, status, addedTime } = transactionDetails
  const [isShowingMore, setIsShowingMore] = useState(false)
  const hasMoreInfoRows = [TransactionType.Swap, TransactionType.Bridge].includes(transactionDetails.typeInfo.type)

  // Hide both separators if it's an Nft transaction. Hide top separator if it's an unknown type transaction.
  const isNftTransaction = isNFTActivity(typeInfo)
  const hideTopSeparator = isNftTransaction || isUnknownTransactionInfo(typeInfo)
  const hideBottomSeparator = isNftTransaction

  const { evmAccount } = useWallet()
  const readonly = evmAccount?.accountType === AccountType.Readonly
  const isCancelable = useIsCancelable(transactionDetails) && !readonly

  const hideTransactionActions = readonly || isExternalProfile
  const transactionActions = useTransactionActions({
    transaction: transactionDetails,
    authTrigger,
    onClose,
    onReportSuccess,
    onUnhideTransaction,
  })

  const { openCancelModal, renderModals, menuItems } = transactionActions

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
  if (isWebPlatform) {
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

  const detailsContent = useMemo((): JSX.Element | null => {
    return <TransactionDetailsContent transactionDetails={transactionDetails} onClose={onClose} />
  }, [transactionDetails, onClose])

  return (
    <>
      <Modal
        isDismissible
        alignment={isExtensionApp ? 'top' : 'center'}
        name={ModalName.TransactionDetails}
        onClose={onClose}
      >
        <Flex gap="$spacing12" pb={isWebPlatform ? '$none' : '$spacing12'} px={isWebPlatform ? '$none' : '$spacing24'}>
          <TransactionDetailsHeader
            hideTransactionActions={hideTransactionActions}
            transactionActions={menuItems}
            transactionDetails={transactionDetails}
          />
          {!hideTopSeparator && <Separator />}
          {detailsContent}
          {!hideBottomSeparator && detailsContent !== null && hasMoreInfoRows && (
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
