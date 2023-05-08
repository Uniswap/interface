import { Trans } from '@lingui/macro'
import { sendAnalyticsEvent, TraceEvent, useTrace } from '@uniswap/analytics'
import { BrowserEvent, InterfaceElementName, InterfaceEventName } from '@uniswap/analytics-events'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { UNIVERSAL_ROUTER_ADDRESS } from '@uniswap/universal-router-sdk'
import { useWeb3React } from '@web3-react/core'
import { useToggleAccountDrawer } from 'components/AccountDrawer'
import { ButtonError, ButtonLight, ButtonPrimary } from 'components/Button'
import { GrayCard } from 'components/Card'
import { MouseoverTooltip } from 'components/Tooltip'
import { getChainInfo } from 'constants/chainInfo'
import { isSupportedChain, SupportedChainId } from 'constants/chains'
import usePermit2Allowance, { AllowanceState } from 'hooks/usePermit2Allowance'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import JSBI from 'jsbi'
import { useCallback, useContext, useMemo, useState } from 'react'
import { Info, Loader } from 'react-feather'
import { TradeState } from 'state/routing/types'
import { DerivedSwapInfoContext } from 'state/swap/hooks'
import { ThemedText } from 'theme'
import invariant from 'tiny-invariant'
import { getIsValidSwapQuote } from 'utils/getIsValidSwapQuote'
import { switchChain } from 'utils/switchChain'

import { Field } from '../../state/swap/actions'
import { WrapButton } from './WrapButton'

interface SwapButtonProps {
  chainId: SupportedChainId | undefined
  onSwapClick: () => void
}

export function SwapButton({ chainId, onSwapClick }: SwapButtonProps) {
  const trace = useTrace()
  const { account, chainId: connectedChainId, connector } = useWeb3React()
  const toggleWalletDrawer = useToggleAccountDrawer()

  const {
    trade: { state: tradeState, trade },
    currencies,
    allowedSlippage,
    parsedAmount,
    inputError: swapInputError,
    swapIsUnsupported,
    priceImpactTooHigh,
    priceImpactSeverity,
    swapState,
  } = useContext(DerivedSwapInfoContext)

  const {
    wrapType,
    inputError: wrapInputError,
    execute: onWrap,
  } = useWrapCallback(currencies[Field.INPUT], currencies[Field.OUTPUT], swapState.typedValue)

  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const parsedAmounts = useMemo(
    () =>
      showWrap
        ? {
            [Field.INPUT]: parsedAmount,
            [Field.OUTPUT]: parsedAmount,
          }
        : {
            [Field.INPUT]: swapState.independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
            [Field.OUTPUT]: swapState.independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
          },
    [swapState.independentField, parsedAmount, showWrap, trade]
  )

  const maximumAmountIn = useMemo(() => {
    const maximumAmountIn = trade?.maximumAmountIn(allowedSlippage)
    return maximumAmountIn?.currency.isToken ? (maximumAmountIn as CurrencyAmount<Token>) : undefined
  }, [allowedSlippage, trade])
  const allowance = usePermit2Allowance(
    maximumAmountIn ??
      (parsedAmounts[Field.INPUT]?.currency.isToken
        ? (parsedAmounts[Field.INPUT] as CurrencyAmount<Token>)
        : undefined),
    isSupportedChain(chainId) ? UNIVERSAL_ROUTER_ADDRESS(chainId) : undefined
  )

  const isApprovalLoading = allowance.state === AllowanceState.REQUIRED && allowance.isApprovalLoading
  const [isAllowancePending, setIsAllowancePending] = useState(false)
  const updateAllowance = useCallback(async () => {
    invariant(allowance.state === AllowanceState.REQUIRED)
    setIsAllowancePending(true)
    try {
      await allowance.approveAndPermit()
      sendAnalyticsEvent(InterfaceEventName.APPROVE_TOKEN_TXN_SUBMITTED, {
        chain_id: chainId,
        token_symbol: maximumAmountIn?.currency.symbol,
        token_address: maximumAmountIn?.currency.address,
        ...trace,
      })
    } catch (e) {
      console.error(e)
    } finally {
      setIsAllowancePending(false)
    }
  }, [allowance, chainId, maximumAmountIn?.currency.address, maximumAmountIn?.currency.symbol, trace])

  const isValid = !swapInputError
  const routeNotFound = !trade?.swaps
  const routeIsLoading = TradeState.LOADING === tradeState
  const routeIsSyncing = TradeState.SYNCING === tradeState
  const userHasSpecifiedInputOutput = Boolean(
    currencies[Field.INPUT] &&
      currencies[Field.OUTPUT] &&
      parsedAmounts[swapState.independentField]?.greaterThan(JSBI.BigInt(0))
  )

  if (swapIsUnsupported) {
    return (
      <ButtonPrimary disabled={true}>
        <ThemedText.DeprecatedMain mb="4px">
          <Trans>Unsupported Asset</Trans>
        </ThemedText.DeprecatedMain>
      </ButtonPrimary>
    )
  }

  if (!account) {
    return (
      <TraceEvent
        events={[BrowserEvent.onClick]}
        name={InterfaceEventName.CONNECT_WALLET_BUTTON_CLICKED}
        properties={{ received_swap_quote: getIsValidSwapQuote(trade, tradeState, swapInputError) }}
        element={InterfaceElementName.CONNECT_WALLET_BUTTON}
      >
        <ButtonLight onClick={toggleWalletDrawer} fontWeight={600}>
          <Trans>Connect Wallet</Trans>
        </ButtonLight>
      </TraceEvent>
    )
  }

  if (chainId && chainId !== connectedChainId) {
    return (
      <ButtonPrimary
        onClick={() => {
          switchChain(connector, chainId)
        }}
      >
        Connect to {getChainInfo(chainId)?.label}
      </ButtonPrimary>
    )
  }

  if (showWrap) {
    return <WrapButton onClick={onWrap} error={wrapInputError} type={wrapType} />
  }

  if (routeNotFound && userHasSpecifiedInputOutput && !routeIsLoading && !routeIsSyncing) {
    return (
      <GrayCard style={{ textAlign: 'center' }}>
        <ThemedText.DeprecatedMain mb="4px">
          <Trans>Insufficient liquidity for this trade.</Trans>
        </ThemedText.DeprecatedMain>
      </GrayCard>
    )
  }

  if (isValid && allowance.state === AllowanceState.REQUIRED) {
    return (
      <ButtonPrimary
        onClick={updateAllowance}
        disabled={isAllowancePending || isApprovalLoading}
        style={{ gap: 14 }}
        data-testid="swap-approve-button"
      >
        {isAllowancePending ? (
          <>
            <Loader size="20px" />
            <Trans>Approve in your wallet</Trans>
          </>
        ) : isApprovalLoading ? (
          <>
            <Loader size="20px" />
            <Trans>Approval pending</Trans>
          </>
        ) : (
          <>
            <div style={{ height: 20 }}>
              <MouseoverTooltip
                text={
                  <Trans>
                    Permission is required for Uniswap to swap each token. This will expire after one month for your
                    security.
                  </Trans>
                }
              >
                <Info size={20} />
              </MouseoverTooltip>
            </div>
            <Trans>Approve use of {currencies[Field.INPUT]?.symbol}</Trans>
          </>
        )}
      </ButtonPrimary>
    )
  }

  return (
    <ButtonError
      onClick={onSwapClick}
      id="swap-button"
      disabled={Boolean(
        swapInputError ||
          routeIsSyncing ||
          routeIsLoading ||
          priceImpactTooHigh ||
          allowance.state !== AllowanceState.ALLOWED
      )}
      error={!swapInputError && (priceImpactSeverity ?? 0) > 2 && allowance.state === AllowanceState.ALLOWED}
    >
      <ThemedText.HeadlineSmall fontSize={20} fontWeight={600}>
        {swapInputError ? (
          swapInputError
        ) : routeIsSyncing || routeIsLoading ? (
          <Trans>Review Swap</Trans>
        ) : priceImpactTooHigh ? (
          <Trans>Price Impact Too High</Trans>
        ) : (priceImpactSeverity ?? 0) > 2 ? (
          <Trans>Swap Anyway</Trans>
        ) : (
          <Trans>Review Swap</Trans>
        )}
      </ThemedText.HeadlineSmall>
    </ButtonError>
  )
}
