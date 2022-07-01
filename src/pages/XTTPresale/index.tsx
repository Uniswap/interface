import { formatEther, parseEther, parseUnits } from '@ethersproject/units'
import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import JSBI from 'jsbi'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import ReactGA from 'react-ga'
import { ThemeContext } from 'styled-components/macro'

import { ButtonError, ButtonLight } from '../../components/Button'
import { GreyCard } from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { Wrapper } from '../../components/swap/styleds'
import { SwitchLocaleLink } from '../../components/SwitchLocaleLink'
import XttPresaleHeader from '../../components/xttpresale/XttPresaleHeader'
import { ExtendedXDC } from '../../constants/extended-xdc'
import { ApprovalState, useApproveCallbackFromTrade } from '../../hooks/useApproveCallback'
import useENSAddress from '../../hooks/useENSAddress'
import { useERC20PermitFromTrade, UseERC20PermitState } from '../../hooks/useERC20Permit'
import { useSwapCallback } from '../../hooks/useSwapCallback'
import { useUSDCValue } from '../../hooks/useUSDCPrice'
import useWrapCallback, { WrapType } from '../../hooks/useWrapCallback'
import { useActiveWeb3React } from '../../hooks/web3'
import { useWalletModalToggle } from '../../state/application/hooks'
import { Field } from '../../state/swap/actions'
import { tryParseAmount, useDerivedSwapInfo, useSwapActionHandlers, useSwapState } from '../../state/swap/hooks'
import { useCurrencyBalance } from '../../state/wallet/hooks'
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

  const xdcBalance = useCurrencyBalance(account ?? undefined, ether ?? undefined)

  const [routeNotFound, routeIsLoading, routeIsSyncing] = useMemo(() => [!v2Trade?.route.path, false, false], [v2Trade])

  const fiatValueInput = useUSDCValue(parsedAmounts[Field.INPUT])
  const fiatValueOutput = useUSDCValue(parsedAmounts[Field.OUTPUT])

  const { onCurrencySelection, onUserInput, onChangeRecipient } = useSwapActionHandlers()
  const isValid = !swapInputError
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  const handleTypeInput = useCallback(
    (value: string) => {
      const bonus = 10
      if (value === '') {
        setV({ xtt: '', xdc: '' })
      }
      setV((v) => ({ ...v, xdc: value }))
      if (ether && xttToken) {
        const parsed = tryParseAmount(xttPresaleState.tokenPerETH, ether)
        const parsedValue = tryParseAmount(value, xttToken)
        console.log(parsed, parsedValue)
        if (parsed !== undefined && parsedValue !== undefined) {
          const xttAmount = parseUnits(xttPresaleState.maximumDepositEthAmount, 0).eq(parseEther(value))
            ? parsed.multiply(100 + bonus).divide(100)
            : parsed
          setV({
            xdc: value,
            xtt: xttAmount
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

  const handleCheckBalance: (parsedValue: CurrencyAmount<ExtendedXDC>) => void = (parsedValue) => {
    if (!!xdcBalance) {
      console.log('xdcBalance', 'parsedValue', xdcBalance.toFixed(2) < parsedValue.toFixed(2))
      xdcBalance.toFixed(2) < parsedValue.toFixed(2)
        ? setPresaleError({ error: true, errorText: 'Insufficient balance for this transaction.' })
        : setPresaleError({ error: false, errorText: '' })
    }
  }
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
  const [presaleError, setPresaleError] = useState({
    error: false,
    errorText: '',
  })

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

  const handleMaxInput = useCallback(() => {
    maxInputAmount && handleTypeInput(maxInputAmount.toFixed(2))
  }, [maxInputAmount, handleTypeInput])

  const isInDepositRange = useMemo(() => {
    if (!xttPresaleState.maximumDepositEthAmount || !xttPresaleState.minimumDepositEthAmount || !v.xdc) {
      return true
    }

    const maximum = parseUnits(xttPresaleState.maximumDepositEthAmount, 0)
    const minimum = parseUnits(xttPresaleState.minimumDepositEthAmount, 0)
    const parsedV = parseEther(v.xdc)

    if (!maximum || !minimum || !parsedV) {
      setPresaleError({
        error: false,
        errorText: '',
      })
      return false
    }

    if (maximum.lt(parsedV)) {
      setPresaleError({ error: true, errorText: `Max amount: ${formatEther(xttPresaleState.maximumDepositEthAmount)}` })
      return true
    }

    if (minimum.gt(parsedV)) {
      setPresaleError({
        error: true,
        errorText: `Min amount: ${formatEther(xttPresaleState.minimumDepositEthAmount)}`,
      })
      return true
    }

    setPresaleError({
      error: false,
      errorText: '',
    })
    return false
  }, [v.xdc])

  return (
    <>
      <XttPresaleUpdater />
      <AppBody>
        <XttPresaleHeader state={xttPresaleState} />
        <Wrapper id="swap-page">
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
              />
              <CurrencyInputPanel
                value={v.xtt}
                onUserInput={handleTypeOutput}
                label={independentField === Field.INPUT && !showWrap ? <Trans>To (at least)</Trans> : <Trans>To</Trans>}
                showMaxButton={false}
                currency={xttToken}
                id="swap-currency-output"
              />
            </div>
            <div>
              {!account ? (
                <ButtonLight onClick={toggleWalletModal}>
                  <Trans>Connect Wallet</Trans>
                </ButtonLight>
              ) : routeNotFound && userHasSpecifiedInputOutput && !routeIsLoading && !routeIsSyncing ? (
                <GreyCard style={{ textAlign: 'center' }}>
                  <ThemedText.Main mb="4px">
                    <Trans>Insufficient liquidity for this trade.</Trans>
                  </ThemedText.Main>
                </GreyCard>
              ) : (
                <ButtonError width="100%" id="swap-button" disabled={presaleError.error} error={presaleError.error}>
                  {presaleError.error ? <Trans>{presaleError.errorText}</Trans> : <Trans>Buy</Trans>}
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
