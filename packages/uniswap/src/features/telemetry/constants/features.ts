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
  SwapPriceImpactAcknowledged = 'Swap Price Impact Acknowledged',
  SwapPriceUpdateAcknowledged = 'Swap Price Update Acknowledged',
  SwapQuoteFetch = 'Swap Quote Fetch',
  SwapQuoteReceived = 'Swap Quote Received',
  SwapQuoteFailed = 'Swap Quote Failed',
  SwapSigned = 'Swap Signed',
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
  PriceDiscrepancyChecked = 'Price Discrepancy Checked',
}
