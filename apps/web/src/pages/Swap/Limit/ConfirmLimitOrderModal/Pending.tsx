import { UniverseChainId } from '@universe/chains'
import { View, type ViewCompatProps, Flex, Text } from '@universe/mycelium'
import { curveToAnimationTiming } from '@universe/mycelium/compat'
import { SPORE_ANIMATION_CURVE_CSS } from '@universe/tailwind/animations'
import { TFunction } from 'i18next'
import { type CSSProperties, ReactNode, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { LogoContainer } from '~/components/Activity/Logos'
import { OrderContent } from '~/components/modals/OffchainActivityModal'
import { useAccount } from '~/connection/hooks/useAccount'
import {
  AnimatedEntranceConfirmationIcon,
  AnimatedEntranceSubmittedIcon,
  LoadingIndicatorOverlay,
} from '~/pages/Swap/Limit/ConfirmLimitOrderModal/PendingStatusIcons'
import { TradeSummary } from '~/pages/Swap/Limit/ConfirmLimitOrderModal/TradeSummary'
import { useIsTransactionConfirmed, useUniswapXOrderByOrderHash } from '~/state/transactions/hooks'
import { ExternalLink } from '~/theme/components/Links'
import { InterfaceTrade } from '~/types/routing'
import type { LimitOrderResult } from '~/types/trade'
import { isLimitTrade, isUniswapXTradeType } from '~/utils/routing/routing'

function AnimationWrapper(props: ViewCompatProps): JSX.Element {
  return <View position="relative" width="100%" minHeight={72} flexGrow={1} {...props} />
}

function StepTitleAnimationContainer(props: ViewCompatProps): JSX.Element {
  return (
    <View
      position="absolute"
      width="100%"
      height="100%"
      alignItems="center"
      flexDirection="column"
      gap="$gap12"
      {...props}
    />
  )
}

function getTitle({
  t,
  trade,
  swapPending,
  swapConfirmed,
}: {
  t: TFunction
  trade?: InterfaceTrade
  swapPending: boolean
  swapConfirmed: boolean
}): ReactNode {
  if (isLimitTrade(trade)) {
    if (swapPending) {
      return t('swap.limitSubmitted')
    }
    if (swapConfirmed) {
      return t('swap.limitFilled')
    }

    return t('swap.confirmLimit')
  }

  if (swapPending) {
    return t('swap.submitted')
  }
  if (swapConfirmed) {
    return t('swap.success')
  }

  return t('swap.confirmSwap')
}

// oxlint-disable-next-line complexity
export function Pending({
  trade,
  limitOrderResult,
  wrapTxHash,
  tokenApprovalPending = false,
  revocationPending = false,
}: {
  trade?: InterfaceTrade
  limitOrderResult?: LimitOrderResult
  wrapTxHash?: string
  tokenApprovalPending?: boolean
  revocationPending?: boolean
}) {
  // This component is only rendered after the user signs, so we don't want to
  // accept new trades with different quotes. We should only display the quote
  // price that the user actually submitted.
  // TODO(WEB-3854): Stop requesting new swap quotes after the user submits the transaction.
  const initialTrade = useRef(trade).current
  const { chainId } = useAccount()
  const { t } = useTranslation()

  const uniswapXOrder = useUniswapXOrderByOrderHash(
    isUniswapXTradeType(limitOrderResult?.type) ? limitOrderResult.response.orderHash : '',
  )

  const limitPlaced = isLimitTrade(initialTrade) && uniswapXOrder?.status === TransactionStatus.Pending
  const swapConfirmed = uniswapXOrder?.status === TransactionStatus.Success
  const wrapConfirmed = useIsTransactionConfirmed(wrapTxHash)

  const swapPending = limitOrderResult !== undefined && !swapConfirmed
  const wrapPending = wrapTxHash !== undefined && !wrapConfirmed
  const transactionPending = revocationPending || tokenApprovalPending || wrapPending || swapPending

  const showSubmitted = swapPending && chainId === UniverseChainId.Mainnet
  const showSuccess = swapConfirmed || (chainId !== UniverseChainId.Mainnet && swapPending)

  const explorerLink = useMemo(() => {
    if (uniswapXOrder && uniswapXOrder.status === TransactionStatus.Success) {
      return getExplorerLink({
        chainId: chainId || UniverseChainId.Mainnet,
        data: uniswapXOrder.hash,
        type: ExplorerDataType.TRANSACTION,
      })
    }
    return undefined
  }, [chainId, uniswapXOrder])

  // Handle special statuses for UniswapX orders
  if (
    uniswapXOrder &&
    uniswapXOrder.status !== TransactionStatus.Pending &&
    uniswapXOrder.status !== TransactionStatus.Success
  ) {
    return <OrderContent order={uniswapXOrder} />
  }

  // Mount slide-in from the right on the legacy `300ms` curve; the legacy exitStyle was dead
  // (unmount runs through the parent AnimateTransition's own exit lane).
  return (
    <Flex
      alignItems="center"
      width="100%"
      mt={48}
      mb="$spacing8"
      gap="$gap24"
      className="animate-spore-enter-presence opacity-[1]"
      style={
        {
          '--spore-presence-enter-x': '40px',
          ...curveToAnimationTiming(SPORE_ANIMATION_CURVE_CSS['300ms']),
        } as CSSProperties
      }
    >
      <LogoContainer>
        {/* Shown only during the final step under "success" conditions, and scales in */}
        {showSuccess && <AnimatedEntranceConfirmationIcon />}
        {/* Shown only during the final step on mainnet, when the transaction is sent but pending confirmation */}
        {showSubmitted && <AnimatedEntranceSubmittedIcon />}
        {/* Scales in for any step that waits for an onchain transaction, while the transaction is pending */}
        {/* On the last step, appears while waiting for the transaction to be signed too */}
        {!showSuccess && !showSubmitted && <LoadingIndicatorOverlay />}
      </LogoContainer>
      <Flex
        alignItems="center"
        width="100%"
        px={32}
        overflow="visible"
        gap="$gap12"
        opacity={transactionPending && !limitPlaced ? 0.5 : 1}
      >
        <AnimationWrapper>
          <StepTitleAnimationContainer>
            <Text variant="body2" width="100%" textAlign="center" data-testid="pending-modal-content-title">
              {getTitle({ t, trade: initialTrade, swapPending, swapConfirmed })}
            </Text>
            {initialTrade && (
              <Text variant="body3" color="$neutral2" textAlign="center">
                <TradeSummary trade={initialTrade} />
              </Text>
            )}
          </StepTitleAnimationContainer>
        </AnimationWrapper>
        {/* Display while waiting for user to make final submission by confirming in wallet */}
        {!swapPending && !swapConfirmed && (
          <Flex row width="100%" justifyContent="center" alignItems="center" mt={32} minHeight={24}>
            <Text variant="body3" color="$neutral2">
              {t('common.proceedInWallet')}
            </Text>
          </Flex>
        )}
        {/* Display while UniswapX order is still pending */}
        {uniswapXOrder && uniswapXOrder.status === TransactionStatus.Pending && (
          <Flex row width="100%" justifyContent="center" alignItems="center" mt={32} minHeight={24}>
            <Text variant="body3" color="$neutral2">
              <ExternalLink
                href={
                  isLimitTrade(initialTrade)
                    ? UniswapHelpUrls.articles.limitsInfo
                    : UniswapHelpUrls.articles.uniswapXInfo
                }
              >
                {isLimitTrade(initialTrade) ? t('limits.learnMore') : t('uniswapX.learnMore')}
              </ExternalLink>
            </Text>
          </Flex>
        )}
        {/* Display after filling UniswapX order */}
        {explorerLink && (
          <Flex row width="100%" justifyContent="center" alignItems="center" mt={32} minHeight={24}>
            <Text variant="body3" color="$neutral2">
              <ExternalLink href={explorerLink} color="$neutral2">
                {t('common.viewOnExplorer')}
              </ExternalLink>
            </Text>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
