import { Trans } from 'i18n'
import { DefaultTheme } from 'lib/styled-components'
import { PriceImpact } from 'nft/hooks/usePriceImpact'
import { ReactNode } from 'react'

export enum BuyButtonStates {
  WALLET_NOT_CONNECTED,
  NOT_SUPPORTED_CHAIN,
  INSUFFICIENT_BALANCE,
  ERROR,
  IN_WALLET_CONFIRMATION,
  PROCESSING_TRANSACTION,
  FETCHING_TOKEN_ROUTE,
  INVALID_TOKEN_ROUTE,
  NO_TOKEN_ROUTE_FOUND,
  LOADING_ALLOWANCE,
  IN_WALLET_ALLOWANCE_APPROVAL,
  PROCESSING_APPROVAL,
  REQUIRE_APPROVAL,
  CONFIRM_UPDATED_PRICE,
  PRICE_IMPACT_HIGH,
  PAY,
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
  theme: DefaultTheme,
  handleClickOverride?: (() => void) | (() => Promise<void>),
  usingPayWithAnyToken?: boolean,
  priceImpact?: PriceImpact,
): BuyButtonStateData {
  const defaultBuyButtonState: BuyButtonStateData = {
    handleClick: () => undefined,
    buttonText: <Trans i18nKey="common.somethingWentWrong.error" />,
    disabled: true,
    warningText: undefined,
    warningTextColor: theme.deprecated_accentWarning,
    helperText: undefined,
    helperTextColor: theme.neutral2,
    buttonColor: theme.accent1,
    buttonTextColor: theme.deprecated_accentTextLightPrimary,
  }

  const buyButtonStateData: Record<BuyButtonStates, BuyButtonStateData> = {
    [BuyButtonStates.WALLET_NOT_CONNECTED]: {
      ...defaultBuyButtonState,
      handleClick: handleClickOverride ?? (() => undefined),
      disabled: false,
      buttonText: <Trans i18nKey="common.connectWallet.button" />,
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
      buttonColor: theme.surface3,
      buttonTextColor: theme.neutral1,
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
      warningTextColor: theme.accent1,
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
