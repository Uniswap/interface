// MOB-2816: move these to analytics-events package
export enum UnitagEventName {
  UnitagBannerActionTaken = 'Unitag Banner Action Taken',
  UnitagOnboardingActionTaken = 'Unitag Onboarding Action Taken',
  UnitagClaimAvailabilityDisplayed = 'Unitag Claim Availability Displayed',
  UnitagClaimed = 'Unitag Claimed',
  UnitagMetadataUpdated = 'Unitag Metadata Updated',
  UnitagChanged = 'Unitag Changed',
  UnitagRemoved = 'Unitag Removed',
}

export enum FiatOffRampEventName {
  FORBuySellToggled = 'Fiat OnRamp Buy Sell Toggled',
  FiatOffRampAmountEntered = 'Fiat OffRamp Amount Entered',
  FiatOffRampTokenSelected = 'Fiat OffRamp Token Selected',
  FiatOffRampUnsupportedTokenBack = 'Fiat OffRamp Unsupported Token Modal Back Button Pressed',
  FiatOffRampUnsupportedTokenSwap = 'Fiat OffRamp Unsupported Token Modal Swap Button Pressed',
  FiatOffRampWidgetOpened = 'Fiat OffRamp Widget Opened',
  FiatOffRampWidgetCompleted = 'Fiat OffRamp Widget Completed',
  FiatOffRampFundsSent = 'Fiat OffRamp Funds Sent',
  FiatOffRampPaymentMethodFilterSelected = 'Fiat OffRamp Payment Method Filter Selected',
}

export enum FiatOnRampEventName {
  FiatOnRampAmountEntered = 'Fiat OnRamp Amount Entered',
  FiatOnRampTransactionUpdated = 'Fiat OnRamp Transaction Updated',
  FiatOnRampTokenSelected = 'Fiat OnRamp Token Selected',
  FiatOnRampWidgetOpened = 'Fiat OnRamp Widget Opened',
  FiatOnRampTransferWidgetOpened = 'Fiat OnRamp Transfer Widget Opened',
  FiatOnRampPaymentMethodFilterSelected = 'Fiat OnRamp Payment Method Filter Selected',
}

export enum EarnEventName {
  EarnDepositCompleted = 'Earn Deposit Completed',
  EarnDepositFailed = 'Earn Deposit Failed',
  EarnDepositStarted = 'Earn Deposit Started',
  EarnDepositSubmitted = 'Earn Deposit Submitted',
  EarnSwapUpsellConverted = 'Earn Swap Upsell Converted',
  EarnSwapUpsellToastClicked = 'Earn Swap Upsell Toast Clicked',
  EarnSwapUpsellToastDismissed = 'Earn Swap Upsell Toast Dismissed',
  EarnSwapUpsellToastShown = 'Earn Swap Upsell Toast Shown',
  EarnSwapUpsellToggleChanged = 'Earn Swap Upsell Toggle Changed',
  EarnSwapUpsellToggleShown = 'Earn Swap Upsell Toggle Shown',
  EarnVaultSelected = 'Earn Vault Selected',
  EarnWithdrawCompleted = 'Earn Withdraw Completed',
  EarnWithdrawFailed = 'Earn Withdraw Failed',
  EarnWithdrawStarted = 'Earn Withdraw Started',
  EarnWithdrawSubmitted = 'Earn Withdraw Submitted',
}

export enum SwapEventName {
  SwapAutorouterVisualizationExpanded = 'Swap Autorouter Visualization Expanded',
  SwapBlocked = 'Swap Blocked',
  SwapDetailsExpanded = 'Swap Details Expanded',
  SwapError = 'Swap Error',
  SwapEstimateGasCallFailed = 'Swap Estimate Gas Call Failed',
  SwapFirstAction = 'Swap First Action',
  SwapFirstSignatureRequested = 'Swap First Signature Requested',
  SwapMaxTokenAmountSelected = 'Swap Max Token Amount Selected',
  SwapModifiedInWallet = 'Swap Modified in Wallet',
  SwapPreselectAssetSelected = 'Swap Preselect Asset Selected',
  SwapPresetTokenAmountSelected = 'Swap Preset Token Amount Selected',
  SwapPriceUpdateAcknowledged = 'Swap Price Update Acknowledged',
  SwapQuoteFetch = 'Swap Quote Fetch',
  SwapQuoteReceived = 'Swap Quote Received',
  SwapQuoteFailed = 'Swap Quote Failed',
  SwapSigned = 'Swap Signed',
  SponsoredApprovalRequested = 'Sponsored Approval Requested',
  SponsoredApprovalSubmitted = 'Sponsored Approval Submitted',
  SponsoredApprovalConfirmed = 'Sponsored Approval Confirmed',
  SponsoredApprovalFailed = 'Sponsored Approval Failed',
  SwapSubmittedButtonClicked = 'Swap Submit Button Clicked',
  SwapTokensReversed = 'Swap Tokens Reversed',
  SwapTransactionCompleted = 'Swap Transaction Completed',
  SwapTransactionFailed = 'Swap Transaction Failed',
}

export enum SwapBlockedCategory {
  JupiterUnactionableQuote = 'Jupiter Unactionable Quote',
  QuoteSimulationFailure = 'EVM Quote Simulation Failure',
  CalldataFetchFailure = 'EVM Calldata Fetch Failure',
  CalldataSimulationFailure = 'EVM Calldata Simulation Failure',
}

export enum LiquidityEventName {
  AddLiquiditySubmitted = 'Add Liquidity Submitted',
  CollectLiquiditySubmitted = 'Collect Liquidity Submitted',
  MigrateLiquiditySubmitted = 'Migrate Liquidity Submitted',
  RemoveLiquiditySubmitted = 'Remove Liquidity Submitted',
  SelectLiquidityPoolFeeTier = 'Select Liquidity Pool Fee Tier',
  TransactionModifiedInWallet = 'Transaction Modified in Wallet',
}

export enum AuctionEventName {
  AuctionWithdrawSubmitted = 'Auction Withdraw Submitted',
  AuctionBidSubmitted = 'Auction Bid Submitted',
  AuctionBidInputted = 'Auction Bid Inputted',
  // Launch-auction (CCA supply-side) creation funnel
  AuctionTokenInfoEntered = 'Auction Token Info Entered',
  AuctionVerifyCompleted = 'Auction Verify Completed',
  AuctionDetailsInfoEntered = 'Auction Details Info Entered',
  PoolDetailsInfoEntered = 'Pool Details Info Entered',
  AuctionCustomPriceRangeAdded = 'Auction Custom Price Range Added',
  // Fired only from the launch-auction flow; the shared fee-tier modal forwards a CCA-only callback.
  FeeTierCreated = 'Fee Tier Created',
  AuctionCreateSubmitted = 'Auction Create Submitted',
  AuctionCreateFailed = 'Auction Create Failed',
  AuctionCreateCompleted = 'Auction Create Completed',
}
