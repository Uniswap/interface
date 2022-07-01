import { formatEther } from '@ethersproject/units'
import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { MouseoverTooltip } from 'components/Tooltip'
import JSBI from 'jsbi'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { CheckCircle, HelpCircle } from 'react-feather'
import ReactGA from 'react-ga'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components/macro'

import { ButtonConfirmed, ButtonError, ButtonLight } from '../../components/Button'
import { GreyCard } from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import CurrencyLogo from '../../components/CurrencyLogo'
import Loader from '../../components/Loader'
import { AutoRow } from '../../components/Row'
import ConfirmSwapModal from '../../components/swap/ConfirmSwapModal'
import { Wrapper } from '../../components/swap/styleds'
import { SwitchLocaleLink } from '../../components/SwitchLocaleLink'
import XttPresaleHeader from '../../components/xttpresale/XttPresaleHeader'
import { ExtendedXDC } from '../../constants/extended-xdc'
import { ApprovalState, useApproveCallbackFromTrade } from '../../hooks/useApproveCallback'
import useENSAddress from '../../hooks/useENSAddress'
import { useERC20PermitFromTrade, UseERC20PermitState } from '../../hooks/useERC20Permit'
import { useIsSwapUnsupported } from '../../hooks/useIsSwapUnsupported'
import { useSwapCallback } from '../../hooks/useSwapCallback'
import { useUSDCValue } from '../../hooks/useUSDCPrice'
import useWrapCallback, { WrapType } from '../../hooks/useWrapCallback'
import { useActiveWeb3React } from '../../hooks/web3'
import { useWalletModalToggle } from '../../state/application/hooks'
import { Field } from '../../state/swap/actions'
import { tryParseAmount, useDerivedSwapInfo, useSwapActionHandlers, useSwapState } from '../../state/swap/hooks'
import { useExpertModeManager } from '../../state/user/hooks'
import { useXttPresaleState } from '../../state/xtt-presale/hooks'
import { IXttPresaleState, Status } from '../../state/xtt-presale/reducer'
import XttPresaleUpdater from '../../state/xtt-presale/updater'
import { ThemedText } from '../../theme'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import AppBody from '../AppBody'

export default function XTTPresale() {
  const { account, chainId } = useActiveWeb3React()
  const xttPresaleState: IXttPresaleState = useXttPresaleState()

  const xttToken = useMemo(() => {
    if (xttPresaleState.status !== Status.SUCCESS || !chainId) {
      return null
    }
    return new Token(chainId, xttPresaleState.token, 18, 'XTT', 'X Treasury Token')
  }, [xttPresaleState, chainId])

  const ether = useMemo(() => {
    if (chainId) {
      return ExtendedXDC.onChain(chainId)
    }
    return null
  }, [chainId])

  const theme = useContext(ThemeContext)

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  // for expert mode
  const [isExpertMode] = useExpertModeManager()

  // swap state
  const { independentField, typedValue, recipient } = useSwapState()
  const {
    allowedSlippage,
    currencyBalances,
    parsedAmount,
    currencies,
    inputError: swapInputError,
    v2Trade,
  } = useDerivedSwapInfo()

  const {
    wrapType,
    execute: onWrap,
    inputError: wrapInputError,
  } = useWrapCallback(currencies[Field.INPUT], currencies[Field.OUTPUT], typedValue)
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const { address: recipientAddress } = useENSAddress(recipient)

  const parsedAmounts = useMemo(
    () =>
      showWrap
        ? {
            [Field.INPUT]: parsedAmount,
            [Field.OUTPUT]: parsedAmount,
          }
        : {
            [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : v2Trade?.inputAmount,
            [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : v2Trade?.outputAmount,
          },
    [independentField, parsedAmount, showWrap, v2Trade]
  )

  const [routeNotFound, routeIsLoading, routeIsSyncing] = useMemo(() => [!v2Trade?.route.path, false, false], [v2Trade])

  const fiatValueInput = useUSDCValue(parsedAmounts[Field.INPUT])
  const fiatValueOutput = useUSDCValue(parsedAmounts[Field.OUTPUT])

  const { onCurrencySelection, onUserInput, onChangeRecipient } = useSwapActionHandlers()
  const isValid = !swapInputError
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  const handleTypeInput = useCallback(
    (value: string) => {
      if (value === '') {
        setV({ xtt: '', xdc: '' })
      }
      setV((v) => ({ ...v, xdc: value }))
      if (ether && xttToken) {
        const parsed = tryParseAmount(xttPresaleState.tokenPerETH, ether)
        const parsedValue = tryParseAmount(value, xttToken)
        console.log(parsed, parsedValue)
        if (parsed !== undefined && parsedValue !== undefined) {
          setV({
            xdc: value,
            xtt: parsed
              .multiply(parsedValue)
              .divide(JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18)))
              .toFixed(2),
          })
        }
      }
    },
    [xttPresaleState.tokenPerETH, xttToken, ether]
  )
  const handleTypeOutput = useCallback(
    (value: string) => {
      if (value === '') {
        setV({ xtt: '', xdc: '' })
      }
      setV((v) => ({ ...v, xtt: value }))
      if (ether && xttToken) {
        const parsed = tryParseAmount(xttPresaleState.tokenPerETH, ether)
        const parsedValue = tryParseAmount(value, ether)

        if (parsed !== undefined && parsedValue !== undefined) {
          setV({
            xtt: value,
            xdc: parsedValue
              .multiply(JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18)))
              .divide(parsed)
              .toFixed(2),
          })
        }
      }
    },
    [xttPresaleState.tokenPerETH, xttToken, ether]
  )

  // modal and loading
  const [{ showConfirm, tradeToConfirm, swapErrorMessage, attemptingTxn, txHash }, setSwapState] = useState<{
    showConfirm: boolean
    tradeToConfirm: V2Trade<Currency, Currency, TradeType> | undefined
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

  const [v, setV] = useState({
    xtt: '',
    xdc: '',
  })
  const [errorText, setErrorText] = useState('')

  const formattedAmounts = useMemo(() => {
    console.log(independentField, dependentField, typedValue)
    return {
      [independentField]: typedValue,
      [dependentField]: showWrap
        ? parsedAmounts[independentField]?.toExact() ?? ''
        : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
    }
  }, [dependentField, independentField, parsedAmounts, showWrap, typedValue])

  const userHasSpecifiedInputOutput = Boolean(
    currencies[Field.INPUT] && currencies[Field.OUTPUT] && parsedAmounts[independentField]?.greaterThan(JSBI.BigInt(0))
  )
  const approvalOptimizedTradeString = 'V2SwapRouter'

  // check whether the user has approved the router on the input token
  const [approvalState, approveCallback] = useApproveCallbackFromTrade(v2Trade, allowedSlippage)
  const {
    state: signatureState,
    signatureData,
    gatherPermitSignature,
  } = useERC20PermitFromTrade(v2Trade, allowedSlippage)

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

      ReactGA.event({
        category: 'Swap',
        action: 'Approve',
        label: [approvalOptimizedTradeString, v2Trade?.inputAmount?.currency.symbol].join('/'),
      })
    }
  }, [
    signatureState,
    gatherPermitSignature,
    approveCallback,
    approvalOptimizedTradeString,
    v2Trade?.inputAmount?.currency.symbol,
  ])

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approvalState === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [approvalState, approvalSubmitted])

  const maxInputAmount: CurrencyAmount<Currency> | undefined = useMemo(
    () => maxAmountSpend(currencyBalances[Field.INPUT]),
    [currencyBalances]
  )
  const showMaxButton = Boolean(maxInputAmount?.greaterThan(0) && !parsedAmounts[Field.INPUT]?.equalTo(maxInputAmount))

  // the callback to execute the swap
  const { callback: swapCallback, error: swapCallbackError } = useSwapCallback(
    v2Trade,
    allowedSlippage,
    recipient,
    signatureData
  )

  const handleSwap = useCallback(() => {
    if (!swapCallback) {
      return
    }
    setSwapState({ attemptingTxn: true, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: undefined })
    swapCallback()
      .then((hash) => {
        setSwapState({ attemptingTxn: false, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: hash })
        ReactGA.event({
          category: 'Swap',
          action:
            recipient === null
              ? 'Swap w/o Send'
              : (recipientAddress ?? recipient) === account
              ? 'Swap w/o Send + recipient'
              : 'Swap w/ Send',
          label: [
            approvalOptimizedTradeString,
            v2Trade?.inputAmount?.currency?.symbol,
            v2Trade?.outputAmount?.currency?.symbol,
            'MH',
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
    tradeToConfirm,
    showConfirm,
    recipient,
    recipientAddress,
    account,
    approvalOptimizedTradeString,
    v2Trade?.inputAmount?.currency?.symbol,
    v2Trade?.outputAmount?.currency?.symbol,
  ])

  // errors
  const [showInverted, setShowInverted] = useState<boolean>(false)

  const handleConfirmDismiss = useCallback(() => {
    setSwapState({ showConfirm: false, tradeToConfirm, attemptingTxn, swapErrorMessage, txHash })
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.INPUT, '')
    }
  }, [attemptingTxn, onUserInput, swapErrorMessage, tradeToConfirm, txHash])

  const handleAcceptChanges = useCallback(() => {
    setSwapState({ tradeToConfirm: v2Trade, swapErrorMessage, txHash, attemptingTxn, showConfirm })
  }, [attemptingTxn, showConfirm, swapErrorMessage, v2Trade, txHash])

  const handleInputSelect = useCallback(
    (inputCurrency) => {
      setApprovalSubmitted(false) // reset 2 step UI for approvals
      onCurrencySelection(Field.INPUT, inputCurrency)
    },
    [onCurrencySelection]
  )

  const maximumDepositEthAmount = useMemo(() => {
    if (!xttPresaleState) {
      return null
    }
    return formatEther(xttPresaleState.maximumDepositEthAmount)
  }, [xttPresaleState])

  const minimumDepositEthAmount = useMemo(() => {
    if (!xttPresaleState) {
      return null
    }
    return formatEther(xttPresaleState.minimumDepositEthAmount)
  }, [xttPresaleState])

  const handleMaxInput = useCallback(() => {
    maxInputAmount && handleTypeInput(maxInputAmount.toFixed(2))
  }, [maxInputAmount, handleTypeInput])

  const isInDepositRange = useMemo(() => {
    if (maximumDepositEthAmount && +maximumDepositEthAmount < +v.xdc) {
      setErrorText('You amount is greater than max deposit amount')
      return true
    }

    if (minimumDepositEthAmount && +minimumDepositEthAmount > +v.xdc) {
      setErrorText('You amount is less than min deposit amount')
      return true
    }
    return false
  }, [minimumDepositEthAmount, maximumDepositEthAmount, v.xdc])

  const swapIsUnsupported = useIsSwapUnsupported(currencies[Field.INPUT], currencies[Field.OUTPUT])

  console.log(isInDepositRange)

  // todo
  const showApproveFlow = false
  return (
    <>
      <XttPresaleUpdater />
      <AppBody>
        <XttPresaleHeader state={xttPresaleState} />
        <Wrapper id="swap-page">
          <ConfirmSwapModal
            isOpen={showConfirm}
            trade={v2Trade}
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

          <AutoColumn gap={'sm'}>
            <div style={{ display: 'relative' }}>
              <CurrencyInputPanel
                label={
                  independentField === Field.OUTPUT && !showWrap ? <Trans>From (at most)</Trans> : <Trans>From</Trans>
                }
                value={v.xdc}
                showMaxButton={showMaxButton}
                currency={ether}
                onUserInput={handleTypeInput}
                onMax={handleMaxInput}
                id="swap-currency-input"
                // loading={independentField === Field.OUTPUT && routeIsSyncing}
              />
              <CurrencyInputPanel
                value={v.xtt}
                onUserInput={handleTypeOutput}
                label={independentField === Field.INPUT && !showWrap ? <Trans>To (at least)</Trans> : <Trans>To</Trans>}
                showMaxButton={false}
                currency={xttToken}
                id="swap-currency-output"
                // loading={independentField === Field.INPUT && routeIsSyncing}
              />
            </div>
            <div>
              {!account ? (
                <ButtonLight onClick={toggleWalletModal}>
                  <Trans>Connect Wallet</Trans>
                </ButtonLight>
              ) : isInDepositRange ? (
                <GreyCard style={{ textAlign: 'center' }}>
                  <ThemedText.Main mb="4px">
                    <Trans>{errorText}</Trans>
                  </ThemedText.Main>
                </GreyCard>
              ) : routeNotFound && userHasSpecifiedInputOutput && !routeIsLoading && !routeIsSyncing ? (
                <GreyCard style={{ textAlign: 'center' }}>
                  <ThemedText.Main mb="4px">
                    <Trans>Insufficient liquidity for this trade.</Trans>
                  </ThemedText.Main>
                </GreyCard>
              ) : showApproveFlow ? (
                <AutoRow style={{ flexWrap: 'nowrap', width: '100%' }}>
                  <AutoColumn style={{ width: '100%' }} gap="12px">
                    <ButtonConfirmed
                      onClick={handleApprove}
                      disabled={
                        approvalState !== ApprovalState.NOT_APPROVED ||
                        approvalSubmitted ||
                        signatureState === UseERC20PermitState.SIGNED
                      }
                      width="100%"
                      altDisabledStyle={approvalState === ApprovalState.PENDING} // show solid button while waiting
                      confirmed={
                        approvalState === ApprovalState.APPROVED || signatureState === UseERC20PermitState.SIGNED
                      }
                    >
                      <AutoRow justify="space-between" style={{ flexWrap: 'nowrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center' }}>
                          <CurrencyLogo
                            currency={currencies[Field.INPUT]}
                            size={'20px'}
                            style={{ marginRight: '8px', flexShrink: 0 }}
                          />
                          {/* we need to shorten this string on mobile */}
                          {approvalState === ApprovalState.APPROVED || signatureState === UseERC20PermitState.SIGNED ? (
                            <Trans>You can now trade {currencies[Field.INPUT]?.symbol}</Trans>
                          ) : (
                            <Trans>Allow the X-Swap-Protocol to use your {currencies[Field.INPUT]?.symbol}</Trans>
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
                                You must give the XSwapProtocol smart contracts permission to use your{' '}
                                {currencies[Field.INPUT]?.symbol}. You only have to do this once per token.
                              </Trans>
                            }
                          >
                            <HelpCircle size="20" color={'white'} style={{ marginLeft: '8px' }} />
                          </MouseoverTooltip>
                        )}
                      </AutoRow>
                    </ButtonConfirmed>
                    <ButtonError
                      onClick={() => {
                        if (isExpertMode) {
                          handleSwap()
                        } else {
                          setSwapState({
                            tradeToConfirm: v2Trade,
                            attemptingTxn: false,
                            swapErrorMessage: undefined,
                            showConfirm: true,
                            txHash: undefined,
                          })
                        }
                      }}
                      width="100%"
                      id="swap-button"
                      disabled={
                        !isValid ||
                        routeIsSyncing ||
                        routeIsLoading ||
                        (approvalState !== ApprovalState.APPROVED && signatureState !== UseERC20PermitState.SIGNED)
                      }
                      error={isValid}
                    >
                      <Text fontSize={16} fontWeight={500}>
                        <Trans>Swap</Trans>
                      </Text>
                    </ButtonError>
                  </AutoColumn>
                </AutoRow>
              ) : (
                <ButtonError
                  onClick={() => {
                    if (isExpertMode) {
                      handleSwap()
                    } else {
                      setSwapState({
                        tradeToConfirm: v2Trade,
                        attemptingTxn: false,
                        swapErrorMessage: undefined,
                        showConfirm: true,
                        txHash: undefined,
                      })
                    }
                  }}
                  id="swap-button"
                  disabled={!isValid || routeIsSyncing || routeIsLoading || !!swapCallbackError}
                  error={isValid && !swapCallbackError}
                >
                  <Text fontSize={20} fontWeight={500}>
                    {swapInputError ? (
                      swapInputError
                    ) : routeIsSyncing || routeIsLoading ? (
                      <Trans>Swap</Trans>
                    ) : (
                      <Trans>Swap</Trans>
                    )}
                  </Text>
                </ButtonError>
              )}
            </div>
          </AutoColumn>
        </Wrapper>
      </AppBody>
      <SwitchLocaleLink />
    </>
  )
}
