/* eslint-disable max-lines */
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TransactionStep, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import CurrencyLogo from '~/components/Logo/CurrencyLogo'
import {
  BidProgressIndicator,
  ProgressIndicatorStep,
} from '~/components/Toucan/Auction/BidForm/BidReviewModal/BidProgressIndicator'
import { BidReviewHeader } from '~/components/Toucan/Auction/BidForm/BidReviewModal/BidReviewHeader'
import { ExpandableDisclaimer } from '~/components/Toucan/Auction/BidForm/BidReviewModal/ExpandableDisclaimer'
import { useBidConfirmModalState } from '~/components/Toucan/Auction/BidForm/BidReviewModal/useBidConfirmModalState'
import { useBidPermit2Flow } from '~/components/Toucan/Auction/BidForm/BidReviewModal/useBidPermit2Flow'
import { useBidReviewData } from '~/components/Toucan/Auction/BidForm/BidReviewModal/useBidReviewData'
import {
  BidSimulationErrorType,
  useBidSimulation,
} from '~/components/Toucan/Auction/BidForm/BidReviewModal/useBidSimulation'
import { useRefreshCheckpointOnOpen } from '~/components/Toucan/Auction/BidForm/BidReviewModal/useRefreshCheckpointOnOpen'
import { BudgetFieldState } from '~/components/Toucan/Auction/hooks/useBidBudgetField'
import { SubmitState } from '~/components/Toucan/Auction/hooks/useBidFormSubmit'
import { MaxValuationFieldState } from '~/components/Toucan/Auction/hooks/useBidMaxValuationField'
import { useBidTokenInfo } from '~/components/Toucan/Auction/hooks/useBidTokenInfo'
import { useAuctionStore } from '~/components/Toucan/Auction/store/useAuctionStore'
import { getClearingPrice } from '~/components/Toucan/Auction/utils/clearingPrice'
import { SubscriptZeroPrice } from '~/components/Toucan/Shared/SubscriptZeroPrice'
import { ToucanActionButton } from '~/components/Toucan/Shared/ToucanActionButton'
import { useAccount } from '~/hooks/useAccount'
import { AllowanceState } from '~/hooks/usePermit2Allowance'
import { PendingModalError } from '~/pages/Swap/Limit/ConfirmSwapModal/Error'
import { ConfirmModalState } from '~/pages/Swap/Limit/ConfirmSwapModal/state'
import { swapErrorToUserReadableMessage } from '~/utils/swapErrorToUserReadableMessage'

interface BidReviewModalProps {
  isOpen: boolean
  onClose: () => void
  submitState: SubmitState
  budgetField: BudgetFieldState
  maxValuationField: MaxValuationFieldState
  onSetMinBid?: (minBidDisplay: string) => void
}

const PLACEHOLDER = '—'

export function BidReviewModal({
  isOpen,
  onClose,
  submitState,
  budgetField,
  maxValuationField,
  onSetMinBid,
}: BidReviewModalProps): JSX.Element | null {
  const { t } = useTranslation()
  const { formatCurrencyAmount } = useLocalizationContext()
  const account = useAccount()

  const { auctionDetails, checkpointData } = useAuctionStore((state) => ({
    auctionDetails: state.auctionDetails,
    checkpointData: state.checkpointData,
  }))

  const [transactionSteps, setTransactionSteps] = useState<TransactionStep[]>([])
  const [currentStep, setCurrentStep] = useState<{ step: TransactionStep; accepted: boolean }>()

  const budgetAmount = budgetField.currencyAmount ?? undefined
  const bidCurrencyInfo = budgetField.currencyInfo
  const bidCurrency = budgetAmount?.currency ?? bidCurrencyInfo?.currency
  const budgetSymbol = bidCurrency?.symbol ?? ''

  const maxValuationAmount = maxValuationField.currencyAmount ?? undefined

  const maxValuationCurrencyInfo = maxValuationField.currencyInfo
  const fallbackBidTokenDecimals = maxValuationCurrencyInfo ? maxValuationCurrencyInfo.currency.decimals : undefined

  const clearingPriceString = getClearingPrice(checkpointData, auctionDetails)
  const clearingPriceQ96 = useMemo(() => {
    if (clearingPriceString === '0') {
      return undefined
    }
    return BigInt(clearingPriceString)
  }, [clearingPriceString])

  const floorPriceQ96 = useMemo(() => {
    if (!auctionDetails?.floorPrice) {
      return undefined
    }
    return BigInt(auctionDetails.floorPrice)
  }, [auctionDetails?.floorPrice])

  const tickSizeQ96 = useMemo(() => {
    if (!auctionDetails?.tickSize) {
      return undefined
    }
    return BigInt(auctionDetails.tickSize)
  }, [auctionDetails?.tickSize])

  // Get bid token info for FDV fiat calculation
  const { bidTokenInfo } = useBidTokenInfo({
    bidTokenAddress: auctionDetails?.currency,
    chainId: auctionDetails?.chainId as UniverseChainId | undefined,
  })

  // Refresh checkpoint data when modal opens
  const { isRefreshing: isRefreshingCheckpoint, refreshCheckpoint } = useRefreshCheckpointOnOpen({
    isOpen,
    chainId: auctionDetails?.chainId,
    auctionAddress: auctionDetails?.address,
  })

  const {
    allowance,
    needsPermit2Allowance,
    permit2ApprovalPending,
    shouldEstimateGas,
    buildPreBidSteps,
    canSimulatePrePermit2,
  } = useBidPermit2Flow({
    budgetAmount,
    bidCurrency,
    auctionDetails,
  })

  const reviewData = useBidReviewData({
    isOpen,
    submitState,
    budgetAmount,
    maxValuationAmount,
    budgetSymbol,
    auctionChainId: auctionDetails?.chainId,
    auctionAddress: auctionDetails?.address,
    shouldEstimateGas,
    clearingPriceQ96,
    floorPriceQ96,
    tickSizeQ96,
    fallbackBidTokenDecimals,
    totalSupply: auctionDetails?.tokenTotalSupply,
    auctionTokenDecimals: auctionDetails?.token?.currency.decimals,
    bidTokenPriceFiat: bidTokenInfo?.priceFiat,
  })

  const {
    preparedBid,
    isPreparing,
    preparationError,
    maxPricePerTokenDecimal,
    maxFdvFormatted,
    maxFdvFiatFormatted,
    maxFdvPreciseFormatted,
    isPriceBelowClearing,
    formattedGasFee,
    isConfirmDisabled,
    retryPreparation,
    minValidBidDisplay,
  } = reviewData

  // Set up bid simulation
  const { simulationError, isSimulating, simulate, retryWithMinBid, clearSimulationError } = useBidSimulation({
    preparedBid,
    chainId: auctionDetails?.chainId,
    accountAddress: account.address,
    auctionContractAddress: auctionDetails?.address,
    minValidBidDisplay,
    onSetMinBid,
    onCloseModal: onClose,
    onRefreshCheckpoint: refreshCheckpoint,
  })

  const { confirmModalState, approvalError, startBidFlow, resetToReviewScreen, onCancel, isSubmitting } =
    useBidConfirmModalState({
      preparedBid,
      onSubmit: submitState.onSubmit,
      isOpen,
    })

  const formatAmountWithSymbol = (amount?: CurrencyAmount<Currency>): string => {
    if (!amount) {
      return PLACEHOLDER
    }

    const formatted = formatCurrencyAmount({ value: amount, type: NumberType.TokenNonTx })
    const symbol = amount.currency.symbol ?? ''
    return symbol ? `${formatted} ${symbol}` : formatted
  }

  const budgetDisplay = formatAmountWithSymbol(budgetAmount)
  const budgetDecimal = useMemo(() => {
    if (!budgetAmount) {
      return undefined
    }
    const exact = Number(budgetAmount.toExact())
    return Number.isFinite(exact) ? exact : undefined
  }, [budgetAmount])

  const isReviewing = confirmModalState === ConfirmModalState.REVIEWING
  const isApprovalLoading = allowance.state === AllowanceState.LOADING

  // Determine if we're in a loading state
  const isLoading = isPreparing || isApprovalLoading || isSimulating || isRefreshingCheckpoint

  const reviewButtonLabel = isSubmitting
    ? t('common.confirmWallet')
    : isSimulating
      ? t('toucan.bidReview.simulating')
      : isPreparing || isRefreshingCheckpoint
        ? t('common.loading')
        : isApprovalLoading
          ? t('common.loading')
          : isPriceBelowClearing
            ? t('toucan.bidReview.priceExceededCta')
            : t('toucan.bidReview.placeBid')

  const handleSubmit = useEvent(async () => {
    if (!preparedBid || isConfirmDisabled || isApprovalLoading || !isReviewing || isSimulating) {
      return
    }

    // Clear any previous simulation errors
    clearSimulationError()

    // Run pre-permit2 simulation if eligible (native token or already approved)
    if (canSimulatePrePermit2) {
      const simulationSuccess = await simulate()
      if (!simulationSuccess) {
        // Simulation failed - error state will be set by the hook
        return
      }
    }

    const preBidSteps = await buildPreBidSteps()

    // Create post-permit2 simulation callback for non-native tokens with permit steps
    const onPreBidStepsComplete = !canSimulatePrePermit2
      ? async (): Promise<boolean> => {
          const success = await simulate()
          return success
        }
      : undefined

    startBidFlow({
      preBidSteps,
      showProgressModal: preBidSteps.length > 0,
      setSteps: setTransactionSteps,
      setCurrentStep,
      onPreBidStepsComplete,
    })
  })

  // Reset submission status if an error occurs (including wallet rejections)
  useEffect(() => {
    if (!submitState.error) {
      return
    }
    resetToReviewScreen()
  }, [resetToReviewScreen, submitState.error])

  useEffect(() => {
    if (!isOpen) {
      onCancel()
      submitState.clearError()
      clearSimulationError()
      setTransactionSteps([])
      setCurrentStep(undefined)
    }
  }, [isOpen, onCancel, submitState, clearSimulationError])

  const handleClose = useEvent(() => {
    onCancel()
    onClose()
  })

  const progressSteps = useMemo((): ProgressIndicatorStep[] => {
    if (transactionSteps.length) {
      return transactionSteps.reduce<ProgressIndicatorStep[]>((acc, step) => {
        if (step.type === TransactionStepType.TokenApprovalTransaction) {
          acc.push(ConfirmModalState.APPROVING_TOKEN)
        } else if (step.type === TransactionStepType.Permit2Transaction) {
          acc.push(ConfirmModalState.PERMITTING)
        } else if (step.type === TransactionStepType.ToucanBidTransactionStep) {
          acc.push(ConfirmModalState.PENDING_CONFIRMATION)
        }
        return acc
      }, [])
    }
    const fallbackSteps: ProgressIndicatorStep[] = []
    if (allowance.state === AllowanceState.REQUIRED && allowance.needsSetupApproval) {
      fallbackSteps.push(ConfirmModalState.APPROVING_TOKEN)
    }
    if (needsPermit2Allowance) {
      fallbackSteps.push(ConfirmModalState.PERMITTING)
    }
    fallbackSteps.push(ConfirmModalState.PENDING_CONFIRMATION)
    return fallbackSteps
  }, [allowance, needsPermit2Allowance, transactionSteps])

  const currentProgressStep = useMemo((): ProgressIndicatorStep => {
    if (!currentStep) {
      return progressSteps[0] ?? ConfirmModalState.PENDING_CONFIRMATION
    }
    switch (currentStep.step.type) {
      case TransactionStepType.TokenApprovalTransaction:
        return ConfirmModalState.APPROVING_TOKEN
      case TransactionStepType.Permit2Transaction:
        return ConfirmModalState.PERMITTING
      case TransactionStepType.ToucanBidTransactionStep:
        return ConfirmModalState.PENDING_CONFIRMATION
      default:
        return progressSteps[0] ?? ConfirmModalState.PENDING_CONFIRMATION
    }
  }, [currentStep, progressSteps])

  const approvalErrorContent = useMemo(() => {
    if (approvalError === undefined) {
      return undefined
    }
    switch (approvalError) {
      case PendingModalError.TOKEN_APPROVAL_ERROR:
        return {
          title: t('error.tokenApproval'),
          message: t('error.tokenApproval.message'),
        }
      case PendingModalError.PERMIT_ERROR:
        return {
          title: t('permit.approval.fail'),
          message: t('permit.approval.fail.message'),
        }
      case PendingModalError.CONFIRMATION_ERROR:
        return {
          title: t('common.unknownError.error'),
          message: t('toucan.bidReview.confirmationError'),
        }
      default:
        return {
          title: t('common.unknownError.error'),
          message: t('common.unknownError.error'),
        }
    }
  }, [approvalError, t])

  const submitErrorMessage = useMemo(() => {
    if (!submitState.error) {
      return undefined
    }
    return swapErrorToUserReadableMessage(t, submitState.error)
  }, [submitState.error, t])

  const showFlowError = Boolean(approvalError || submitState.error)
  const preparationErrorDetail = maxValuationField.error ?? preparationError?.message

  // Show simulation error for below clearing price
  const showSimulationBelowClearingError =
    simulationError?.type === BidSimulationErrorType.BELOW_CLEARING_PRICE && isReviewing

  // Early return if no auction details or missing chainId
  if (!auctionDetails?.chainId) {
    return null
  }

  return (
    <Modal
      name={ModalName.BidReview}
      isModalOpen={isOpen}
      onClose={handleClose}
      padding="$spacing0"
      maxWidth={420}
      pt="$spacing8"
      pb="$spacing8"
      paddingX="$spacing8"
    >
      <Flex width="100%" gap="$spacing16">
        <Flex gap="$spacing16" px="$spacing4">
          <BidReviewHeader auctionDetails={auctionDetails} onClose={handleClose} />

          {isReviewing ? (
            <Flex gap="$spacing16" pb="$spacing12">
              <Flex row alignItems="center" justifyContent="space-between" gap="$spacing12">
                <Flex gap="$spacing4">
                  <Text variant="body2" color="$neutral2">
                    {t('toucan.bidReview.maxBudget')}
                  </Text>
                  {budgetDecimal !== undefined && Math.abs(budgetDecimal) < 1 ? (
                    <SubscriptZeroPrice
                      value={budgetDecimal}
                      symbol={budgetSymbol}
                      variant="heading3"
                      color="$neutral1"
                      minSignificantDigits={1}
                      maxSignificantDigits={3}
                    />
                  ) : (
                    <Text variant="heading3" color="$neutral1">
                      {budgetDisplay}
                    </Text>
                  )}
                </Flex>
                {bidCurrency ? <CurrencyLogo currency={bidCurrency} size={40} /> : null}
              </Flex>

              <Flex gap="$spacing4">
                <Text variant="body2" color="$neutral2">
                  {t('toucan.bidReview.maxFdv')}
                </Text>
                <Text variant="heading3" color="$neutral1">
                  {maxFdvFormatted ?? PLACEHOLDER}
                </Text>
                {maxPricePerTokenDecimal !== undefined ? (
                  <Flex row alignItems="baseline" gap="$none">
                    <SubscriptZeroPrice
                      value={maxPricePerTokenDecimal}
                      symbol={budgetSymbol}
                      variant="body4"
                      color="$neutral2"
                      subscriptThreshold={3}
                    />
                    <Text variant="body4" color="$neutral2">
                      {` ${t('toucan.bidReview.perTokenSuffix')}`}
                    </Text>
                  </Flex>
                ) : null}
              </Flex>

              {/* Info box with partial fill explanation and disclaimer */}
              <Flex backgroundColor="$surface2" borderRadius="$rounded12" p="$spacing12" gap="$spacing8">
                {maxFdvPreciseFormatted && maxFdvFiatFormatted ? (
                  <Text variant="body4" color="$neutral2">
                    <Trans
                      i18nKey="toucan.bidReview.partialFillExplanation"
                      values={{
                        symbol: auctionDetails.tokenSymbol || auctionDetails.token?.currency.symbol || 'token',
                        maxFdv: maxFdvPreciseFormatted,
                        maxFdvFiat: maxFdvFiatFormatted,
                      }}
                      components={{
                        highlight: <Text variant="body4" color="$neutral1" />,
                        fiat: <Text variant="body4" color="$neutral2" />,
                      }}
                    />
                  </Text>
                ) : null}
                <ExpandableDisclaimer />
              </Flex>
            </Flex>
          ) : (
            <Flex pb="$spacing12">
              {progressSteps.length ? (
                <BidProgressIndicator
                  steps={progressSteps}
                  currentStep={currentProgressStep}
                  bidCurrencyInfo={bidCurrencyInfo}
                  bidCurrencySymbol={budgetSymbol}
                  auctionTokenInfo={auctionDetails.token}
                  tokenApprovalPending={allowance.state === AllowanceState.REQUIRED && allowance.isApprovalPending}
                  permit2ApprovalPending={permit2ApprovalPending}
                  isSubmitting={isSubmitting}
                />
              ) : null}
            </Flex>
          )}
        </Flex>

        <Flex height={1} width="100%" backgroundColor="$surface3" />

        <Flex gap="$spacing8" px="$spacing4">
          <Flex row alignItems="center" justifyContent="space-between">
            <Text variant="body3" color="$neutral2">
              {t('common.networkCost')}
            </Text>
            <Text variant="body3" color="$neutral1">
              {formattedGasFee ?? PLACEHOLDER}
            </Text>
          </Flex>

          {preparationError ? (
            <Flex
              row
              gap="$spacing12"
              backgroundColor="$surface2"
              borderRadius="$rounded12"
              padding="$spacing12"
              alignItems="flex-start"
            >
              <AlertTriangleFilled color="$statusCritical" size="$icon.20" />
              <Flex gap="$spacing2" flex={1}>
                <Text variant="body3" color="$statusCritical">
                  {t('toucan.bidReview.preparationError')}
                </Text>
                <Text variant="body3" color="$neutral2">
                  {preparationErrorDetail ?? t('toucan.bidReview.preparationErrorDescription')}
                </Text>
                <Text variant="body3" color="$accent1" cursor="pointer" onPress={retryPreparation} mt="$spacing4">
                  {t('common.tryAgain.error')}
                </Text>
              </Flex>
            </Flex>
          ) : null}

          {showFlowError ? (
            <Flex
              row
              gap="$spacing12"
              backgroundColor="$surface2"
              borderRadius="$rounded12"
              padding="$spacing12"
              alignItems="flex-start"
            >
              <AlertTriangleFilled color="$statusCritical" size="$icon.20" />
              <Flex gap="$spacing2" flex={1}>
                <Text variant="body3" color="$statusCritical">
                  {approvalErrorContent?.title ?? t('common.error.label')}
                </Text>
                <Text variant="body3" color="$neutral2">
                  {approvalErrorContent?.message ?? submitErrorMessage ?? t('common.unknownError.error')}
                </Text>
              </Flex>
            </Flex>
          ) : null}

          {/* Simulation error: bid below clearing price */}
          {showSimulationBelowClearingError ? (
            <Flex
              row
              gap="$spacing12"
              backgroundColor="$surface2"
              borderRadius="$rounded12"
              padding="$spacing12"
              alignItems="flex-start"
            >
              <AlertTriangleFilled color="$statusCritical" size="$icon.20" />
              <Flex gap="$spacing2" flex={1}>
                <Text variant="body3" color="$statusCritical">
                  {t('toucan.bidReview.belowClearingTitle')}
                </Text>
                <Text variant="body3" color="$neutral2">
                  {t('toucan.bidReview.belowClearingDescription')}
                </Text>
                {minValidBidDisplay && onSetMinBid ? (
                  <Text variant="body3" color="$accent1" cursor="pointer" onPress={retryWithMinBid} mt="$spacing4">
                    {t('toucan.bidReview.setMinBid')}
                  </Text>
                ) : null}
              </Flex>
            </Flex>
          ) : null}

          {isPriceBelowClearing && !showSimulationBelowClearingError ? (
            <Flex
              row
              gap="$spacing12"
              backgroundColor="$surface2"
              borderRadius="$rounded12"
              padding="$spacing12"
              alignItems="flex-start"
            >
              <AlertTriangleFilled color="$statusCritical" size="$icon.20" />
              <Flex gap="$spacing2" flex={1}>
                <Text variant="body3" color="$statusCritical">
                  {t('toucan.bidReview.priceExceededTitle')}
                </Text>
                <Text variant="body3" color="$neutral2">
                  {t('toucan.bidReview.priceExceededDescription', {
                    symbol: auctionDetails.tokenSymbol,
                  })}
                </Text>
              </Flex>
            </Flex>
          ) : null}
        </Flex>

        {isReviewing ? (
          <Flex px="$spacing4">
            <ToucanActionButton
              label={reviewButtonLabel}
              onPress={handleSubmit}
              shouldUseBranded
              isDisabled={
                isConfirmDisabled ||
                isApprovalLoading ||
                isSubmitting ||
                isSimulating ||
                showSimulationBelowClearingError ||
                isPriceBelowClearing
              }
              loading={isLoading || isSubmitting}
            />
          </Flex>
        ) : null}
      </Flex>
    </Modal>
  )
}
