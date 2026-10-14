import type { Currency } from '@uniswap/sdk-core'
import type { EVMUniverseChainId } from '@universe/chains'
import { Button, Flex, Text, TouchableArea } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { Fragment, memo, type PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import claimGlowLarge from '~/assets/svg/auction-claim-glow/large.svg'
import claimGlowSmall from '~/assets/svg/auction-claim-glow/small.svg'
import { formatUnits } from '~/chains'
import { WithdrawModal } from '~/features/Toucan/Auction/Bids/WithdrawModal/WithdrawModal'
import { useBidTokenInfo } from '~/features/Toucan/Auction/hooks/useBidTokenInfo'
import { useWithdrawButtonState } from '~/features/Toucan/Auction/hooks/useWithdrawButtonState'
import { AuctionStoreInstanceProvider } from '~/features/Toucan/Auction/store/AuctionStoreContextProvider'
import type { BidTokenInfo } from '~/features/Toucan/Auction/store/types'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { useNavigateToAuctionDetails } from '~/hooks/useNavigateToAuctionDetails'
import { TokenDetailsAuctionErrorBoundary } from '~/pages/TokenDetails/components/auction/TokenDetailsAuctionErrorBoundary'
import {
  TokenDetailsClaimContext,
  type TokenDetailsClaimSlot,
} from '~/pages/TokenDetails/components/claim/TokenDetailsClaimContext'
import { TokenDetailsClaimSkeleton } from '~/pages/TokenDetails/components/claim/TokenDetailsClaimSkeleton'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useTokenDetailsClaimableAllocation } from '~/pages/TokenDetails/hooks/useTokenDetailsClaimableAllocation'
import {
  type TokenDetailsClaimSession,
  useTokenDetailsClaimSessions,
} from '~/pages/TokenDetails/hooks/useTokenDetailsClaimSessions'
import {
  type ClaimableAllocation,
  ClaimableAllocationState,
  hasClaimCardContent,
  isWithdrawableAllocation,
} from '~/pages/TokenDetails/utils/claimableAllocation'

// This artwork stays dark in both themes so the white text and CTA retain their contrast.
// Artwork: https://www.figma.com/design/jGWtXzJLYGunUJn8FY6AH2/Token-Launcher?node-id=13361-91888
const CARD_BACKGROUND = {
  backgroundColor: '#131313',
  // The urls must stay quoted: the production build inlines these SVGs as data URIs containing `'` and
  // `(`, which a bare url() token cannot hold — one invalid layer drops the whole declaration.
  backgroundImage: `url("${claimGlowLarge}"), url("${claimGlowSmall}"), url("${claimGlowLarge}"), url("${claimGlowLarge}"), linear-gradient(rgba(116, 130, 255, 0.24), rgba(116, 130, 255, 0.24))`,
  backgroundSize: '252px 252px, 110px 110px, 252px 252px, 252px 252px, 100% 100%',
  backgroundPosition:
    'left 1px bottom -155px, calc(50% + 24px) -62px, left -119px top -146px, right -102px bottom -138.5px, center',
  backgroundRepeat: 'no-repeat',
  backgroundBlendMode: 'normal, normal, normal, normal, hard-light',
  boxShadow: 'inset -2px -2px 12px rgba(255, 255, 255, 0.32)',
}

interface ClaimCardProps {
  allocation: ClaimableAllocation
  shouldReserveClaimSpace: boolean
  currency: Currency
  bidTokenAddress: string
  chainId: EVMUniverseChainId
  onViewAuction: () => void
  retry: () => void
}

interface ClaimPresentationProps {
  sessionKey: string
  /** `null` removes this session's slot. */
  onPresentationChange: (sessionKey: string, slot: TokenDetailsClaimSlot | null) => void
}

const RESERVED_SLOT: TokenDetailsClaimSlot = { card: <TokenDetailsClaimSkeleton />, isReserved: true }

/** Publish only presentation; modal and transaction hooks stay mounted in their stable owner. */
function ClaimPresentation({
  sessionKey,
  onPresentationChange,
  allocation,
  shouldReserveClaimSpace,
  children,
}: PropsWithChildren<ClaimPresentationProps & Pick<ClaimCardProps, 'allocation' | 'shouldReserveClaimSpace'>>): null {
  const card = hasClaimCardContent(allocation) ? children : null
  useEffect(() => {
    // Every pending session publishes the same constant, so the outlet can collapse them into one slot.
    onPresentationChange(
      sessionKey,
      shouldReserveClaimSpace ? RESERVED_SLOT : card === null ? null : { card, isReserved: false },
    )
    return () => onPresentationChange(sessionKey, null)
  }, [card, shouldReserveClaimSpace, onPresentationChange, sessionKey])
  return null
}

function ClaimCardFrame({
  children,
  unavailable = false,
  themed = false,
}: PropsWithChildren<{ unavailable?: boolean; themed?: boolean }>): JSX.Element {
  return (
    <Flex
      row={!unavailable}
      flexWrap="wrap"
      alignItems={unavailable ? 'stretch' : 'center'}
      gap="$spacing12"
      p="$spacing16"
      borderRadius="$rounded20"
      backgroundColor={themed ? '$surface3' : undefined}
      style={themed ? undefined : CARD_BACKGROUND}
      // The card art is authored in dark mode (Figma 13631-31405), so its subtree resolves dark tokens in
      // both app themes — a light-theme `neutral1` CTA would be #131313 on the #131313 card.
      className={themed ? undefined : 'dark'}
      testID={TestID.TokenDetailsClaimCard}
    >
      {children}
    </Flex>
  )
}

function ClaimCardContent({
  allocation,
  currency,
  bidTokenAddress,
  bidTokenInfo,
  bidTokenError,
  onViewAuction,
  retry,
  children,
}: PropsWithChildren<ClaimCardProps & { bidTokenInfo?: BidTokenInfo; bidTokenError?: Error }>): JSX.Element | null {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()

  // Reserved slots never render content; the outlet paints one shared skeleton for all of them.
  if (!hasClaimCardContent(allocation)) {
    return null
  }

  // A refund is shown and signed in the bid currency, so a lookup that cannot succeed blocks it like a failed
  // allocation. Common bases still resolve locally when the request fails, so an error with info is renderable.
  const bidTokenUnavailable = !bidTokenAddress || (bidTokenError !== undefined && !bidTokenInfo)
  // Unavailable is the only visible state that cannot withdraw.
  if (
    !isWithdrawableAllocation(allocation) ||
    (allocation.status === ClaimableAllocationState.Refundable && bidTokenUnavailable)
  ) {
    return (
      <ClaimCardFrame unavailable>
        <Text variant="body3" color="$white" flex={1}>
          {t('tdp.claim.unavailable')}
        </Text>
        <Flex row flexWrap="wrap" alignItems="center" gap="$spacing8">
          <Trace logPress element={ElementName.TokenDetailsClaimViewAuctionButton}>
            <TouchableArea
              px="$spacing8"
              py="$spacing4"
              testID={TestID.TokenDetailsClaimViewAuctionButton}
              onPress={onViewAuction}
            >
              <Text variant="buttonLabel3" color="$white">
                {t('tdp.auction.viewAuction')}
              </Text>
            </TouchableArea>
          </Trace>
          <Trace logPress element={ElementName.TokenDetailsClaimRetryButton}>
            <Button
              size="small"
              emphasis="primary"
              fill={false}
              testID={TestID.TokenDetailsClaimRetryButton}
              onPress={retry}
            >
              {t('common.button.retry')}
            </Button>
          </Trace>
        </Flex>
      </ClaimCardFrame>
    )
  }

  if (allocation.status === ClaimableAllocationState.Refundable) {
    return (
      <ClaimCardFrame themed>
        <RefundAmount amountRaw={allocation.amountRaw} bidTokenInfo={bidTokenInfo} />
        {children}
      </ClaimCardFrame>
    )
  }

  return (
    <ClaimCardFrame>
      <Flex flex={1} minWidth={0} gap="$spacing2">
        <Text variant="heading3" color="$white">
          {formatNumberOrString({
            value: formatUnits(allocation.amountRaw, currency.decimals),
            type: NumberType.TokenNonTx,
          })}{' '}
          {currency.symbol}
        </Text>
        <Text variant="body3" color="$white" opacity={0.65}>
          {t('tdp.claim.receivedFromAuction')}
        </Text>
      </Flex>
      {children}
    </ClaimCardFrame>
  )
}

function RefundAmount({ amountRaw, bidTokenInfo }: { amountRaw: bigint; bidTokenInfo?: BidTokenInfo }): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()

  return (
    <Flex flex={1} minWidth={0} gap="$spacing2">
      {bidTokenInfo && (
        <Text variant="heading3" color="$neutral1">
          {formatNumberOrString({
            value: formatUnits(amountRaw, bidTokenInfo.decimals),
            type: NumberType.TokenNonTx,
          })}{' '}
          {bidTokenInfo.symbol}
        </Text>
      )}
      <Text variant="body3" color="$neutral2">
        {t('tdp.claim.refundAvailable')}
      </Text>
    </Flex>
  )
}

/** Keep the modal hook alive even while the allocation card temporarily cannot render. */
function WithdrawalControls({
  chainId,
  sessionKey,
  onPresentationChange,
  retry,
  ...cardProps
}: ClaimCardProps & ClaimPresentationProps): JSX.Element {
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const isRefundable = cardProps.allocation.status === ClaimableAllocationState.Refundable
  const isWithdrawable = isWithdrawableAllocation(cardProps.allocation)
  const { outcome, claimBlock, currentBlockNumber, userBidsInitialized } = useAuctionStore((state) => ({
    outcome: state.progress.outcome,
    claimBlock: state.auctionDetails?.claimBlock,
    currentBlockNumber: state.currentBlockNumber,
    userBidsInitialized: state.userBidsInitialized,
  }))
  // The ADP button state reads the store's bids, which report nothing to claim until they have loaded.
  const { isDisabled } = useWithdrawButtonState({ outcome, claimBlock, currentBlockNumber, chainId })
  // The modal formats the refund with this same metadata and shows '0' without it; the same value
  // renders the amount and gates the CTA so a signature is never offered for an amount the card cannot show.
  const {
    bidTokenInfo,
    error: bidTokenError,
    refetch: refetchBidToken,
  } = useBidTokenInfo({
    bidTokenAddress: cardProps.bidTokenAddress,
    chainId,
    skip: !isRefundable,
  })
  // Retry also re-runs the bid currency lookup.
  const retryWithBidToken = useEvent(() => {
    refetchBidToken()
    retry()
  })
  const openModal = useCallback(() => setIsModalOpen(true), [])
  const closeModal = useCallback(() => setIsModalOpen(false), [])
  const isUnavailable = cardProps.allocation.status === ClaimableAllocationState.Unavailable
  // An errored allocation hides the modal behind the Retry card; forget the open state so a recovering refetch
  // does not silently reopen it. Loading and Claimed keep it, since they occur mid-claim while the modal is in use.
  useEffect(() => {
    if (isUnavailable) {
      setIsModalOpen(false)
    }
  }, [isUnavailable])

  return (
    <>
      <ClaimPresentation
        sessionKey={sessionKey}
        onPresentationChange={onPresentationChange}
        allocation={cardProps.allocation}
        shouldReserveClaimSpace={cardProps.shouldReserveClaimSpace}
      >
        <ClaimCardContent
          {...cardProps}
          chainId={chainId}
          retry={retryWithBidToken}
          bidTokenInfo={bidTokenInfo}
          bidTokenError={bidTokenError}
        >
          <Trace
            logPress
            element={isRefundable ? ElementName.TokenDetailsRefundButton : ElementName.TokenDetailsClaimButton}
          >
            <Button
              size="small"
              emphasis="primary"
              fill={false}
              disabled={isDisabled || !userBidsInitialized || (isRefundable && !bidTokenInfo)}
              testID={isRefundable ? TestID.TokenDetailsRefundButton : TestID.TokenDetailsClaimButton}
              onPress={openModal}
            >
              {t('tdp.claim.action')}
            </Button>
          </Trace>
        </ClaimCardContent>
      </ClaimPresentation>
      <WithdrawModal isOpen={isModalOpen && isWithdrawable} onClose={closeModal} />
    </>
  )
}

const SETTLED_ALLOCATION: ClaimableAllocation = { status: ClaimableAllocationState.Claimed }

function ClaimCardSession({
  auctionAddress,
  chainId,
  sessionKey,
  onPresentationChange,
  ...cardProps
}: ClaimCardProps & ClaimPresentationProps & { auctionAddress: string }): JSX.Element | null {
  const isWithdrawable = isWithdrawableAllocation(cardProps.allocation)
  const [hasWithdrawableAllocation, setHasWithdrawableAllocation] = useState(isWithdrawable)
  if (isWithdrawable && !hasWithdrawableAllocation) {
    setHasWithdrawableAllocation(true)
  }
  // The API keeps reporting the bid as withdrawable until indexing catches up, so the receipt settles
  // the card rather than the refresh it triggers: the wallet has the funds and the success toast says so.
  const [isSettledOnChain, setIsSettledOnChain] = useState(false)
  const onWithdrawalConfirmed = useEvent(() => {
    setIsSettledOnChain(true)
    cardProps.retry()
  })
  const settledProps = isSettledOnChain
    ? { ...cardProps, allocation: SETTLED_ALLOCATION, shouldReserveClaimSpace: false }
    : cardProps

  if (!hasWithdrawableAllocation && !isWithdrawable) {
    // Refundable allocations always mount WithdrawalControls, which resolves the required bid-currency metadata.
    return (
      <ClaimPresentation
        sessionKey={sessionKey}
        onPresentationChange={onPresentationChange}
        allocation={settledProps.allocation}
        shouldReserveClaimSpace={settledProps.shouldReserveClaimSpace}
      >
        <ClaimCardContent {...settledProps} chainId={chainId} />
      </ClaimPresentation>
    )
  }

  // A failed refresh must not discard pending/awaiting bid IDs. Once needed, keep the existing
  // transaction loader alive for this wallet and auction, including after the card disappears.
  return (
    <AuctionStoreInstanceProvider
      auctionAddress={auctionAddress}
      chainId={chainId}
      onWithdrawalConfirmed={onWithdrawalConfirmed}
    >
      <WithdrawalControls
        {...settledProps}
        chainId={chainId}
        sessionKey={sessionKey}
        onPresentationChange={onPresentationChange}
      />
    </AuctionStoreInstanceProvider>
  )
}

/** Stable optional owners: one per known Custom auction on the page chain for the connected wallet. */
// Publishing presentation must not rerender its owner and trigger another publication.
export const TokenDetailsClaimOwner = memo(function TokenDetailsClaimOwner({
  onPresentationChange,
}: Pick<ClaimPresentationProps, 'onPresentationChange'>): JSX.Element | null {
  const sessions = useTokenDetailsClaimSessions()
  const currency = useTDPStore((s) => s.currency)
  if (!currency) {
    return null
  }
  return (
    <>
      {sessions.map((session) => (
        <TokenDetailsAuctionErrorBoundary key={session.sessionKey}>
          <ClaimSessionOwner session={session} currency={currency} onPresentationChange={onPresentationChange} />
        </TokenDetailsAuctionErrorBoundary>
      ))}
    </>
  )
})

function ClaimSessionOwner({
  session,
  currency,
  onPresentationChange,
}: { session: TokenDetailsClaimSession; currency: Currency } & Pick<
  ClaimPresentationProps,
  'onPresentationChange'
>): JSX.Element {
  const navigateToAuctionDetails = useNavigateToAuctionDetails()
  const { allocation, shouldReserveClaimSpace, retry } = useTokenDetailsClaimableAllocation({ session })
  const { sessionKey, chainId, auction } = session
  // Nothing upstream validates the served auction address; the shared hook toasts instead of no-oping on a bad one.
  const onViewAuction = useEvent(() => navigateToAuctionDetails({ chainId, auctionAddress: auction.address }))

  return (
    <ClaimCardSession
      sessionKey={sessionKey}
      onPresentationChange={onPresentationChange}
      auctionAddress={auction.address}
      chainId={chainId}
      allocation={allocation}
      shouldReserveClaimSpace={shouldReserveClaimSpace}
      currency={currency}
      bidTokenAddress={auction.currency}
      retry={retry}
      onViewAuction={onViewAuction}
    />
  )
}

/** Responsive presentation outlet; resizing never owns or replaces transaction state. */
export function TokenDetailsClaimCard(): JSX.Element | null {
  const slots = useContext(TokenDetailsClaimContext)
  const sessions = useTokenDetailsClaimSessions()
  // The owners publish one passive-effect flush after they render; never paint a card whose session is gone.
  const published = sessions.flatMap((session) => {
    const slot = slots.get(session.sessionKey)
    return slot === undefined ? [] : [{ sessionKey: session.sessionKey, slot }]
  })
  // One reserved slot, not one per ended auction: the skeleton holds no per-auction content, and a wallet
  // that never bid would otherwise flash N of them before every card collapses to nothing.
  const visible = [
    ...published.filter(({ slot }) => !slot.isReserved),
    ...published.filter(({ slot }) => slot.isReserved).slice(0, 1),
  ]
  if (visible.length === 0) {
    return null
  }
  return (
    <Flex gap="$spacing8">
      {visible.map(({ sessionKey, slot }) => (
        <Fragment key={sessionKey}>{slot.card}</Fragment>
      ))}
    </Flex>
  )
}
