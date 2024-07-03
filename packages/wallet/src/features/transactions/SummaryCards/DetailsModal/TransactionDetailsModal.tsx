import dayjs from 'dayjs'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  ContextMenu,
  Flex,
  MenuContentItem,
  Separator,
  Text,
  TouchableArea,
  isWeb,
  useIsDarkMode,
} from 'ui/src'
import { CopySheets, HelpCenter, TripleDots, UniswapX } from 'ui/src/components/icons'
import { UNIVERSE_CHAIN_LOGO } from 'uniswap/src/assets/chainLogos'
import { BottomSheetModal } from 'uniswap/src/components/modals/BottomSheetModal'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { Routing } from 'wallet/src/data/tradingApi/__generated__/index'
import { AssetType } from 'wallet/src/entities/assets'
import { AuthTrigger } from 'wallet/src/features/auth/types'
import { FORMAT_DATE_TIME_MEDIUM, useFormattedDateTime } from 'wallet/src/features/language/localizedDayjs'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'wallet/src/features/notifications/types'
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
import { useTransactionActionsCancelModals } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/useTransactionActionsCancelModals'
import {
  getTransactionId,
  openSupportLink,
} from 'wallet/src/features/transactions/SummaryCards/SummaryItems/TransactionActionsModal'
import { getTransactionSummaryTitle } from 'wallet/src/features/transactions/SummaryCards/utils'
import { TransactionDetails, TransactionTypeInfo } from 'wallet/src/features/transactions/types'
import { useAppDispatch } from 'wallet/src/state'
import { setClipboard } from 'wallet/src/utils/clipboard'
import { openTransactionLink } from 'wallet/src/utils/linking'

type TransactionDetailsModalProps = {
  authTrigger?: AuthTrigger
  onClose: () => void
  transactionDetails: TransactionDetails
}

export function TransactionDetailsHeader({
  authTrigger,
  onClose,
  transactionDetails,
}: TransactionDetailsModalProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const isDarkMode = useIsDarkMode()

  const { openActionsModal, renderModals } = useTransactionActionsCancelModals({
    authTrigger,
    onNavigateAway: onClose,
    transaction: transactionDetails,
  })

  const dateString = useFormattedDateTime(dayjs(transactionDetails.addedTime), FORMAT_DATE_TIME_MEDIUM)
  const title = getTransactionSummaryTitle(transactionDetails, t)
  const chainInfo = UNIVERSE_CHAIN_INFO[transactionDetails.chainId]
  const chainLogo = UNIVERSE_CHAIN_LOGO[transactionDetails.chainId].explorer

  const menuContent = useMemo(() => {
    const items: MenuContentItem[] = []

    if (transactionDetails.hash) {
      items.push({
        label: t('transaction.action.viewEtherscan', { blockExplorerName: chainInfo.explorer.name }),
        textProps: { variant: 'body2' },
        onPress: () => openTransactionLink(transactionDetails.hash, transactionDetails.chainId),
        Icon: isDarkMode ? chainLogo.logoDark : chainLogo.logoLight,
      })
    }

    const transactionId = getTransactionId(transactionDetails)
    if (transactionId) {
      items.push({
        label: t('transaction.action.copy'),
        textProps: { variant: 'body2' },
        onPress: async () => {
          await setClipboard(transactionId)
          dispatch(
            pushNotification({
              type: AppNotificationType.Copied,
              copyType: CopyNotificationType.TransactionId,
            }),
          )
        },
        Icon: CopySheets,
      })

      items.push({
        label: t('settings.action.help'),
        textProps: { variant: 'body2' },
        onPress: async (): Promise<void> => {
          await openSupportLink(transactionDetails)
        },
        Icon: HelpCenter,
      })
    }

    return items
  }, [dispatch, t, transactionDetails, chainInfo, chainLogo, isDarkMode])

  return (
    <>
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
          <ContextMenu closeOnClick itemId={transactionDetails.id} menuOptions={menuContent} onLeftClick>
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
      {renderModals()}
    </>
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

  return (
    <BottomSheetModal isDismissible alignment="top" name={ModalName.TransactionDetails} onClose={onClose}>
      <Flex gap="$spacing12" pb={isWeb ? '$none' : '$spacing12'} px={isWeb ? '$none' : '$spacing24'}>
        <TransactionDetailsHeader authTrigger={authTrigger} transactionDetails={transactionDetails} onClose={onClose} />
        {!hideTopSeparator && <Separator />}
        <TransactionDetailsContent transactionDetails={transactionDetails} onClose={onClose} />
        {!hideBottomSeparator && <Separator />}
        <TransactionDetailsInfoRows transactionDetails={transactionDetails} />
        {isWeb && (
          <Button size="small" theme="secondary" onPress={onClose}>
            {t('common.button.close')}
          </Button>
        )}
      </Flex>
    </BottomSheetModal>
  )
}
