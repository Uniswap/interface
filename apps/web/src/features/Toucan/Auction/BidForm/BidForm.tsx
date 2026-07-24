//! tamagui-ignore
// tamagui-ignore
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Flex, styled, useColorsFromTokenColor } from 'ui/src'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { useIsModeMismatch } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { setIsTestnetModeEnabled } from 'uniswap/src/features/settings/slice'
import { AuctionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { getTokenWarningSeverity } from 'uniswap/src/features/tokens/warnings/safetyUtils'
import { TokenWarningCard } from 'uniswap/src/features/tokens/warnings/TokenWarningCard'
import TokenWarningModal from 'uniswap/src/features/tokens/warnings/TokenWarningModal'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { zeroAddress } from '~/chains'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { useToucanGeoRestriction } from '~/components/GeoRestriction/useToucanGeoRestriction'
import { useActiveAddress } from '~/features/accounts/store/hooks'
import { getAuctionBidInputtedAnalyticsProperties } from '~/features/Toucan/Auction/analytics'
import { AuctionAccessIndicators } from '~/features/Toucan/Auction/BidForm/AuctionAccessIndicators'
import { BidBudgetInput } from '~/features/Toucan/Auction/BidForm/BidBudgetInput'
import { BidFormActionButton } from '~/features/Toucan/Auction/BidForm/BidFormActionButton'
import { BidFormWarningBanner } from '~/features/Toucan/Auction/BidForm/BidFormWarningBanner'
import { BidMaxValuationInputV2 } from '~/features/Toucan/Auction/BidForm/BidMaxValuationInputV2'
import { BidReceiveOutput } from '~/features/Toucan/Auction/BidForm/BidReceiveOutput'
import { BidReviewModal } from '~/features/Toucan/Auction/BidForm/BidReviewModal/BidReviewModal'
import { KycFailedModal } from '~/features/Toucan/Auction/BidForm/KycFailedModal/KycFailedModal'
import { KycInterstitialModal } from '~/features/Toucan/Auction/BidForm/KycInterstitialModal/KycInterstitialModal'
import { NoBidTokenBanner } from '~/features/Toucan/Auction/BidForm/NoBidTokenBanner'
import { useBidFormWarningState } from '~/features/Toucan/Auction/BidForm/useBidFormWarningState'
import { useAuctionKycStatus } from '~/features/Toucan/Auction/hooks/useAuctionKycStatus'
import { useAuctionTokenColor } from '~/features/Toucan/Auction/hooks/useAuctionTokenColor'
import { useBidFormController } from '~/features/Toucan/Auction/hooks/useBidFormController'
import { AuctionProgressState } from '~/features/Toucan/Auction/store/types'
import { useAuctionStore, useAuctionStoreActions } from '~/features/Toucan/Auction/store/useAuctionStore'
import { getRequiredTestnetMode } from '~/features/Toucan/Shared/getRequiredTestnetMode'
import { InlineAlertBanner } from '~/features/Toucan/Shared/InlineAlertBanner'

const VerticalLineContainer = styled(Flex, {
  width: '100%',
  alignItems: 'center',
  paddingVertical: '$spacing2',
})

const VerticalLine = styled(Flex, {
  width: 1,
  height: 8,
  backgroundColor: '$surface3',
  borderRadius: '$roundedFull',
})

interface BidFormProps {
  onInputChange?: () => void
  onBidSubmitted?: () => void
}

export function BidForm({ onInputChange, onBidSubmitted }: BidFormProps): JSX.Element {
  const { t } = useTranslation()
  const trace = useTrace()
  const isCentralizedPricesEnabled = useFeatureFlag(FeatureFlags.CentralizedPrices)
  const chainId = useAuctionStore((state) => state.auctionDetails?.chainId)
  const auctionContractAddress = useAuctionStore((state) => state.auctionAddress)
  const currency = useAuctionStore((state) => state.auctionDetails?.currency)
  const userBids = useAuctionStore((state) => state.userBids)
  const token = useAuctionStore((state) => state.auctionDetails?.token)
  const { isGeoRestricted, unavailableLabel } = useToucanGeoRestriction(token?.currency)
  const auctionTokenName = useAuctionStore((state) => state.auctionDetails?.token?.currency.name)
  const { tokenColor, effectiveTokenColor } = useAuctionTokenColor()
  const auctionAddress = useAuctionStore((state) => state.auctionAddress)
  const auctionProgressState = useAuctionStore((state) => state.progress.state)
  const currentBlockNumber = useAuctionStore((state) => state.currentBlockNumber)
  const validationHook = useAuctionStore((state) => state.auctionDetails?.validationHook)
  const isAuctionInProgress = auctionProgressState === AuctionProgressState.IN_PROGRESS
  const isAuctionEnded = auctionProgressState === AuctionProgressState.ENDED
  const { validTokenColor } = useColorsFromTokenColor(tokenColor)

  const { setBidInputFocused } = useAuctionStoreActions()

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [isKycInterstitialModalOpen, setIsKycInterstitialModalOpen] = useState(false)
  const [isKycFailedModalOpen, setIsKycFailedModalOpen] = useState(false)
  const [showTokenWarningModal, setShowTokenWarningModal] = useState(false)

  // Token-protection warnings stay on for every auction, including quick launches: the
  // quick-launch classifier is forgeable by construction, so it must never gate a protection
  // signal. Any exemption policy is deferred to security review (LP-1076).
  const tokenWarningSeverity = token ? getTokenWarningSeverity(token) : WarningSeverity.None
  const shouldShowTokenWarning = tokenWarningSeverity > WarningSeverity.Low

  const {
    budgetField,
    maxValuationField,
    submitState,
    auctionTokenDecimals,
    expectedReceiveAmount,
    minExpectedReceiveAmount,
    auctionTokenSymbol,
    maxReceivableAmount,
    maxPriceQ96,
    bidTokenDecimals,
    hasBidToken,
    bidCurrencyAddress,
    bidTokenSymbol,
    isNativeBidToken,
  } = useBidFormController({
    tokenColor: validTokenColor,
    onTransactionSubmitted: () => {
      setIsReviewModalOpen(false)
      onBidSubmitted?.()
    },
    onInputChange,
  })

  const accountAddress = useActiveAddress(chainId ?? UniverseChainId.Sepolia)
  const isWalletConnected = Boolean(accountAddress)
  const accountDrawer = useAccountDrawer()
  const dispatch = useDispatch()

  // Bidding requires the app's testnet mode to match the auction chain (see getRequiredTestnetMode).
  // When it doesn't, the bid button becomes a one-tap CTA to flip testnet mode instead of failing at
  // submission with "Failed to switch networks for Toucan bid".
  const isModeMismatch = useIsModeMismatch(chainId)
  const requiredTestnetMode = getRequiredTestnetMode({
    isWalletConnected,
    isActionAvailable: isAuctionInProgress,
    isModeMismatch,
    chainId,
  })
  const needsTestnetModeSwitch = requiredTestnetMode !== undefined

  const kycStatus = useAuctionKycStatus({
    walletAddress: accountAddress,
    auctionAddress,
    chainId,
    currentBlockNumber,
  })

  const { showDisabledState, shouldShowWarningBanner, shouldDisableBidForm } = useBidFormWarningState({
    chainId,
    currency,
    auctionProgressState,
    userBids,
    validationHook,
    // Only treat KYC as an unsupported-auction signal once a wallet is connected;
    // otherwise the disabled verify-wallet query is misread as an error and surfaces
    // the warning banner instead of the connect-wallet CTA on the action button.
    validationError: isWalletConnected && kycStatus.isError,
  })

  const handleButtonPress = (): void => {
    if (!isWalletConnected) {
      accountDrawer.open()
      return
    }
    if (requiredTestnetMode !== undefined) {
      dispatch(setIsTestnetModeEnabled(requiredTestnetMode))
      return
    }
    if (kycStatus.canBid) {
      handleReviewBidClick()
    } else if (kycStatus.onKycAction) {
      kycStatus.onKycAction()
    }
  }

  const buttonLabel = (() => {
    if (isGeoRestricted) {
      return unavailableLabel
    }
    if (!isWalletConnected) {
      return t('common.connectWallet.button')
    }
    if (needsTestnetModeSwitch) {
      return requiredTestnetMode ? t('toucan.action.enableTestnetMode') : t('toucan.action.disableTestnetMode')
    }
    return (kycStatus.kycButtonLabel ?? showDisabledState)
      ? t('toucan.auction.bidForm.auctionConcluded')
      : t('toucan.bidForm.reviewBid')
  })()

  // The testnet-mode-switch CTA stays tappable regardless of the bid inputs, since switching mode is
  // always a valid action and is a prerequisite to bidding at all.
  const buttonDisabled =
    isGeoRestricted ||
    (isWalletConnected && !needsTestnetModeSwitch
      ? submitState.isDisabled || !isAuctionInProgress || shouldDisableBidForm || kycStatus.kycButtonDisabled
      : false)

  const shouldShowSwapBanner =
    isWalletConnected &&
    isAuctionInProgress &&
    !hasBidToken &&
    bidCurrencyAddress &&
    chainId &&
    !shouldShowWarningBanner

  const handleReviewBidClick = useEvent(() => {
    if (
      chainId &&
      auctionContractAddress &&
      budgetField.currencyAmount &&
      maxValuationField.currencyAmount &&
      currency
    ) {
      // Skip blur snap to prevent value drift on mobile when modal opens
      maxValuationField.setSkipBlurSnap(true)
      setIsReviewModalOpen(true)

      const bidTokenAmountRaw = budgetField.currencyAmount.quotient.toString()
      const maxPriceQ96String = maxValuationField.currencyAmount.quotient.toString()
      const bidTokenAddress = currency.toLowerCase() === zeroAddress ? zeroAddress : currency.toLowerCase()

      sendAnalyticsEvent(
        AuctionEventName.AuctionBidInputted,
        getAuctionBidInputtedAnalyticsProperties({
          trace,
          chainId,
          auctionContractAddress,
          bidTokenAddress,
          bidTokenAmountRaw,
          bidTokenAmountUsd: budgetField.usdValue ? parseFloat(budgetField.usdValue.toExact()) : undefined,
          maxPriceQ96: maxPriceQ96String,
          maxFdvUsd: maxValuationField.usdValue ? parseFloat(maxValuationField.usdValue.toExact()) : undefined,
          pricePerToken: maxValuationField.tokenValue ? parseFloat(maxValuationField.tokenValue) : undefined,
          expectedReceiveAmount,
          minExpectedReceiveAmount,
          maxReceivableAmount,
          tokenSymbol: auctionTokenSymbol,
          isCentralizedPricesEnabled,
        }),
      )
    }
  })

  // Callback to set the minimum valid bid when simulation fails
  const handleSetMinBid = useCallback(
    (minBidDisplay: string) => {
      // Close the review modal
      setIsReviewModalOpen(false)
      // Update the max valuation field with the minimum valid bid
      maxValuationField.onTokenValueChange(minBidDisplay)
    },
    [maxValuationField],
  )

  return (
    <Flex flexDirection="column" gap="$spacing8">
      <AuctionAccessIndicators />
      <BidFormWarningBanner isVisible={shouldShowWarningBanner} />
      <Flex flexGrow={1} justifyContent="space-between" gap="$spacing16">
        <Flex gap="$spacing12">
          {showDisabledState && (
            <InlineAlertBanner
              title={t('toucan.auction.bidForm.auctionConcluded')}
              description={t('toucan.auction.bidForm.auctionConcluded.description')}
            />
          )}
          <Flex
            opacity={shouldDisableBidForm ? 0.54 : 1}
            pointerEvents={shouldDisableBidForm ? 'none' : 'auto'}
            onFocus={() => setBidInputFocused(true)}
            onBlur={() => setBidInputFocused(false)}
          >
            <Flex flexDirection="column">
              <BidBudgetInput
                label={t('toucan.bidForm.maxBudget')}
                field={budgetField}
                disabled={!isAuctionInProgress}
              />
              <VerticalLineContainer>
                <VerticalLine />
              </VerticalLineContainer>
              <BidMaxValuationInputV2
                label={t('toucan.bidDetails.label.maxFdv')}
                field={maxValuationField}
                auctionTokenDecimals={auctionTokenDecimals}
                tokenColor={validTokenColor ?? effectiveTokenColor}
                disabled={!isAuctionInProgress}
              />
              {!isAuctionEnded && (
                <>
                  <VerticalLineContainer>
                    <VerticalLine />
                  </VerticalLineContainer>
                  <BidReceiveOutput
                    expectedAmount={expectedReceiveAmount}
                    minExpectedAmount={minExpectedReceiveAmount}
                    maxAvailableAmount={maxReceivableAmount}
                    tokenSymbol={auctionTokenSymbol}
                    maxPriceQ96={maxPriceQ96}
                    bidTokenDecimals={bidTokenDecimals}
                    budgetAmount={
                      budgetField.currencyAmount ? parseFloat(budgetField.currencyAmount.toExact()) : undefined
                    }
                    bidTokenSymbol={bidTokenSymbol}
                  />
                </>
              )}
            </Flex>
          </Flex>
        </Flex>
        <Flex flexDirection="column" gap="$spacing8">
          {shouldShowSwapBanner && (
            <NoBidTokenBanner
              chainId={chainId}
              bidCurrencyAddress={bidCurrencyAddress}
              bidTokenSymbol={bidTokenSymbol}
              isNativeBidToken={isNativeBidToken}
              auctionTokenName={auctionTokenName}
            />
          )}
          {shouldShowTokenWarning && token && (
            <TokenWarningCard currencyInfo={token} onPress={() => setShowTokenWarningModal(true)} />
          )}
          <BidFormActionButton
            isGeoRestricted={isGeoRestricted}
            geoTokenSymbol={token?.currency.symbol}
            needsTestnetModeSwitch={needsTestnetModeSwitch}
            isWalletConnected={isWalletConnected}
            kycStatus={kycStatus}
            buttonLabel={buttonLabel}
            buttonDisabled={buttonDisabled}
            onButtonPress={handleButtonPress}
            onKycRejected={() => setIsKycFailedModalOpen(true)}
            onKycInterstitial={() => setIsKycInterstitialModalOpen(true)}
          />
        </Flex>
      </Flex>
      <BidReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        submitState={submitState}
        budgetField={budgetField}
        maxValuationField={maxValuationField}
        onSetMinBid={handleSetMinBid}
      />
      <KycInterstitialModal
        isOpen={isKycInterstitialModalOpen}
        onClose={() => setIsKycInterstitialModalOpen(false)}
        onContinue={kycStatus.onKycAction}
      />
      <KycFailedModal isOpen={isKycFailedModalOpen} onClose={() => setIsKycFailedModalOpen(false)} />
      {shouldShowTokenWarning && token && (
        <TokenWarningModal
          currencyInfo0={token}
          isInfoOnlyWarning
          isVisible={showTokenWarningModal}
          closeModalOnly={() => setShowTokenWarningModal(false)}
          onAcknowledge={() => setShowTokenWarningModal(false)}
        />
      )}
    </Flex>
  )
}
