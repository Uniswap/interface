import { Trace, TraceEvent } from "@uniswap/analytics"
import { ArrowContainer, DetailsSwapSection, InputSection, LeverageGaugeSection, LeverageInputSection, OutputSwapSection, StyledBorrowNumericalInput, getIsValidSwapQuote } from "."
import { BrowserEvent, InterfaceElementName, InterfaceEventName, InterfaceSectionName, SwapEventName } from "@uniswap/analytics-events"
import SwapCurrencyInputPanel from "components/CurrencyInputPanel/SwapCurrencyInputPanel"
import { Trans } from "@lingui/macro"
import { useDerivedBorrowCreationInfo, useDerivedSwapInfo, useSwapActionHandlers, useSwapState } from "state/swap/hooks"
import { ActiveSwapTab, Field } from "state/swap/actions"
import { useCallback, useMemo, useState } from "react"
import useWrapCallback, { WrapType } from "hooks/useWrapCallback"
import { currencyAmountToPreciseFloat, formatTransactionAmount } from "utils/formatNumbers"
import { Currency, CurrencyAmount, Percent } from "@uniswap/sdk-core"
import { maxAmountSpend } from "utils/maxAmountSpend"
import { ApprovalState, useApproveCallback } from "hooks/useApproveCallback"
import { BigNumber as BN } from "bignumber.js";
import { sendEvent } from "components/analytics"
import { useUSDPrice } from "hooks/useUSDPrice"
import { TradeState } from "state/routing/types"
import { isSupportedChain } from "constants/chains"
import { useWeb3React } from "@web3-react/core"
import { ArrowWrapper } from "components/swap/styleds"
import { useTheme } from "styled-components"
import JSBI from "jsbi"
import { computeFiatValuePriceImpact } from "utils/computeFiatValuePriceImpact"
import { AutoRow, RowBetween } from "components/Row"
import { LinkStyledButton, ThemedText } from "theme"
import AddressInputPanel from "components/AddressInputPanel"
import { GrayCard, LightCard } from "components/Card"
import { AutoColumn } from "components/Column"
import { SmallMaxButton } from "pages/RemoveLiquidity/styled"
import Slider from "components/Slider"
import { BorrowDetailsDropdown } from "components/swap/SwapDetailsDropdown"
import useDebouncedChangeHandler from "hooks/useDebouncedChangeHandler"
import { computeRealizedPriceImpact, warningSeverity } from "utils/prices"
import { useIsSwapUnsupported } from "hooks/useIsSwapUnsupported"
import PriceImpactWarning from "components/swap/PriceImpactWarning"
import { ButtonError, ButtonLight, ButtonPrimary } from "components/Button"
import { useToggleWalletDrawer } from "components/WalletDropdown"
import { Text } from 'rebass'
import Loader from 'components/Icons/LoadingSpinner'
import { MouseoverTooltip } from "components/Tooltip"
import { ArrowDown, Info } from 'react-feather'
import { useAddBorrowPositionCallback } from "hooks/useSwapCallback"
import { BorrowConfirmModal } from "components/swap/ConfirmSwapModal"

function largerPercentValue(a?: Percent, b?: Percent) {
  if (a && b) {
    return a.greaterThan(b) ? a : b
  } else if (a) {
    return a
  } else if (b) {
    return b
  }
  return undefined
}

const BorrowTabContent = () => {

  const {
    independentField,
    typedValue,
    recipient,
    leverageFactor,
    leverage,
    leverageManagerAddress,
    activeTab,
    ltv,
    borrowManagerAddress,
    premium
  } = useSwapState()

  const { account, chainId, provider } = useWeb3React()

  const {
    trade: { state: tradeState, trade },
    allowedSlippage,
    currencyBalances,
    parsedAmount,
    currencies,
    inputError: swapInputError,
  } = useDerivedSwapInfo()

  const {
    onSwitchTokens, onCurrencySelection, onUserInput,
    onChangeRecipient, onLeverageFactorChange,
    onLeverageChange, onLeverageManagerAddress, onLTVChange, onBorrowManagerAddress,
    onPremiumChange
  } = useSwapActionHandlers()

  const [{ showConfirm, attemptingTxn, txHash }, setSwapState] = useState<{
    showConfirm: boolean
    attemptingTxn: boolean
    txHash: string | undefined
  }>({
    showConfirm: false,
    attemptingTxn: false,
    txHash: undefined
  })

  const {
    wrapType,
    execute: onWrap,
    inputError: wrapInputError,
  } = useWrapCallback(currencies[Field.INPUT], currencies[Field.OUTPUT], typedValue)
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE

  const parsedAmounts = useMemo(
    () =>
      showWrap
        ? {
          [Field.INPUT]: parsedAmount,
          [Field.OUTPUT]: parsedAmount,
        }
        : {
          [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
          [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
        },
    [currencies, independentField, parsedAmount, showWrap, trade]
  )
  const toggleWalletDrawer = useToggleWalletDrawer()
  const [inputCurrency, outputCurrency] = useMemo(() => {
    return [currencies[Field.INPUT], currencies[Field.OUTPUT]]
  }, [currencies])

  const [leverageApproveAmount, borrowInputApproveAmount, borrowOutputApproveAmount] = useMemo(() => {
    if (inputCurrency
      && parsedAmounts[Field.INPUT]
      && outputCurrency
      && premium
    ) {
      return [
        CurrencyAmount.fromRawAmount(
          inputCurrency,
          new BN(parsedAmounts[Field.INPUT]?.toExact() ?? 0).plus(premium).shiftedBy(18).toFixed(0)
        ),
        CurrencyAmount.fromRawAmount(
          inputCurrency,
          new BN(parsedAmounts[Field.INPUT]?.toExact() ?? 0).shiftedBy(18).toFixed(0)
        ),
        CurrencyAmount.fromRawAmount(
          outputCurrency,
          new BN(premium).shiftedBy(18).toFixed(0)
        )
      ]
    }
    else {
      return [undefined, undefined, undefined]
    }
  }, [inputCurrency, parsedAmounts[Field.INPUT], ltv, outputCurrency, premium])

  const maxInputAmount: CurrencyAmount<Currency> | undefined = useMemo(
    () => maxAmountSpend(currencyBalances[Field.INPUT]),
    [currencyBalances]
  )

  const [borrowInputApprovalState, approveInputBorrowManager] = useApproveCallback(borrowInputApproveAmount, borrowManagerAddress ?? undefined)
  const [borrowOutputApprovalState, approveOutputBorrowManager] = useApproveCallback(borrowOutputApproveAmount, borrowManagerAddress ?? undefined)
  const theme = useTheme()
  const {
    trade: borrowTrade,
    state: borrowState,
    inputError: borrowInputError,
    allowedSlippage: borrowAllowedSlippage,
    contractError: borrowContractError
  } = useDerivedBorrowCreationInfo({
    allowance: {
      input: borrowInputApprovalState,
      output: borrowOutputApprovalState,
    }
  })

  console.log('borrowInputApprovalState', borrowInputApprovalState, borrowOutputApprovalState)

  const { callback: borrowCallback } = useAddBorrowPositionCallback(
    borrowManagerAddress ?? undefined,
    borrowAllowedSlippage,
    ltv ?? undefined,
    parsedAmount,
    inputCurrency ?? undefined,
    outputCurrency ?? undefined,
    borrowState,
    borrowTrade
  )

  const isBorrowTab = ActiveSwapTab.BORROW == activeTab

  const borrowIsValid = !borrowInputError

  const fiatValueInput = useUSDPrice(parsedAmounts[Field.INPUT])
  const fiatValueOutput = useUSDPrice(parsedAmounts[Field.OUTPUT])

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput]
  )
  const handleTypeOutput = useCallback(
    (value: string) => {
      onUserInput(Field.OUTPUT, value)
    },
    [onUserInput]
  )

  const [routeNotFound, routeIsLoading, routeIsSyncing] = useMemo(
    () => [!trade?.swaps, TradeState.LOADING === tradeState, TradeState.SYNCING === tradeState],
    [trade, tradeState]
  )

  const userHasSpecifiedInputOutput = Boolean(
    currencies[Field.INPUT] && currencies[Field.OUTPUT] && parsedAmounts[independentField]?.greaterThan(JSBI.BigInt(0))
  )

  const showDetailsDropdown = Boolean(
    !showWrap && userHasSpecifiedInputOutput && (trade || routeIsLoading || routeIsSyncing)
  )

  const fiatValueTradeInput = useUSDPrice(trade?.inputAmount)
  const fiatValueTradeOutput = useUSDPrice(trade?.outputAmount)
  const stablecoinPriceImpact = useMemo(
    () =>
      routeIsSyncing || !trade
        ? undefined
        : computeFiatValuePriceImpact(fiatValueTradeInput.data, fiatValueTradeOutput.data),
    [fiatValueTradeInput, fiatValueTradeOutput, routeIsSyncing, trade]
  )

  const handleOutputSelect = useCallback(
    (outputCurrency: Currency) => onCurrencySelection(Field.OUTPUT, outputCurrency),
    [onCurrencySelection]
  )


  const handleMaxInput = useCallback(() => {
    maxInputAmount && onUserInput(Field.INPUT, maxInputAmount.toExact())
    sendEvent({
      category: 'Swap',
      action: 'Max',
    })
  }, [maxInputAmount, onUserInput])

  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  const showMaxButton = Boolean(maxInputAmount?.greaterThan(0) && !parsedAmounts[Field.INPUT]?.equalTo(maxInputAmount))

  const handleInputSelect = useCallback(
    (inputCurrency: Currency) => {
      onCurrencySelection(Field.INPUT, inputCurrency)
    },
    [onCurrencySelection]
  )

  const formattedAmounts = useMemo(
    () => ({
      [independentField]: typedValue,
      [dependentField]: showWrap
        ? parsedAmounts[independentField]?.toExact() ?? ''
        : formatTransactionAmount(currencyAmountToPreciseFloat(parsedAmounts[dependentField])),
    }),
    [currencies, dependentField, independentField, parsedAmounts, showWrap, typedValue]
  )

  const [debouncedLTV, debouncedSetLTV] = useDebouncedChangeHandler(ltv ?? "", onLTVChange);

  const [borrowRouteNotFound, borrowRouteIsLoading] = useMemo(
    () => [borrowState === TradeState.NO_ROUTE_FOUND, borrowState === TradeState.LOADING]
    , [borrowTrade])

  const updateInputBorrowAllowance = useCallback(async () => {
    try {
      await approveInputBorrowManager()
    } catch (err) {
      console.log("approveBorrowManager err: ", err)
    }
  }, [borrowManagerAddress, parsedAmounts[Field.INPUT], approveInputBorrowManager])

  const updateOutputBorrowAllowance = useCallback(async () => {
    try {
      await approveOutputBorrowManager()
    } catch (err) {
      console.log("approveBorrowManager err: ", err)
    }
  }, [borrowManagerAddress, parsedAmounts[Field.INPUT], approveOutputBorrowManager])

  const handleAddBorrowPosition = useCallback(() => {
    if (!borrowCallback) {
      return
    }
    setSwapState({
      attemptingTxn: true,
      // tradeToConfirm,
      showConfirm,
      // swapErrorMessage: undefined,
      txHash: undefined,
      // showLeverageConfirm,
      // showBorrowConfirm
    })
    borrowCallback().then((hash: any) => {
      console.log
      setSwapState({ attemptingTxn: false, showConfirm, txHash: hash })
    })
      .catch((error: any) => {
        console.log("borrowCreationError: ", error)
        setSwapState({
          attemptingTxn: false,
          // tradeToConfirm,
          showConfirm,
          // swapErrorMessage: "Failed creation",//error.message,
          txHash: undefined,
          // showLeverageConfirm,
          // showBorrowConfirm: false
        })
      })
  }, [
    borrowCallback
  ])

  const handleConfirmDismiss = useCallback(() => {
    setSwapState({ showConfirm: false,attemptingTxn, txHash })
    if (txHash) {
      onUserInput(Field.INPUT, '')
      onLeverageFactorChange('1')
      onLTVChange('')
      onPremiumChange(0)
    }
  }, [attemptingTxn, onUserInput, txHash])

  const { priceImpactSeverity, largerPriceImpact } = useMemo(() => {
    const marketPriceImpact = trade?.priceImpact ? computeRealizedPriceImpact(trade) : undefined
    const largerPriceImpact = largerPercentValue(marketPriceImpact, stablecoinPriceImpact)
    return { priceImpactSeverity: warningSeverity(largerPriceImpact), largerPriceImpact }
  }, [stablecoinPriceImpact, trade])

  const priceImpactTooHigh = priceImpactSeverity > 3 && false
  const showPriceImpactWarning = largerPriceImpact && priceImpactSeverity > 3

  const swapIsUnsupported = useIsSwapUnsupported(currencies[Field.INPUT], currencies[Field.OUTPUT])
  const showBorrowInputApproval = borrowInputApprovalState !== ApprovalState.APPROVED
  const showBorrowOutputApproval = borrowOutputApprovalState !== ApprovalState.APPROVED

  return (
    <>
      <div style={{ display: 'relative' }}>
        <BorrowConfirmModal
          borrowTrade={borrowTrade}
          isOpen={showConfirm}
          attemptingTxn={attemptingTxn}
          txHash={txHash}
          recipient={recipient}
          allowedSlippage={borrowAllowedSlippage}
          onConfirm={handleAddBorrowPosition}
          onDismiss={handleConfirmDismiss}
          errorMessage={undefined}
        />
        <InputSection leverage={false}>
          <Trace section={InterfaceSectionName.CURRENCY_INPUT_PANEL}>
            <SwapCurrencyInputPanel
              label={
                <Trans>Collateral Amount</Trans>
              }
              value={formattedAmounts[Field.INPUT]}
              showMaxButton={showMaxButton}
              currency={currencies[Field.INPUT] ?? null}
              onUserInput={handleTypeInput}
              onMax={handleMaxInput}
              fiatValue={fiatValueInput}
              onCurrencySelect={handleInputSelect}
              otherCurrency={currencies[Field.OUTPUT]}
              showCommonBases={true}
              isTrade={false}
              id={InterfaceSectionName.CURRENCY_INPUT_PANEL}
              loading={independentField === Field.OUTPUT && routeIsSyncing}
              isInput={true}
              premium={outputCurrency && premium ? CurrencyAmount.fromRawAmount(outputCurrency, new BN(premium).shiftedBy(18).toFixed(0)) : undefined}

            />
          </Trace>
        </InputSection>
        <ArrowWrapper clickable={isSupportedChain(chainId)}>
          <TraceEvent
            events={[BrowserEvent.onClick]}
            name={SwapEventName.SWAP_TOKENS_REVERSED}
            element={InterfaceElementName.SWAP_TOKENS_REVERSE_ARROW_BUTTON}
          >
            <ArrowContainer
              onClick={() => {
                onSwitchTokens(true)
              }}
              color={theme.textPrimary}
            >
              <ArrowDown
                size="16"
                color={
                  currencies[Field.INPUT] && currencies[Field.OUTPUT] ? theme.textPrimary : theme.textTertiary
                }
              />
            </ArrowContainer>
          </TraceEvent>
        </ArrowWrapper>
      </div>
      <div>
        <div>
          <OutputSwapSection showDetailsDropdown={showDetailsDropdown}>
            <Trace section={InterfaceSectionName.CURRENCY_OUTPUT_PANEL}>
              <SwapCurrencyInputPanel
                value={
                  (borrowInputApprovalState === ApprovalState.NOT_APPROVED || borrowOutputApprovalState === ApprovalState.NOT_APPROVED) ?
                    "-"
                    : borrowTrade?.borrowedAmount ? (
                      borrowTrade?.existingTotalDebtInput ?
                        String(borrowTrade.borrowedAmount - borrowTrade.existingTotalDebtInput) : String(borrowTrade.borrowedAmount)
                    ) : "-"
                }
                onUserInput={handleTypeOutput}
                label={
                  <Trans>To</Trans>
                }
                showMaxButton={false}
                hideBalance={false}
                fiatValue={fiatValueOutput}
                priceImpact={stablecoinPriceImpact}
                currency={currencies[Field.OUTPUT] ?? null}
                onCurrencySelect={handleOutputSelect}
                otherCurrency={currencies[Field.INPUT]}
                showCommonBases={true}
                id={InterfaceSectionName.CURRENCY_OUTPUT_PANEL}
                loading={independentField === Field.INPUT && routeIsSyncing}
                isInput={false}
                isLevered={leverage}
                disabled={leverage}
                isTrade={false}
              />
            </Trace>

            {recipient !== null && !showWrap ? (
              <>
                <AutoRow justify="space-between" style={{ padding: '0 1rem' }}>
                  <ArrowWrapper clickable={false}>
                    <ArrowDown size="16" color={theme.textSecondary} />
                  </ArrowWrapper>
                  <LinkStyledButton id="remove-recipient-button" onClick={() => onChangeRecipient(null)}>
                    <Trans>- Remove recipient</Trans>
                  </LinkStyledButton>
                </AutoRow>
                <AddressInputPanel id="recipient" value={recipient} onChange={onChangeRecipient} />
              </>
            ) : null}
          </OutputSwapSection>
          <LeverageGaugeSection showDetailsDropdown={(!borrowInputError)} >
            <LightCard>
              <AutoColumn gap="md">
                <RowBetween>
                  <ThemedText.DeprecatedMain fontWeight={400}>
                    <Trans>LTV (%)</Trans>
                  </ThemedText.DeprecatedMain>
                </RowBetween>
                {(
                  <>
                    <RowBetween>
                      <LeverageInputSection>
                        <StyledBorrowNumericalInput
                          className="token-amount-input"
                          value={debouncedLTV}
                          placeholder="1"
                          onUserInput={(str: string) => {
                            if (str === "") {
                              debouncedSetLTV("")
                            } else if (new BN(str).isGreaterThan(new BN("100"))) {
                              return
                            } else if (new BN(str).dp() as number > 1) {
                              debouncedSetLTV(String(new BN(str).decimalPlaces(2, BN.ROUND_DOWN)))
                            } else {
                              debouncedSetLTV(str)
                            }
                          }}
                          disabled={false}
                        />
                      </LeverageInputSection>
                      <AutoRow gap="4px" justify="flex-end">
                        <SmallMaxButton onClick={() => debouncedSetLTV("50")} width="20%">
                          <Trans>50%</Trans>
                        </SmallMaxButton>
                        <SmallMaxButton onClick={() => debouncedSetLTV("75")} width="20%">
                          <Trans>75%</Trans>
                        </SmallMaxButton>
                        <SmallMaxButton onClick={() => debouncedSetLTV("99")} width="20%">
                          <Trans>99%</Trans>
                        </SmallMaxButton>
                      </AutoRow>
                    </RowBetween>
                    <Slider
                      value={debouncedLTV === "" ? 0 : parseFloat(debouncedLTV)}
                      onChange={(val: any) => debouncedSetLTV(val.toString())}
                      min={50.0}
                      max={100.0}
                      step={0.01}
                      float={true}
                    />
                  </>
                )}
              </AutoColumn>
            </LightCard>
          </LeverageGaugeSection>
          <DetailsSwapSection>
            <BorrowDetailsDropdown
              trade={borrowTrade}
              tradeState={borrowState}
              syncing={false}
              loading={borrowRouteIsLoading}
              allowedSlippage={borrowAllowedSlippage}
            />
          </DetailsSwapSection>

        </div>
        {showPriceImpactWarning && <PriceImpactWarning priceImpact={largerPriceImpact} />}
        <div>
          {
            swapIsUnsupported ? (
              <ButtonPrimary disabled={true}>
                <ThemedText.DeprecatedMain mb="4px">
                  <Trans>Unsupported Asset</Trans>
                </ThemedText.DeprecatedMain>
              </ButtonPrimary>
            ) : !account ? (
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
            ) : ((routeNotFound || borrowRouteNotFound) && userHasSpecifiedInputOutput && !borrowRouteIsLoading ? (
              <GrayCard style={{ textAlign: 'center' }}>
                <ThemedText.DeprecatedMain mb="4px">
                  <Trans>Insufficient liquidity for this trade.</Trans>
                </ThemedText.DeprecatedMain>
              </GrayCard>
            ) : !borrowIsValid ? (
              <ButtonError
                onClick={() => { }}
                id="borrow-button"
                disabled={
                  true
                }
              >
                <Text fontSize={20} fontWeight={600}>
                  {borrowInputError}
                </Text>
              </ButtonError>
            ) :
              (
                borrowInputApprovalState !== ApprovalState.APPROVED || borrowOutputApprovalState !== ApprovalState.APPROVED
              ) ? (
                <RowBetween>
                  {showBorrowInputApproval &&
                    <ButtonPrimary
                      onClick={updateInputBorrowAllowance}
                      style={{ gap: 14 }}
                      width={showBorrowOutputApproval ? '48%' : '100%'}
                      disabled={borrowInputApprovalState === ApprovalState.PENDING}
                    >
                      {borrowInputApprovalState === ApprovalState.PENDING ? (
                        <>
                          <Loader size="20px" />
                          <Trans>Approval pending</Trans>
                        </>
                      ) : (
                        <>
                          <MouseoverTooltip
                            text={
                              <Trans>
                                Permission is required for Limitless to use each token. {
                                  typedValue && inputCurrency ? `Allowance of ${typedValue} ${inputCurrency.symbol} required.` : null
                                }
                              </Trans>
                            }
                          >
                            <RowBetween>
                              <div style={{ marginRight: "4px" }}>
                                <Info size={20} />
                              </div>

                              <Trans>Approve use of {currencies[Field.INPUT]?.symbol}</Trans>
                            </RowBetween>
                          </MouseoverTooltip>
                        </>
                      )}
                    </ButtonPrimary>}
                  {showBorrowOutputApproval &&
                    <ButtonPrimary
                      onClick={updateOutputBorrowAllowance}
                      style={{ gap: 14 }}
                      disabled={borrowOutputApprovalState === ApprovalState.PENDING}
                      width={showBorrowInputApproval ? '48%' : '100%'}
                    >
                      {borrowOutputApprovalState === ApprovalState.PENDING ? (
                        <>
                          <Loader size="30px" />
                          <Trans>Approval pending</Trans>
                        </>
                      ) : (
                        <>
                          <MouseoverTooltip
                            text={
                              <Trans>
                                Permission is required for Limitless to use each token. {
                                  typedValue && outputCurrency ? `Allowance of ${premium} ${outputCurrency.symbol} required.` : null
                                }
                              </Trans>
                            }
                          >
                            <RowBetween>
                              <div style={{ marginRight: "4px" }}>
                                <Info size={20} />
                              </div>
                              <Trans>Approve use of {currencies[Field.OUTPUT]?.symbol}</Trans>
                            </RowBetween>
                          </MouseoverTooltip>
                        </>
                      )}
                    </ButtonPrimary>}
                </RowBetween>
              ) : (
                <ButtonError
                  onClick={() => {
                    setSwapState({
                      // tradeToConfirm: trade,
                      attemptingTxn: false,
                      // swapErrorMessage: undefined,
                      showConfirm: true,
                      txHash: undefined,
                      // showLeverageConfirm: false,
                      // showBorrowConfirm: true,
                    })
                  }}
                  id="borrow-button"
                  disabled={
                    !!borrowInputError || !!borrowContractError ||
                    priceImpactTooHigh
                  }
                >
                  <Text fontSize={20} fontWeight={600}>
                    {borrowContractError ? (
                      borrowContractError
                    ) : borrowRouteIsLoading ? (
                      <Trans>Borrow</Trans>
                    ) : priceImpactTooHigh ? (
                      <Trans>Price Impact Too High</Trans>
                    ) : priceImpactSeverity > 2 ? (
                      <Trans>Borrow Anyway</Trans>
                    ) : (
                      <Trans>Borrow</Trans>
                    )}
                  </Text>
                </ButtonError>
              ))}
        </div>
      </div>
    </>
  )
}

export default BorrowTabContent