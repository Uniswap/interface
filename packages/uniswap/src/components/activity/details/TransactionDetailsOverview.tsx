import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Separator, Text, TouchableArea } from 'ui/src'
import { AnglesDownUp } from 'ui/src/components/icons/AnglesDownUp'
import { SortVertical } from 'ui/src/components/icons/SortVertical'
import { ResumePlanButton } from 'uniswap/src/components/activity/details/plan/ResumePlanButton'
import { TransactionDetailsContent } from 'uniswap/src/components/activity/details/TransactionDetailsContent'
import { TransactionDetailsHeader } from 'uniswap/src/components/activity/details/TransactionDetailsHeader'
import { TransactionDetailsInfoRows } from 'uniswap/src/components/activity/details/TransactionDetailsInfoRows'
import type { TransactionDetailsModalProps } from 'uniswap/src/components/activity/details/TransactionDetailsModal'
import { OffRampPendingSupportCard } from 'uniswap/src/components/activity/details/transactions/OffRampPendingSupportCard'
import { isOffRampSaleTransactionInfo, isUnknownTransactionInfo } from 'uniswap/src/components/activity/details/types'
import { isNFTActivity } from 'uniswap/src/components/activity/utils'
import { MenuOptionItem } from 'uniswap/src/components/menus/ContextMenu'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useIsCancelable } from 'uniswap/src/features/transactions/hooks/useIsCancelable'
import { useCanResumePlan } from 'uniswap/src/features/transactions/swap/plan/intermediaryState/useCanResumePlan'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { isWebPlatform } from 'utilities/src/platform'

export type TransactionDetailsOverviewProps = TransactionDetailsModalProps & {
  openPlanView: () => void
  openCancelModal: () => void
  menuItems: MenuOptionItem[]
}

// eslint-disable-next-line complexity
export function TransactionDetailsOverview({
  isExternalProfile = false,
  transactionDetails,
  openPlanView,
  openCancelModal,
  menuItems,
  onClose,
}: TransactionDetailsOverviewProps): JSX.Element {
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
  const canResumePlan = useCanResumePlan(typeInfo, status)
  const isCancelable = useIsCancelable(transactionDetails) && !readonly

  const hideTransactionActions = readonly || isExternalProfile

  const buttons: JSX.Element[] = []
  if (canResumePlan) {
    buttons.push(
      <Flex key="resume" row testID="resume-button">
        <ResumePlanButton typeInfo={typeInfo} onSuccess={onClose} />
      </Flex>,
    )
  }
  if (isCancelable) {
    buttons.push(
      <Flex key="cancel" row testID="cancel-button">
        <Button variant="critical" emphasis="secondary" onPress={openCancelModal}>
          {t('transaction.action.cancel.button')}
        </Button>
      </Flex>,
    )
  }
  if (isWebPlatform) {
    buttons.push(
      <Flex key="close" row testID="close-button">
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
        openPlanView={openPlanView}
        onClose={onClose}
      />
      {showOffRampPendingCard && <OffRampPendingSupportCard />}
      {buttons.length > 0 && (
        <Flex gap="$spacing8" pt="$spacing8">
          {buttons}
        </Flex>
      )}
    </Flex>
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
