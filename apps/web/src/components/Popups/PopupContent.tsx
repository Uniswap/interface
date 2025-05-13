import { useQuery } from '@tanstack/react-query'
import { useOpenOffchainActivityModal } from 'components/AccountDrawer/MiniPortfolio/Activity/OffchainActivityModal'
import {
  getSignatureToActivityQueryOptions,
  getTransactionToActivityQueryOptions,
} from 'components/AccountDrawer/MiniPortfolio/Activity/parseLocal'
import { Activity } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import AlertTriangleFilled from 'components/Icons/AlertTriangleFilled'
import { LoaderV3 } from 'components/Icons/LoadingSpinner'
import { ToastRegularSimple } from 'components/Popups/ToastRegularSimple'
import { POPUP_MAX_WIDTH } from 'components/Popups/constants'
import { useTranslation } from 'react-i18next'
import { useOrder } from 'state/signatures/hooks'
import { useTransaction } from 'state/transactions/hooks'
import { isPendingTx } from 'state/transactions/utils'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { BridgeIcon } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useIsSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { useFormatter } from 'utils/formatNumbers'

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
          <Text variant="body2" color="$neutral1">
            {t('common.failedSwitchNetwork')}
          </Text>
          <Text variant="body3" color="$neutral2" flexWrap="wrap">
            {t('settings.switchNetwork.warning', { label: chainInfo.label })}
          </Text>
        </Flex>
      }
    />
  )
}

type ActivityPopupContentProps = { activity: Activity; onClick?: () => void; onClose: () => void }
function ActivityPopupContent({ activity, onClick, onClose }: ActivityPopupContentProps) {
  const success = activity.status === TransactionStatus.Confirmed && !activity.cancelled
  const pending = activity.status === TransactionStatus.Pending

  const showPortfolioLogo = success || pending || !!activity.offchainOrderDetails
  const colors = useSporeColors()

  const isBridgeActivity = activity.outputChainId && activity.chainId && activity.chainId !== activity.outputChainId
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
      <TouchableArea onPress={onClick}>
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
          <Flex justifyContent="center" gap="$gap4">
            <Text variant="body2" color="$neutral1">
              {activity.title}
            </Text>
            <Text variant="body3" color="$neutral2">
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
        <Flex position="absolute" right="$spacing16" top="$spacing16">
          <TouchableArea onPress={onClose}>
            <X color="$neutral2" size={16} />
          </TouchableArea>
        </Flex>
      )}
    </Flex>
  )
}

export function TransactionPopupContent({
  chainId,
  hash,
  onClose,
}: {
  chainId: UniverseChainId
  hash: string
  onClose: () => void
}) {
  const transaction = useTransaction(hash)
  const { formatNumber } = useFormatter()
  const { data: activity } = useQuery(getTransactionToActivityQueryOptions(transaction, chainId, formatNumber))

  if (!transaction || !activity) {
    return null
  }

  const onClick = () =>
    window.open(getExplorerLink(activity.chainId, activity.hash, ExplorerDataType.TRANSACTION), '_blank')

  const explorerUrlUnavailable = isPendingTx(transaction) && transaction.batchInfo

  return (
    <ActivityPopupContent
      activity={activity}
      onClick={explorerUrlUnavailable ? undefined : onClick}
      onClose={onClose}
    />
  )
}

export function UniswapXOrderPopupContent({ orderHash, onClose }: { orderHash: string; onClose: () => void }) {
  const order = useOrder(orderHash)
  const openOffchainActivityModal = useOpenOffchainActivityModal()

  const { formatNumber } = useFormatter()
  const { data: activity } = useQuery(getSignatureToActivityQueryOptions(order, formatNumber))

  if (!activity || !order) {
    return null
  }

  const onClick = () =>
    openOffchainActivityModal(order, { inputLogo: activity?.logos?.[0], outputLogo: activity?.logos?.[1] })

  return <ActivityPopupContent activity={activity} onClose={onClose} onClick={onClick} />
}
