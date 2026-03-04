//! tamagui-ignore
// tamagui-ignore
import { KycVerificationStatus } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, styled, useColorsFromTokenColor } from 'ui/src'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { AuctionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { zeroAddress } from 'viem'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { getAuctionBidInputtedAnalyticsProperties } from '~/components/Toucan/Auction/analytics'
import { BidBudgetInput } from '~/components/Toucan/Auction/BidForm/BidBudgetInput'
import { BidFormWarningBanner } from '~/components/Toucan/Auction/BidForm/BidFormWarningBanner'
import { BidMaxValuationInput } from '~/components/Toucan/Auction/BidForm/BidMaxValuationInput'
import { BidReceiveOutput } from '~/components/Toucan/Auction/BidForm/BidReceiveOutput'
import { BidReviewModal } from '~/components/Toucan/Auction/BidForm/BidReviewModal/BidReviewModal'
import { KycFailedModal } from '~/components/Toucan/Auction/BidForm/KycFailedModal/KycFailedModal'
import { KycInterstitialModal } from '~/components/Toucan/Auction/BidForm/KycInterstitialModal/KycInterstitialModal'
import { NoBidTokenBanner } from '~/components/Toucan/Auction/BidForm/NoBidTokenBanner'
import { useBidFormWarningState } from '~/components/Toucan/Auction/BidForm/useBidFormWarningState'
import { useAuctionKycStatus } from '~/components/Toucan/Auction/hooks/useAuctionKycStatus'
import { useAuctionTokenColor } from '~/components/Toucan/Auction/hooks/useAuctionTokenColor'
import { useBidFormController } from '~/components/Toucan/Auction/hooks/useBidFormController'
import { AuctionProgressState } from '~/components/Toucan/Auction/store/types'
import { useAuctionStore } from '~/components/Toucan/Auction/store/useAuctionStore'
import { InlineAlertBanner } from '~/components/Toucan/Shared/InlineAlertBanner'
import { KycActionButton } from '~/components/Toucan/Shared/KycActionButton'
import { ToucanActionButton } from '~/components/Toucan/Shared/ToucanActionButton'
import { useActiveAddress } from '~/features/accounts/store/hooks'
import { MobileScreen, MobileScreenConfig } from '~/pages/Explore/ToucanToken'

const VerticalLineContainer = styled(Flex, {
  width: '100%',
  paddingLeft: '$spacing32',
  justifyContent: 'flex-start',
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
  setMobileScreenConfig?: (config: MobileScreenConfig) => void
}

export function BidForm({ onInputChange, setMobileScreenConfig }: BidFormProps): JSX.Element {
  const { t } = useTranslation()
  const trace = useTrace()
  const chainId = useAuctionStore((state) => state.auctionDetails?.chainId)
  const auctionContractAddress = useAuctionStore((state) => state.auctionAddress)
  const currency = useAuctionStore((state) => state.auctionDetails?.currency)
  const userBids = useAuctionStore((state) => state.userBids)
  const auctionTokenName = useAuctionStore((state) => state.auctionDetails?.token?.currency.name)
  const { tokenColor, effectiveTokenColor } = useAuctionTokenColor()
  const auctionAddress = useAuctionStore((state) => state.auctionAddress)
  const auctionProgressState = useAuctionStore((state) => state.progress.state)
  const validationHook = useAuctionStore((state) => state.auctionDetails?.validationHook)
  const isAuctionInProgress = auctionProgressState === AuctionProgressState.IN_PROGRESS
  const isAuctionEnded = auctionProgressState === AuctionProgressState.ENDED
  const { validTokenColor } = useColorsFromTokenColor(tokenColor)

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [isKycInterstitialModalOpen, setIsKycInterstitialModalOpen] = useState(false)
  const [isKycFailedModalOpen, setIsKycFailedModalOpen] = useState(false)

  const {
    budgetField,
    maxValuationField,
    submitState,
    totalSupply,
    auctionTokenDecimals,
    expectedReceiveAmount,
    minExpectedReceiveAmount,
    auctionTokenSymbol,
    maxReceivableAmount,
    hasBidToken,
    bidCurrencyAddress,
    bidTokenSymbol,
    isNativeBidToken,
  } = useBidFormController({
    tokenColor: validTokenColor,
    onTransactionSubmitted: () => {
      setIsReviewModalOpen(false)
      setMobileScreenConfig?.({ screen: MobileScreen.BID_FORM, showBidFormModal: false })
    },
    onInputChange,
  })

  const accountAddress = useActiveAddress(chainId ?? UniverseChainId.Sepolia)
  const isWalletConnected = Boolean(accountAddress)
  const accountDrawer = useAccountDrawer()

  const kycStatus = useAuctionKycStatus({
    walletAddress: accountAddress,
    auctionAddress,
    chainId,
  })

  const { showDisabledState, shouldShowWarningBanner, shouldDisableBidForm } = useBidFormWarningState({
    chainId,
    currency,
    auctionProgressState,
    userBids,
    validationHook,
    validationError: kycStatus.isError,
  })

  const handleButtonPress = (): void => {
    if (!isWalletConnected) {
      accountDrawer.open()
      return
    }
    if (kycStatus.canBid) {
      handleReviewBidClick()
    } else if (kycStatus.onKycAction) {
      kycStatus.onKycAction()
    }
  }

  const buttonLabel = !isWalletConnected
    ? t('common.connectWallet.button')
    : (kycStatus.kycButtonLabel ?? showDisabledState)
      ? t('toucan.auction.bidForm.auctionConcluded')
      : t('toucan.bidForm.reviewBid')

  const buttonDisabled = isWalletConnected
    ? submitState.isDisabled || !isAuctionInProgress || shouldDisableBidForm || kycStatus.kycButtonDisabled
    : false

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
    <>
      <Flex flexGrow={1} justifyContent="space-between" gap="$spacing24">
        <Flex gap="$spacing12">
          {showDisabledState && (
            <InlineAlertBanner
              title={t('toucan.auction.bidForm.auctionConcluded')}
              description={t('toucan.auction.bidForm.auctionConcluded.description')}
            />
          )}
          <Flex
            gap="$spacing16"
            opacity={shouldDisableBidForm ? 0.54 : 1}
            pointerEvents={shouldDisableBidForm ? 'none' : 'auto'}
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
              <BidMaxValuationInput
                label={t('toucan.bidForm.maxTokenPrice')}
                field={maxValuationField}
                totalSupply={totalSupply}
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
                  />
                </>
              )}
            </Flex>
          </Flex>
        </Flex>
        <Flex flexDirection="column" gap="$spacing8">
          <BidFormWarningBanner isVisible={shouldShowWarningBanner} />
          {shouldShowSwapBanner && (
            <NoBidTokenBanner
              chainId={chainId}
              bidCurrencyAddress={bidCurrencyAddress}
              bidTokenSymbol={bidTokenSymbol}
              isNativeBidToken={isNativeBidToken}
              auctionTokenName={auctionTokenName}
            />
          )}
          {kycStatus.kycButtonLabel || kycStatus.whitelistLabel ? (
            <KycActionButton
              kycStatus={kycStatus}
              onPress={() =>
                kycStatus.status === KycVerificationStatus.VERIFICATION_STATUS_REJECTED
                  ? setIsKycFailedModalOpen(true)
                  : setIsKycInterstitialModalOpen(true)
              }
            />
          ) : (
            <ToucanActionButton
              label={buttonLabel}
              isDisabled={buttonDisabled}
              onPress={handleButtonPress}
              shouldUseBranded={!isWalletConnected}
            />
          )}
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
    </>
  )
}
