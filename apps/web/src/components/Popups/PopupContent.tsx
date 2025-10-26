import { useQuery } from '@tanstack/react-query'
import { useOpenOffchainActivityModal } from 'components/AccountDrawer/MiniPortfolio/Activity/OffchainActivityModal'
import {
  getFORTransactionToActivityQueryOptions,
  getTransactionToActivityQueryOptions,
} from 'components/AccountDrawer/MiniPortfolio/Activity/parseLocal'
import { Activity } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import AlertTriangleFilled from 'components/Icons/AlertTriangleFilled'
import { LoaderV3 } from 'components/Icons/LoadingSpinner'
import { POPUP_MAX_WIDTH } from 'components/Popups/constants'
import { ToastRegularSimple } from 'components/Popups/ToastRegularSimple'
import { useIsRecentFlashblocksNotification } from 'hooks/useIsRecentFlashblocksNotification'
import { useTranslation } from 'react-i18next'
import { useTransaction, useUniswapXOrderByOrderHash } from 'state/transactions/hooks'
import { isPendingTx } from 'state/transactions/utils'
import { EllipsisTamaguiStyle } from 'theme/components/styles'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { BridgeIcon } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useIsSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FORTransaction } from 'uniswap/src/features/fiatOnRamp/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { isNonInstantFlashblockTransactionType } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/utils'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { noop } from 'utilities/src/react/noop'

export function FailedNetworkSwitchPopup({ chainId, onClose }: { chainId: UniverseChainId; onClose: () => void }) {
  const isSupportedChain = useIsSupportedChainId(chainId)
  const chainInfo = isSupportedChain ? getChainInfo(chainId) : undefined
  const { t } = useTranslation()

  if (!chainInfo) {
    return null
  }

  return (
    <ToastRegularSimple
      onDismiss={onClose}
      icon={<AlertTriangleFilled color="$yellow" size="32px" />}
      text={
        <Flex gap="$gap4" flexWrap="wrap" flex={1}>
          <Text variant="body4" color="$neutral1">
            {t('common.failedSwitchNetwork')}
          </Text>
          <Text variant="body4" color="$neutral2" flexWrap="wrap">
            {t('settings.switchNetwork.warning', { label: chainInfo.label })}
          </Text>
        </Flex>
      }
    />
  )
}

type ActivityPopupContentProps = { activity: Activity; onClick?: () => void; onClose: () => void }

function ActivityPopupContent({ activity, onClick, onClose }: ActivityPopupContentProps) {
  const success = activity.status === TransactionStatus.Success
  const pending = activity.status === TransactionStatus.Pending

  const showPortfolioLogo = success || pending || !!activity.offchainOrderDetails
  const colors = useSporeColors()

  const isBridgeActivity = activity.outputChainId && activity.chainId !== activity.outputChainId
  return (
    <Flex
      row
      width={POPUP_MAX_WIDTH}
      backgroundColor="$surface1"
      position="relative"
      borderWidth={1}
      borderRadius="$rounded16"
      borderColor="$surface3"
      py={2}
      px={0}
      animation="300ms"
      $sm={{
        mx: 'auto',
        width: '100%',
      }}
    >
      <TouchableArea onPress={onClick} flex={1}>
        <Flex row gap="$gap12" height={68} py="$spacing12" px="$spacing16">
          {showPortfolioLogo ? (
            <Flex>
              <PortfolioLogo
                chainId={activity.chainId}
                currencies={activity.currencies}
                accountAddress={activity.otherAccount}
                customIcon={isBridgeActivity ? BridgeIcon : undefined}
              />
            </Flex>
          ) : (
            <Flex justifyContent="center">
              <AlertTriangleFilled color="$neutral2" size="32px" />
            </Flex>
          )}
          <Flex justifyContent="center" gap="$gap4" fill>
            <Text variant="body2" color="$neutral1">
              {activity.title}
            </Text>
            <Text variant="body3" color="$neutral2" {...EllipsisTamaguiStyle}>
              {activity.descriptor}
            </Text>
          </Flex>
        </Flex>
      </TouchableArea>
      {pending ? (
        <Flex position="absolute" top="$spacing24" right="$spacing16">
          <LoaderV3 color={colors.accent1.variable} size="20px" />
        </Flex>
      ) : (
        <Flex position="absolute" right="$spacing16" top="$spacing16" data-testid={TestID.ActivityPopupCloseIcon}>
          <TouchableArea onPress={onClose}>
            <X color="$neutral2" size={16} />
          </TouchableArea>
        </Flex>
      )}
    </Flex>
  )
}

export function TransactionPopupContent({ hash, onClose }: { hash: string; onClose: () => void }) {
  const transaction = useTransaction(hash)

  const { formatNumberOrString } = useLocalizationContext()
  const { data: activity } = useQuery(
    getTransactionToActivityQueryOptions({
      transaction,
      formatNumber: formatNumberOrString,
    }),
  )

  const isFlashblockNotification = useIsRecentFlashblocksNotification({ transaction, activity })

  if (!transaction || !activity) {
    return null
  }

  if (
    isFlashblockNotification &&
    !isNonInstantFlashblockTransactionType(transaction) &&
    activity.status === TransactionStatus.Success
  ) {
    return null
  }

  const onClick = () => {
    if (!activity.hash) {
      return
    }
    window.open(
      getExplorerLink({ chainId: activity.chainId, data: activity.hash, type: ExplorerDataType.TRANSACTION }),
      '_blank',
    )
  }

  const explorerUrlUnavailable = isPendingTx(transaction) && transaction.batchInfo

  return (
    <ActivityPopupContent
      activity={activity}
      onClick={explorerUrlUnavailable || !activity.hash ? undefined : onClick}
      onClose={onClose}
    />
  )
}

export function UniswapXOrderPopupContent({ orderHash, onClose }: { orderHash: string; onClose: () => void }) {
  const order = useUniswapXOrderByOrderHash(orderHash)
  const openOffchainActivityModal = useOpenOffchainActivityModal()

  const { formatNumberOrString } = useLocalizationContext()

  const { data: activity } = useQuery(
    getTransactionToActivityQueryOptions({ transaction: order, formatNumber: formatNumberOrString }),
  )

  if (!activity || !order) {
    return null
  }

  const onClick = () => openOffchainActivityModal(order)

  return <ActivityPopupContent activity={activity} onClose={onClose} onClick={onClick} />
}

export function FORTransactionPopupContent({
  transaction,
  onClose,
}: {
  transaction: FORTransaction
  onClose: () => void
}) {
  const { formatNumberOrString, convertFiatAmountFormatted } = useLocalizationContext()
  const { data: activity } = useQuery(
    getFORTransactionToActivityQueryOptions({
      transaction,
      formatNumber: formatNumberOrString,
      formatFiatPrice: convertFiatAmountFormatted,
    }),
  )

  if (!activity) {
    return null
  }

  return <ActivityPopupContent activity={activity} onClose={onClose} onClick={noop} />
}
