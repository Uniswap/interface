import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { UniswapX } from 'ui/src/components/icons/UniswapX'
import { X } from 'ui/src/components/icons/X'
import { CrossChainIcon } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useIsSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useIsEarnEnabled } from 'uniswap/src/features/earn/hooks/useIsEarnEnabled'
import type { FORTransaction } from 'uniswap/src/features/fiatOnRamp/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { noop } from 'utilities/src/react/noop'
import {
  getFORTransactionToActivityQueryOptions,
  getTransactionToActivityQueryOptions,
} from '~/components/AccountDrawer/MiniPortfolio/Activity/parseLocal/queryOptions'
import type { Activity } from '~/components/AccountDrawer/MiniPortfolio/Activity/types'
import { PendingPortfolioLogo } from '~/components/AccountDrawer/MiniPortfolio/PendingPortfolioLogo'
import { PortfolioLogo } from '~/components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { useOpenOffchainActivityModal } from '~/components/modals/OffchainActivityModal'
import { POPUP_MAX_WIDTH } from '~/components/Popups/constants'
import { ToastRegularSimple } from '~/components/Popups/ToastRegularSimple'
import { useOpenTransactionDetailsModal } from '~/state/transactionDetailsModalStore'
import { usePlanTransactions, useTransaction, useUniswapXOrderByOrderHash } from '~/state/transactions/hooks'
import { isPendingTx } from '~/state/transactions/utils'
import { EllipsisTamaguiStyle } from '~/theme/components/styles'

const THUMBNAIL_TRANSITION_ENTER_SCALE = 0.75
const THUMBNAIL_TRANSITION_ENTER_OPACITY = 0.16
const THUMBNAIL_TRANSITION_ANIMATION_PRESET = 'bouncy'

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
      icon={<AlertTriangleFilled color="$neutral2" size="$icon.32" />}
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

function ActivityThumbnailTransition({
  animateOnMount,
  children,
}: {
  animateOnMount: boolean
  children: ReactNode
}): JSX.Element {
  // Latch the transition for this mounted status so rerenders don't restart or cut it short.
  const [shouldAnimate] = useState(animateOnMount)

  return (
    <Flex alignItems="center" justifyContent="center" position="relative">
      <Flex
        animateOnly={['transform', 'opacity']}
        animation={shouldAnimate ? THUMBNAIL_TRANSITION_ANIMATION_PRESET : undefined}
        enterStyle={
          shouldAnimate
            ? {
                opacity: THUMBNAIL_TRANSITION_ENTER_OPACITY,
                scale: THUMBNAIL_TRANSITION_ENTER_SCALE,
              }
            : undefined
        }
        opacity={1}
        scale={1}
        style={{ transformOrigin: 'center' }}
      >
        {children}
      </Flex>
    </Flex>
  )
}

type ActivityPopupContentProps = {
  activity: Activity
  onClick?: () => void
  onClose: () => void
}

export function ActivityPopupContent({ activity, onClick, onClose }: ActivityPopupContentProps) {
  const success = activity.status === TransactionStatus.Success
  const pending = activity.status === TransactionStatus.Pending || activity.status === TransactionStatus.AwaitingAction
  const shouldAnimateThumbnailTransition = success

  const showPortfolioLogo = success || pending || !!activity.offchainOrderDetails

  const isCrossChainActivity = activity.outputChainId && activity.chainId !== activity.outputChainId
  const pendingCustomIcon =
    activity.portfolioLogoCustomIcon ??
    (isCrossChainActivity ? <CrossChainIcon status={TransactionStatus.Pending} /> : undefined)
  const completedCustomIcon =
    activity.portfolioLogoCustomIcon ?? (isCrossChainActivity ? <CrossChainIcon status={activity.status} /> : undefined)
  const pendingPortfolioLogo = (
    <PendingPortfolioLogo
      chainId={activity.chainId}
      currencies={activity.currencies}
      images={activity.logos}
      fallbackSymbols={activity.fallbackSymbols}
      accountAddress={activity.otherAccount}
      customIcon={pendingCustomIcon}
    />
  )
  const completedPortfolioLogo = (
    <PortfolioLogo
      chainId={activity.chainId}
      currencies={activity.currencies}
      images={activity.logos}
      fallbackSymbols={activity.fallbackSymbols}
      accountAddress={activity.otherAccount}
      customIcon={completedCustomIcon}
    />
  )
  const portfolioLogo = pending ? pendingPortfolioLogo : completedPortfolioLogo

  return (
    <Flex
      row
      width={POPUP_MAX_WIDTH}
      backgroundColor="$surface1"
      position="relative"
      borderWidth="$spacing1"
      borderRadius="$rounded16"
      borderColor="$surface3"
      py="$spacing2"
      px={0}
      animation="300ms"
      data-testid={TestID.ActivityPopup}
      $sm={{
        mx: 'auto',
        width: '100%',
      }}
    >
      <TouchableArea onPress={onClick} flex={1}>
        <Flex row alignItems="center" gap="$gap12" height={68} py="$spacing12" px="$spacing16">
          {showPortfolioLogo ? (
            <Flex>
              <ActivityThumbnailTransition
                key={`${activity.id}-${activity.status}`}
                animateOnMount={shouldAnimateThumbnailTransition}
              >
                {portfolioLogo}
              </ActivityThumbnailTransition>
            </Flex>
          ) : (
            <Flex justifyContent="center">
              <AlertTriangleFilled color="$neutral2" size="$icon.32" />
            </Flex>
          )}
          <Flex justifyContent="center" gap="$gap4" fill minWidth={0}>
            <Flex row gap="$gap4">
              {activity.isUniswapX ? (
                <Flex flexShrink={0} alignItems="center" justifyContent="center">
                  <UniswapX size="$icon.12" />
                </Flex>
              ) : null}
              <Text variant="body2" color="$neutral1">
                {activity.title}
              </Text>
            </Flex>
            {typeof activity.descriptor === 'string' ? (
              <Text variant="body3" color="$neutral2" {...EllipsisTamaguiStyle}>
                {activity.descriptor}
              </Text>
            ) : (
              <Flex overflow="hidden" maxHeight={28}>
                {activity.descriptor}
              </Flex>
            )}
          </Flex>
        </Flex>
      </TouchableArea>
      {!pending ? (
        <Flex position="absolute" right="$spacing16" top="$spacing16" data-testid={TestID.ActivityPopupCloseIcon}>
          <TouchableArea onPress={onClose}>
            <X color="$neutral2" size={16} />
          </TouchableArea>
        </Flex>
      ) : null}
    </Flex>
  )
}

export function TransactionPopupContent({ hash, onClose }: { hash: string; onClose: () => void }) {
  const transaction = useTransaction(hash)
  const { formatNumberOrString } = useLocalizationContext()
  const isEarnActivityDisplayEnabled = useIsEarnEnabled()

  const { data: activity } = useQuery(
    getTransactionToActivityQueryOptions({
      transaction,
      formatNumber: formatNumberOrString,
      isEarnActivityDisplayEnabled,
    }),
  )

  if (!transaction || !activity) {
    return null
  }

  const openExplorerLink = () => {
    if (!activity.hash) {
      return
    }
    window.open(
      getExplorerLink({
        chainId: activity.chainId,
        data: activity.hash,
        type: ExplorerDataType.TRANSACTION,
      }),
      '_blank',
    )
  }

  const explorerUrlUnavailable = isPendingTx(transaction) && transaction.batchInfo

  return (
    <ActivityPopupContent
      activity={activity}
      onClick={explorerUrlUnavailable || !activity.hash ? undefined : openExplorerLink}
      onClose={onClose}
    />
  )
}

export function PlanPopupContent({ planId, onClose }: { planId: string; onClose: () => void }) {
  const plan = usePlanTransactions([planId]).at(0)
  const openTransactionDetailsModal = useOpenTransactionDetailsModal()
  const { formatNumberOrString } = useLocalizationContext()
  const isEarnActivityDisplayEnabled = useIsEarnEnabled()
  const { data: activity } = useQuery(
    getTransactionToActivityQueryOptions({
      transaction: plan,
      formatNumber: formatNumberOrString,
      isEarnActivityDisplayEnabled,
    }),
  )

  if (!activity || !plan) {
    return null
  }

  const onClick = () => openTransactionDetailsModal(plan)

  return <ActivityPopupContent activity={activity} onClose={onClose} onClick={onClick} />
}

export function UniswapXOrderPopupContent({ orderHash, onClose }: { orderHash: string; onClose: () => void }) {
  const order = useUniswapXOrderByOrderHash(orderHash)
  const openOffchainActivityModal = useOpenOffchainActivityModal()
  const isEarnActivityDisplayEnabled = useIsEarnEnabled()

  const { formatNumberOrString } = useLocalizationContext()

  const { data: activity } = useQuery(
    getTransactionToActivityQueryOptions({
      transaction: order,
      formatNumber: formatNumberOrString,
      isEarnActivityDisplayEnabled,
    }),
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
