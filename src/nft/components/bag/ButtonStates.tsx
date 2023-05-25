import { Trans } from '@lingui/macro'
import { PriceImpact } from 'nft/hooks/usePriceImpact'
import { ReactNode } from 'react'
import { DefaultTheme } from 'styled-components/macro'

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
  priceImpact?: PriceImpact
): BuyButtonStateData {
  const defaultBuyButtonState: BuyButtonStateData = {
    handleClick: () => undefined,
    buttonText: <Trans>Something went wrong</Trans>,
    disabled: true,
    warningText: undefined,
    warningTextColor: theme.accentWarning,
    helperText: undefined,
    helperTextColor: theme.textSecondary,
    buttonColor: theme.accentAction,
    buttonTextColor: theme.accentTextLightPrimary,
  }

  const buyButtonStateData: Record<BuyButtonStates, BuyButtonStateData> = {
    [BuyButtonStates.WALLET_NOT_CONNECTED]: {
      ...defaultBuyButtonState,
      handleClick: handleClickOverride ?? (() => undefined),
      disabled: false,
      buttonText: <Trans>Connect wallet</Trans>,
    },
    [BuyButtonStates.NOT_SUPPORTED_CHAIN]: {
      ...defaultBuyButtonState,
      handleClick: handleClickOverride ?? (() => undefined),
      buttonText: <Trans>Switch networks</Trans>,
      disabled: false,
      warningText: <Trans>Wrong network</Trans>,
    },
    [BuyButtonStates.INSUFFICIENT_BALANCE]: {
      ...defaultBuyButtonState,
      buttonText: <Trans>Pay</Trans>,
      warningText: <Trans>Insufficient funds</Trans>,
    },
    [BuyButtonStates.ERROR]: {
      ...defaultBuyButtonState,
      warningText: <Trans>Something went wrong. Please try again.</Trans>,
    },
    [BuyButtonStates.IN_WALLET_CONFIRMATION]: {
      ...defaultBuyButtonState,
      buttonText: <Trans>Proceed in wallet</Trans>,
    },
    [BuyButtonStates.PROCESSING_TRANSACTION]: {
      ...defaultBuyButtonState,
      buttonText: <Trans>Transaction pending</Trans>,
    },
    [BuyButtonStates.FETCHING_TOKEN_ROUTE]: {
      ...defaultBuyButtonState,
      buttonText: <Trans>Fetching Route</Trans>,
    },
    [BuyButtonStates.INVALID_TOKEN_ROUTE]: {
      ...defaultBuyButtonState,
      buttonText: <Trans>Pay</Trans>,
    },
    [BuyButtonStates.NO_TOKEN_ROUTE_FOUND]: {
      ...defaultBuyButtonState,
      buttonText: <Trans>Insufficient liquidity</Trans>,
      buttonColor: theme.backgroundInteractive,
      buttonTextColor: theme.textPrimary,
      helperText: <Trans>Insufficient pool liquidity to complete transaction</Trans>,
    },
    [BuyButtonStates.LOADING_ALLOWANCE]: {
      ...defaultBuyButtonState,
      buttonText: <Trans>Loading Allowance</Trans>,
    },
    [BuyButtonStates.IN_WALLET_ALLOWANCE_APPROVAL]: {
      ...defaultBuyButtonState,
      buttonText: <Trans>Approve in your wallet</Trans>,
    },
    [BuyButtonStates.PROCESSING_APPROVAL]: {
      ...defaultBuyButtonState,
      buttonText: <Trans>Approval pending</Trans>,
    },
    [BuyButtonStates.REQUIRE_APPROVAL]: {
      ...defaultBuyButtonState,
      disabled: false,
      handleClick: handleClickOverride ?? (() => undefined),
      helperText: <Trans>An approval is needed to use this token. </Trans>,
      buttonText: <Trans>Approve</Trans>,
    },
    [BuyButtonStates.CONFIRM_UPDATED_PRICE]: {
      ...defaultBuyButtonState,
      handleClick: handleClickOverride ?? (() => undefined),
      disabled: false,
      warningTextColor: theme.accentAction,
      warningText: <Trans>Price updated</Trans>,
      buttonText: <Trans>Pay</Trans>,
    },
    [BuyButtonStates.PRICE_IMPACT_HIGH]: {
      ...defaultBuyButtonState,
      handleClick: handleClickOverride ?? (() => undefined),
      disabled: false,
      buttonColor: priceImpact ? priceImpact.priceImpactSeverity.color : defaultBuyButtonState.buttonColor,
      helperText: <Trans>Price impact warning</Trans>,
      helperTextColor: priceImpact ? priceImpact.priceImpactSeverity.color : defaultBuyButtonState.helperTextColor,
      buttonText: <Trans>Pay Anyway</Trans>,
    },
    [BuyButtonStates.PAY]: {
      ...defaultBuyButtonState,
      handleClick: handleClickOverride ?? (() => undefined),
      disabled: false,
      buttonText: <Trans>Pay</Trans>,
      helperText: usingPayWithAnyToken ? <Trans>Refunds for unavailable items will be given in ETH</Trans> : undefined,
    },
  }

  return buyButtonStateData[buyButtonState]
}
