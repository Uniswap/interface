import { ConnectWalletButtonText } from 'components/NavBar/accountCTAsExperimentUtils'
import { PriceImpact } from 'nft/hooks/usePriceImpact'
import { ReactNode } from 'react'
import { Trans } from 'react-i18next'
import { useSporeColors } from 'ui/src'

export enum BuyButtonStates {
  WALLET_NOT_CONNECTED = 0,
  NOT_SUPPORTED_CHAIN = 1,
  INSUFFICIENT_BALANCE = 2,
  ERROR = 3,
  IN_WALLET_CONFIRMATION = 4,
  PROCESSING_TRANSACTION = 5,
  FETCHING_TOKEN_ROUTE = 6,
  INVALID_TOKEN_ROUTE = 7,
  NO_TOKEN_ROUTE_FOUND = 8,
  LOADING_ALLOWANCE = 9,
  IN_WALLET_ALLOWANCE_APPROVAL = 10,
  PROCESSING_APPROVAL = 11,
  REQUIRE_APPROVAL = 12,
  CONFIRM_UPDATED_PRICE = 13,
  PRICE_IMPACT_HIGH = 14,
  PAY = 15,
}

export interface BuyButtonStateData {
  handleClick: (() => void) | (() => Promise<void>)
  buttonText: ReactNode
  disabled: boolean
  warningText?: ReactNode
  warningTextColor: string
  helperText?: ReactNode
  helperTextColor: string
  buttonColor: string
  buttonTextColor: string
}

export function getBuyButtonStateData(
  buyButtonState: BuyButtonStates,
  themeColors: ReturnType<typeof useSporeColors>,
  handleClickOverride?: (() => void) | (() => Promise<void>),
  usingPayWithAnyToken?: boolean,
  priceImpact?: PriceImpact,
): BuyButtonStateData {
  const defaultBuyButtonState: BuyButtonStateData = {
    handleClick: () => undefined,
    buttonText: <Trans i18nKey="common.card.error.description" />,
    disabled: true,
    warningText: undefined,
    warningTextColor: themeColors.statusWarning.val,
    helperText: undefined,
    helperTextColor: themeColors.neutral2.val,
    buttonColor: themeColors.accent1.val,
    buttonTextColor: themeColors.white.val,
  }

  const buyButtonStateData: Record<BuyButtonStates, BuyButtonStateData> = {
    [BuyButtonStates.WALLET_NOT_CONNECTED]: {
      ...defaultBuyButtonState,
      handleClick: handleClickOverride ?? (() => undefined),
      disabled: false,
      buttonText: <ConnectWalletButtonText />,
    },
    [BuyButtonStates.NOT_SUPPORTED_CHAIN]: {
      ...defaultBuyButtonState,
      handleClick: handleClickOverride ?? (() => undefined),
      buttonText: <Trans i18nKey="common.switchNetworks" />,
      disabled: false,
      warningText: <Trans i18nKey="common.wrongNetwork" />,
    },
    [BuyButtonStates.INSUFFICIENT_BALANCE]: {
      ...defaultBuyButtonState,
      buttonText: <Trans i18nKey="common.pay.button" />,
      warningText: <Trans i18nKey="common.insufficient.funds" />,
    },
    [BuyButtonStates.ERROR]: {
      ...defaultBuyButtonState,
      warningText: <Trans i18nKey="common.error.wrong.tryAgain" />,
    },
    [BuyButtonStates.IN_WALLET_CONFIRMATION]: {
      ...defaultBuyButtonState,
      buttonText: <Trans i18nKey="common.proceedInWallet.short" />,
    },
    [BuyButtonStates.PROCESSING_TRANSACTION]: {
      ...defaultBuyButtonState,
      buttonText: <Trans i18nKey="common.transactionPending" />,
    },
    [BuyButtonStates.FETCHING_TOKEN_ROUTE]: {
      ...defaultBuyButtonState,
      buttonText: <Trans i18nKey="common.fetchingRoute" />,
    },
    [BuyButtonStates.INVALID_TOKEN_ROUTE]: {
      ...defaultBuyButtonState,
      buttonText: <Trans i18nKey="common.pay.button" />,
    },
    [BuyButtonStates.NO_TOKEN_ROUTE_FOUND]: {
      ...defaultBuyButtonState,
      buttonText: <Trans i18nKey="common.insufficientLiquidity" />,
      buttonColor: themeColors.surface3.val,
      buttonTextColor: themeColors.neutral1.val,
      helperText: <Trans i18nKey="transaction.insufficientLiquidity" />,
    },
    [BuyButtonStates.LOADING_ALLOWANCE]: {
      ...defaultBuyButtonState,
      buttonText: <Trans i18nKey="common.loadingAllowance" />,
    },
    [BuyButtonStates.IN_WALLET_ALLOWANCE_APPROVAL]: {
      ...defaultBuyButtonState,
      buttonText: <Trans i18nKey="swap.approveInWallet" />,
    },
    [BuyButtonStates.PROCESSING_APPROVAL]: {
      ...defaultBuyButtonState,
      buttonText: <Trans i18nKey="swap.approvalPending" />,
    },
    [BuyButtonStates.REQUIRE_APPROVAL]: {
      ...defaultBuyButtonState,
      disabled: false,
      handleClick: handleClickOverride ?? (() => undefined),
      helperText: <Trans i18nKey="swap.approvalNeeded" />,
      buttonText: <Trans i18nKey="common.approve" />,
    },
    [BuyButtonStates.CONFIRM_UPDATED_PRICE]: {
      ...defaultBuyButtonState,
      handleClick: handleClickOverride ?? (() => undefined),
      disabled: false,
      warningTextColor: themeColors.accent1.val,
      warningText: <Trans i18nKey="common.priceUpdated" />,
      buttonText: <Trans i18nKey="common.pay.button" />,
    },
    [BuyButtonStates.PRICE_IMPACT_HIGH]: {
      ...defaultBuyButtonState,
      handleClick: handleClickOverride ?? (() => undefined),
      disabled: false,
      buttonColor: priceImpact ? priceImpact.priceImpactSeverity.color : defaultBuyButtonState.buttonColor,
      helperText: <Trans i18nKey="common.priceImpact" />,
      helperTextColor: priceImpact ? priceImpact.priceImpactSeverity.color : defaultBuyButtonState.helperTextColor,
      buttonText: <Trans i18nKey="swap.payAnyway" />,
    },
    [BuyButtonStates.PAY]: {
      ...defaultBuyButtonState,
      handleClick: handleClickOverride ?? (() => undefined),
      disabled: false,
      buttonText: <Trans i18nKey="common.pay.button" />,
      helperText: usingPayWithAnyToken ? <Trans i18nKey="nft.refundsInEth" /> : undefined,
    },
  }

  return buyButtonStateData[buyButtonState]
}
