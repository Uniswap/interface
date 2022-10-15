import { ApprovalState, useApproveCallbackFromTrade } from '../../hooks/useApproveCallback'
import { ArrowDown, ArrowLeft, ArrowUpRight, CheckCircle, HelpCircle, Info } from 'react-feather'
import { ArrowWrapper, Dots, SwapCallbackError } from '../../components/swap/styleds'
import { ButtonConfirmed, ButtonError, ButtonGray, ButtonLight, ButtonPrimary } from '../../components/Button'
import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { HideSmall, LinkStyledButton, TYPE } from '../../theme'
import { MouseoverTooltip, MouseoverTooltipContent } from 'components/Tooltip'
import Row, { AutoRow, RowFixed } from '../../components/Row'
import { UseERC20PermitState, useERC20PermitFromTrade } from '../../hooks/useERC20Permit'
import styled, { ThemeContext } from 'styled-components/macro'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  useDefaultsFromURLSearch,
  useDerivedSwapInfo,
  useSwapActionHandlers,
  useSwapState,
} from '../../state/swap/hooks'
import { useExpertModeManager, useSetAutoSlippage, useSetUserSlippageTolerance, useUserDetectRenounced, useUserSingleHopOnly } from '../../state/user/hooks'
import useToggledVersion, { Version } from '../../hooks/useToggledVersion'
import useWrapCallback, { WrapType } from '../../hooks/useWrapCallback'

import AddressInputPanel from '../../components/AddressInputPanel'
import { AdvancedSwapDetails } from 'components/swap/AdvancedSwapDetails'
import { AutoColumn } from '../../components/Column'
import BetterTradeLink from '../../components/swap/BetterTradeLink'
import ConfirmSwapModal from '../../components/swap/ConfirmSwapModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import CurrencyInputPanelSmall from 'components/CurrencyInputSmall'
import CurrencyLogo from 'components/CurrencyLogo'
import { Field } from '../../state/swap/actions'
import GasSelectorModal from 'components/GasSelectorModal'
import { GreyCard } from 'components/Card'
import JSBI from 'jsbi'
import { Link } from 'react-router-dom'
import Loader from 'components/Loader'
import { ReactComponent as Majgic } from '../../assets/svg/arrows.svg'
import { RENOUNCED_ADDRESSES } from 'components/swap/DetailsModal'
import React from 'react'
import ReactGA from 'react-ga'
import SettingsTab from 'components/Settings'
import SwapHeader from 'components/swap/SwapHeader'
import TradePrice from '../../components/swap/TradePrice'
import { Trans } from '@lingui/macro'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { V3TradeState } from '../../hooks/useBestV3Trade'
import _ from 'lodash'
import { computeFiatValuePriceImpact } from '../../utils/computeFiatValuePriceImpact'
import confirmPriceImpactWithoutFee from '../../components/swap/confirmPriceImpactWithoutFee'
import { getTokenTaxes } from 'pages/HoneyUtils'
import { getTradeVersion } from '../../utils/getTradeVersion'
import { isTradeBetter } from '../../utils/isTradeBetter'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { useActiveWeb3React } from '../../hooks/web3'
import useENSAddress from '../../hooks/useENSAddress'
import useIsArgentWallet from '../../hooks/useIsArgentWallet'
import { useIsSwapUnsupported } from '../../hooks/useIsSwapUnsupported'
import { useSwapCallback } from '../../hooks/useSwapCallback'
import { useUSDCValueV2AndV3 } from '../../hooks/useUSDCPrice'
import { useWalletModalToggle } from 'state/application/hooks'
import { warningSeverity } from '../../utils/prices'

type TokenForTokenProps = {
  inputCurrency?: Currency | null
  outputCurrency?: Currency | null
  allowSwappingOtherCurrencies?: boolean
  fontSize?: number
}

const StyledInfo = styled(Info)`
  opacity: 0.4;
  color: ${({ theme }) => theme.text1};
  height: 16px;
  width: 16px;
  :hover {
    opacity: 0.8;
  }
`


export const SwapTokenForToken = (props: TokenForTokenProps) => {
  const { account, library, chainId } = useActiveWeb3React()
  const theme = React.useContext(ThemeContext)


  // for expert mode
  const [isExpertMode] = useExpertModeManager()

  // get version from the url
  const toggledVersion = useToggledVersion()

  // swap state
  const { independentField, typedValue, recipient, useOtherAddress } = useSwapState()
  const getSwapInfo =  useDerivedSwapInfo
  const {
    v2Trade,
    v3TradeState: { trade: v3Trade, state: v3TradeState },
    toggledTrade: trade,
    allowedSlippage,
    currencyBalances,
    parsedAmount,
    currencies,
    inputError: swapInputError,
  } = getSwapInfo(toggledVersion)
  
  const {
    wrapType,
    execute: onWrap,
    inputError: wrapInputError,
  } = useWrapCallback(currencies[Field.INPUT], currencies[Field.OUTPUT], typedValue)
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const { address: recipientAddress } = useENSAddress(recipient)
  const [useAutoSlippage,] = useSetAutoSlippage()
  const [useDetectRenounced,] = useUserDetectRenounced()

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
    [independentField, parsedAmount, showWrap, trade]
  )

  const allowSwappingForOutput = React.useMemo(() => {
    if (!props.outputCurrency) return true;
    const allowSwap = props.inputCurrency && currencies[Field.INPUT] && currencies[Field.INPUT]?.equals(props.inputCurrency)
    return allowSwap
    
  }, [currencies[Field.OUTPUT], props])

  const allowSwappingForInput = React.useMemo(() => {
    if (!props.outputCurrency) return true;
    const allowSwap = props.inputCurrency && currencies[Field.OUTPUT] && currencies[Field.OUTPUT]?.equals(props.inputCurrency)
    return allowSwap
    
  }, [currencies[Field.INPUT], props])

  const [automaticCalculatedSlippage, setAutomaticCalculatedSlippage] = React.useState(-1)
  const setSlippage = useSetUserSlippageTolerance()
  React.useEffect(() => {
    const test = async () => {
      if (parsedAmounts.INPUT &&
        parsedAmounts.INPUT?.currency &&
        parsedAmounts.OUTPUT &&
        useAutoSlippage &&
        parsedAmounts.OUTPUT?.currency &&
        library?.provider) {
        const address = !parsedAmounts?.OUTPUT?.currency?.isNative ?
          ((parsedAmounts.OUTPUT.currency as any).address ?
            (parsedAmounts?.OUTPUT?.currency as any).address :
            (parsedAmounts.OUTPUT.currency.wrapped).address) as string
          : !parsedAmounts?.INPUT?.currency?.isNative ?
            ((parsedAmounts?.INPUT?.currency as any).address ?
              (parsedAmounts?.INPUT?.currency as any).address :
              (parsedAmounts.INPUT.currency.wrapped).address) as string :
            ''
        getTokenTaxes(address, library?.provider).then((taxes) => {
          let value: number | null = parsedAmounts?.INPUT?.currency.isNative ?
            ((taxes?.buy ?? 0) + 1) : parsedAmounts?.OUTPUT?.currency.isNative ?
              taxes.sell : 0;
          if (value) value += 3
          const parsed = Math.floor(Number.parseFloat((value ?? '0').toString()) * 100)
          if (automaticCalculatedSlippage !== parsed) {
            setSlippage(new Percent(parsed, 10_000))
            setAutomaticCalculatedSlippage(value as number)
          }
        })
      }
    }
    test()
  }, [
    parsedAmounts.OUTPUT,
    parsedAmounts.INPUT,
    library,
    useAutoSlippage
  ])

  const fiatValueInput = useUSDCValueV2AndV3(parsedAmounts[Field.INPUT])
  const fiatValueOutput = useUSDCValueV2AndV3(parsedAmounts[Field.OUTPUT])
  const priceImpact = computeFiatValuePriceImpact(fiatValueInput as any, fiatValueOutput as any)
  const { onSwitchTokens, onCurrencySelection, onUserInput, onChangeRecipient, onSwitchUseChangeRecipient } = useSwapActionHandlers()
  const isValid = !swapInputError
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

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

  // modal and loading
  const [{ showConfirm, tradeToConfirm, swapErrorMessage, attemptingTxn, txHash }, setSwapState] = useState<{
    showConfirm: boolean
    tradeToConfirm: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType> | undefined
    attemptingTxn: boolean
    swapErrorMessage: string | undefined
    txHash: string | undefined
  }>({
    showConfirm: false,
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapErrorMessage: undefined,
    txHash: undefined,
  })

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: showWrap
      ? parsedAmounts[independentField]?.toExact() ?? ''
      : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  }

  const userHasSpecifiedInputOutput = Boolean(
    currencies[Field.INPUT] && currencies[Field.OUTPUT] && parsedAmounts[independentField]?.greaterThan(JSBI.BigInt(0))
  )
  const routeNotFound = !trade?.route
  const isLoadingRoute = toggledVersion === Version.v3 && V3TradeState.LOADING === v3TradeState

  // check whether the user has approved the router on the input token
  const [approvalState, approveCallback] = useApproveCallbackFromTrade(trade, allowedSlippage)
  const {
    state: signatureState,
    signatureData,
    gatherPermitSignature,
  } = useERC20PermitFromTrade(trade, allowedSlippage)
  const handleApprove = useCallback(async () => {
    if (signatureState === UseERC20PermitState.NOT_SIGNED && gatherPermitSignature) {
      try {
        await gatherPermitSignature()
      } catch (error) {
        // try to approve if gatherPermitSignature failed for any reason other than the user rejecting it
        if (error?.code !== 4001) {
          await approveCallback()
        }
      }
    } else {
      await approveCallback()
    }
  }, [approveCallback, gatherPermitSignature, signatureState])

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approvalState === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [approvalState, approvalSubmitted])

  const maxInputAmount: CurrencyAmount<Currency> | undefined = maxAmountSpend(currencyBalances[Field.INPUT])
  const showMaxButton = Boolean(maxInputAmount?.greaterThan(0) && !parsedAmounts[Field.INPUT]?.equalTo(maxInputAmount))

  const swapCalbackFn = useSwapCallback

  // the callback to execute the swap
  const { callback: swapCallback, error: swapCallbackError } = swapCalbackFn(
    trade,
    allowedSlippage,
    recipient,
    signatureData 
  )

  const [singleHopOnly] = useUserSingleHopOnly()

  const handleSwap = useCallback(() => {
    if (!swapCallback) {
      return
    }
    if (priceImpact && !confirmPriceImpactWithoutFee(priceImpact)) {
      return
    }
    setSwapState({ attemptingTxn: true, tradeToConfirm, showConfirm: !isExpertMode, swapErrorMessage: undefined, txHash: undefined })
    swapCallback()
      .then((hash: any) => {
        setSwapState({ attemptingTxn: false, tradeToConfirm, showConfirm: !isExpertMode, swapErrorMessage: undefined, txHash: hash })
        ReactGA.event({
          category: 'Swap',
          action:
            recipient === null
              ? 'Swap Token for Token on Charts Page w/o Send'
              : (recipientAddress ?? recipient) === account
                ? 'Swap Token for Token on Charts Page w/o Send + recipient'
                : 'Swap Token for Token on Charts Page w/ Send',
          label: [
            trade?.inputAmount?.currency?.symbol,
            trade?.outputAmount?.currency?.symbol,
            getTradeVersion(trade),
            singleHopOnly ? 'SH' : 'MH',
          ].join('/'),
        })
      })
      .catch((error) => {
        setSwapState({
          attemptingTxn: false,
          tradeToConfirm,
          showConfirm,
          swapErrorMessage: error.message,
          txHash: undefined,
        })
      })
  }, [
    swapCallback,
    priceImpact,
    tradeToConfirm,
    showConfirm,
    recipient,
    recipientAddress,
    account,
    trade,
    singleHopOnly,
  ])

  // errors
  const [showInverted, setShowInverted] = useState<boolean>(false)

  // warnings on the greater of fiat value price impact and execution price impact
  const priceImpactSeverity = useMemo(() => {
    const executionPriceImpact = trade?.priceImpact
    return warningSeverity(
      executionPriceImpact && priceImpact
        ? executionPriceImpact.greaterThan(priceImpact)
          ? executionPriceImpact
          : priceImpact
        : executionPriceImpact ?? priceImpact
    )
  }, [priceImpact, trade])

  const isArgentWallet = useIsArgentWallet()

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  // never show if price impact is above threshold in non expert mode
  const showApproveFlow =
    !isArgentWallet &&
    !swapInputError &&
    (approvalState === ApprovalState.NOT_APPROVED ||
      approvalState === ApprovalState.PENDING ||
      (approvalSubmitted && approvalState === ApprovalState.APPROVED)) &&
    !(priceImpactSeverity > 3 && !isExpertMode)

  const handleConfirmDismiss = useCallback(() => {
    setSwapState({ showConfirm: false, tradeToConfirm, attemptingTxn, swapErrorMessage, txHash })
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.INPUT, '')
    }
  }, [attemptingTxn, onUserInput, swapErrorMessage, tradeToConfirm, txHash])

  const handleAcceptChanges = useCallback(() => {
    setSwapState({ tradeToConfirm: trade, swapErrorMessage, txHash, attemptingTxn, showConfirm })
  }, [attemptingTxn, showConfirm, swapErrorMessage, trade, txHash])

  const handleInputSelect = useCallback(
    (inputCurrency) => {
      setApprovalSubmitted(false) // reset 2 step UI for approvals
      onCurrencySelection(Field.INPUT, inputCurrency)
    },
    [onCurrencySelection]

  )
  const [showChart, setShowChart] = React.useState(false)

  const handleMaxInput = useCallback(() => {
    maxInputAmount && onUserInput(Field.INPUT, maxInputAmount.toExact())
  }, [maxInputAmount, onUserInput])

  const handleOutputSelect = useCallback(
    (outputCurrency) => {
      onCurrencySelection(Field.OUTPUT, outputCurrency)
    },
    [onCurrencySelection]
  )

  const swapIsUnsupported = useIsSwapUnsupported(currencies?.INPUT, currencies?.OUTPUT)
  const priceImpactTooHigh = priceImpactSeverity > 3 && !isExpertMode

  const [gasSettingsOpen, setGasSettingsOpen] = React.useState(false)
  const dismissGasSettings = () => setGasSettingsOpen(false)
  const openGasSettings = () => setGasSettingsOpen(true)

  const onCurrencyInputSelect = React.useMemo(() => {
    return (props.allowSwappingOtherCurrencies || allowSwappingForInput) ? handleInputSelect : undefined
  }, [props.allowSwappingOtherCurrencies, allowSwappingForInput])


  const onCurrencyOutputSelect = React.useMemo(() => {
    return (props.allowSwappingOtherCurrencies || allowSwappingForOutput) ? handleOutputSelect : undefined
  }, [props.allowSwappingOtherCurrencies, allowSwappingForOutput])


  const resetToStepTwo = () => {
    setApprovalSubmitted(false) // reset 2 step UI for approvals
    onSwitchTokens()
  };

  const removeSend = () => {
    onChangeRecipient('')
    onSwitchUseChangeRecipient(false)
  };

  const swapBtnClick = () => {
    if (isExpertMode) {
      handleSwap()
    } else {
      setSwapState({
        tradeToConfirm: trade,
        attemptingTxn: false,
        swapErrorMessage: undefined,
        showConfirm: true,
        txHash: undefined,
      })
    }
  }

  const [loadedInputCurrency, loadedOutputCurrency] = [
    props.inputCurrency,
    props.outputCurrency
  ]

  useEffect(() => {
    if (!allowSwappingForInput && loadedInputCurrency && (!currencies[Field.INPUT] || !currencies[Field.INPUT]?.equals(loadedInputCurrency))) {
      handleInputSelect(loadedInputCurrency)
    }
  }, [loadedInputCurrency])

  useEffect(() => {
    if (loadedOutputCurrency && (!currencies[Field.OUTPUT] || !currencies[Field.OUTPUT]?.equals(loadedOutputCurrency))) {
      handleOutputSelect(loadedOutputCurrency)
    }
  }, [loadedOutputCurrency])

  return (
    <div>
      <ConfirmSwapModal
        isOpen={showConfirm}
        trade={trade}
        originalTrade={tradeToConfirm}
        onAcceptChanges={handleAcceptChanges}
        attemptingTxn={attemptingTxn}
        txHash={txHash}
        recipient={recipient}
        allowedSlippage={allowedSlippage}
        onConfirm={handleSwap}
        swapErrorMessage={swapErrorMessage}
        onDismiss={handleConfirmDismiss}
      />

      <GasSelectorModal isOpen={gasSettingsOpen} onDismiss={dismissGasSettings} />
      <div style={{ alignItems: 'center', justifyContent: 'space-between', display: 'flex', marginBottom: 5 }}>
        <small style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={openGasSettings}>
          Customize Gas <ArrowUpRight />
        </small>
        <SettingsTab placeholderSlippage={allowedSlippage} />
      </div>
      <AutoColumn gap={'xs'}>
        <div style={{ display: 'relative' }}>
          <CurrencyInputPanelSmall
            label={
              independentField === Field.OUTPUT && !showWrap ? <Trans>From (at most)</Trans> : <Trans>From</Trans>
            }
            onCurrencySelect={onCurrencyInputSelect}
            value={formattedAmounts[Field.INPUT]}
            showMaxButton={showMaxButton}
            currency={currencies[Field.INPUT]}
            onUserInput={handleTypeInput}
            onMax={handleMaxInput}
            fiatValue={fiatValueInput ?? undefined}
            otherCurrency={currencies[Field.OUTPUT]}
            showCommonBases={true}
            hideBalance={false}
            hideInput={false}
            id="swap-independent-currency-input"
          />

          <ArrowWrapper clickable>
            < Majgic

              onClick={resetToStepTwo}
            />
          </ArrowWrapper>
          <CurrencyInputPanelSmall
            onCurrencySelect={onCurrencyOutputSelect}
            value={formattedAmounts[Field.OUTPUT]}
            onUserInput={handleTypeOutput}
            label={independentField === Field.INPUT && !showWrap ? <Trans><> To (at least)  </></Trans> : <Trans> <>To </></Trans>}
            showMaxButton={false}
            hideBalance={false}
            fiatValue={fiatValueOutput ?? undefined}
            priceImpact={priceImpact}
            currency={currencies[Field.OUTPUT]}
            otherCurrency={currencies[Field.INPUT]}
            showCommonBases={true}
            id="swap-independent-currency-output"
          />
        </div>

        {useOtherAddress && !showWrap ? (
          <>
            <AutoRow justify="space-between" style={{ padding: '0 1rem' }}>
              <ArrowWrapper clickable={false}>
                <ArrowDown size="16" color={theme.text2} />
              </ArrowWrapper>
              <LinkStyledButton id="remove-recipient-button" onClick={removeSend}>
                <Trans>- Remove send</Trans>
              </LinkStyledButton>
            </AutoRow>
            <AddressInputPanel id="recipient" value={recipient as string} onChange={onChangeRecipient} />
          </>
        ) : null}

        {showWrap ? null : (
          <Row style={{ justifyContent: !trade ? 'center' : 'space-between' }}>
            <RowFixed style={{ padding: '5px 0px' }}>
              {[V3TradeState.VALID, V3TradeState.SYNCING, V3TradeState.NO_ROUTE_FOUND].includes(v3TradeState) &&
                (toggledVersion === Version.v3 && isTradeBetter(v3Trade, v2Trade as any) ? (
                  <BetterTradeLink version={Version.v2} otherTradeNonexistent={!v3Trade} />
                ) : toggledVersion === Version.v2 && isTradeBetter(v2Trade as any, v3Trade) ? (
                  <BetterTradeLink version={Version.v3} otherTradeNonexistent={!v2Trade} />
                ) : (
                  toggledVersion === Version.v2 && (
                    <ButtonGray
                      width="fit-content"
                      padding="0.1rem 0.5rem 0.1rem 0.35rem"
                      as={Link}
                      to="/swap"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        height: '24px',
                        lineHeight: '120%',
                        marginLeft: '0.75rem',
                      }}
                    >
                      <ArrowLeft color={theme.text3} size={12} /> &nbsp;
                      <TYPE.main style={{ lineHeight: '120%' }} fontSize={12}>
                        <Trans>
                          <HideSmall>Back to </HideSmall>
                          V3
                        </Trans>
                      </TYPE.main>
                    </ButtonGray>
                  )
                ))}

              {toggledVersion === Version.v3 && trade && isTradeBetter(v2Trade as any, v3Trade) && (
                <ButtonGray
                  width="fit-content"
                  padding="0.1rem 0.5rem"
                  disabled
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    height: '24px',
                    opacity: 0.8,
                    marginLeft: '0.25rem',
                  }}
                >
                  <TYPE.black fontSize={12}>
                    <Trans>V3</Trans>
                  </TYPE.black>
                </ButtonGray>
              )}
            </RowFixed>
            {trade ? (
              <RowFixed style={{ fontSize: props.fontSize ? `${props.fontSize}px !important  ` : 12 }}>
                <TradePrice
                  price={trade.executionPrice}
                  showInverted={showInverted}
                  setShowInverted={setShowInverted}
                />
                <MouseoverTooltipContent
                  content={<AdvancedSwapDetails trade={trade} allowedSlippage={allowedSlippage} />}
                >
                  <StyledInfo />
                </MouseoverTooltipContent>
              </RowFixed>
            ) : null}

          </Row>
        )}
      </AutoColumn>
      <div>
        {swapIsUnsupported ? (
          <ButtonPrimary style={{ marginTop: 15 }} disabled={true}>
            <TYPE.main mb="4px">
              <Trans>Unsupported Asset</Trans>
            </TYPE.main>
          </ButtonPrimary>
        ) : !account ? (
          <ButtonLight style={{ marginTop: 20 }} onClick={toggleWalletModal}>
            <Trans>Connect Wallet</Trans>
          </ButtonLight>
        ) : showWrap ? (
          <ButtonPrimary style={{ marginTop: 20 }} disabled={Boolean(wrapInputError)} onClick={onWrap}>
            {wrapInputError ??
              (wrapType === WrapType.WRAP ? (
                <Trans>Wrap</Trans>
              ) : wrapType === WrapType.UNWRAP ? (
                <Trans>Unwrap</Trans>
              ) : null)}
          </ButtonPrimary>
        ) : routeNotFound && userHasSpecifiedInputOutput ? (
          <GreyCard style={{ textAlign: 'center' }}>
            <TYPE.main mb="4px">
              {isLoadingRoute ? (
                <Dots>
                  <Trans>Loading</Trans>
                </Dots>
              ) : singleHopOnly ? (
                <Trans>Insufficient liquidity for this trade. Try enabling multi-hop trades.</Trans>
              ) : (
                <Trans>Insufficient liquidity for this trade.</Trans>
              )}
            </TYPE.main>
          </GreyCard>
        ) : showApproveFlow ? (
          <AutoRow style={{ flexWrap: 'nowrap', width: '100%' }}>
            <AutoColumn style={{ width: '100%' }} gap="12px">
              <ButtonConfirmed
                style={{ marginTop: 15 }}
                onClick={handleApprove}
                width="100%"
                disabled={
                  approvalState !== ApprovalState.NOT_APPROVED ||
                  approvalSubmitted ||
                  signatureState === UseERC20PermitState.SIGNED
                }
                altDisabledStyle={approvalState === ApprovalState.PENDING} // show solid button while waiting
                confirmed={
                  approvalState === ApprovalState.APPROVED || signatureState === UseERC20PermitState.SIGNED
                }
              >
                <AutoRow justify="space-between" style={{ flexWrap: 'nowrap' }}>
                  <span style={{ display: 'flex', justifyContent:'start',gap: 10, alignItems: 'center' }}>
                    <CurrencyLogo
                      currency={currencies[Field.INPUT]}
                      size={'20px'}
                      style={{ marginRight: '8px', flexShrink: 0 }}
                    />
                    {/* we need to shorten this string on mobile */}
                    {approvalState === ApprovalState.APPROVED || signatureState === UseERC20PermitState.SIGNED ? (
                      <Trans>You can now trade {currencies[Field.INPUT]?.symbol}</Trans>
                    ) : (
                      <>Enable {currencies[Field.INPUT]?.symbol}</>
                    )}
                  </span>
                  {approvalState === ApprovalState.PENDING ? (
                    <Loader stroke="white" />
                  ) : (approvalSubmitted && approvalState === ApprovalState.APPROVED) ||
                    signatureState === UseERC20PermitState.SIGNED ? (
                    <CheckCircle size="20" color={theme.green1} />
                  ) : (
                    <MouseoverTooltip
                      text={
                        <Trans>
                          You must give the Kibaswap smart contracts permission to use your{' '}
                          {currencies[Field.INPUT]?.symbol}. You only have to do this once per token.
                        </Trans>
                      }
                    >
                      <HelpCircle size="20" color={'white'} style={{ marginLeft: '8px' }} />
                    </MouseoverTooltip>
                  )}
                </AutoRow>
              </ButtonConfirmed>
              <ButtonError style={{ marginTop: 15 }}
                onClick={swapBtnClick}
                width="100%"
                id="swap-button"
                disabled={
                  !isValid ||
                  (approvalState !== ApprovalState.APPROVED && signatureState !== UseERC20PermitState.SIGNED) ||
                  priceImpactTooHigh
                }
                error={isValid && priceImpactSeverity > 2}
              >
                <TYPE.small fontSize={16} fontWeight={500}>
                  {priceImpactTooHigh ? (
                    <Trans>High Price Impact</Trans>
                  ) : priceImpactSeverity > 2 ? (
                    <Trans>Swap Anyway</Trans>
                  ) : (
                    <Trans>Swap</Trans>
                  )}
                </TYPE.small>
              </ButtonError>
            </AutoColumn>
          </AutoRow>
        ) : (
          <ButtonError style={{ marginTop: 15 }}
            onClick={swapBtnClick}
            id="swap-button"
            disabled={!isValid || priceImpactTooHigh || !!swapCallbackError}
            error={isValid && priceImpactSeverity > 2 && !swapCallbackError}
          >
            <TYPE.small fontSize={20} fontWeight={500}>
              {swapInputError ? (
                swapInputError
              ) : priceImpactTooHigh ? (
                <Trans>Price Impact Too High</Trans>
              ) : priceImpactSeverity > 2 ? (
                <Trans>Swap Anyway</Trans>
              ) : (
                <Trans>Swap</Trans>
              )}
            </TYPE.small>
          </ButtonError>
        )}
        {isExpertMode && swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}

      </div>
    </div>
  )
}