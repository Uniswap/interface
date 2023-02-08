import { Currency, TokenAmount, WETH } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Clipboard } from 'react-feather'
import { Flex } from 'rebass'
import styled from 'styled-components'

import { AddressInput } from 'components/AddressInputPanel'
import { ButtonPrimary } from 'components/Button'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { RowBetween } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import CurrencyListHasBalance from 'components/WalletPopup/SendToken/CurrencyListSelect'
import WarningBrave from 'components/WalletPopup/SendToken/WarningBrave'
import useSendToken from 'components/WalletPopup/SendToken/useSendToken'
import { useActiveWeb3React } from 'hooks'
import useENS from 'hooks/useENS'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import { tryParseAmount } from 'state/swap/hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { useCheckAddressSolana } from 'state/wallet/solanaHooks'
import { TRANSACTION_STATE_DEFAULT, TransactionFlowState } from 'types'
import { formattedNum, shortenAddress } from 'utils'
import { errorFriendly } from 'utils/dmm'
import { maxAmountSpend } from 'utils/maxAmountSpend'

const Label = styled.label<{ color?: string }>`
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme, color }) => color ?? theme.subText};
`

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 100%;
  gap: 14px;
  justify-content: space-between;
  overflow-y: scroll;
  &::-webkit-scrollbar {
    display: block;
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.disableText};
  }
`

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
`

export default function SendToken({
  loadingTokens,
  currencies,
  currencyBalances,
}: {
  loadingTokens: boolean
  currencies: Currency[]
  currencyBalances: { [address: string]: TokenAmount | undefined }
}) {
  const [recipient, setRecipient] = useState('')
  const [displayRecipient, setDisplayRecipient] = useState('')

  const [currencyIn, setCurrency] = useState<Currency>()
  const [inputAmount, setInputAmount] = useState<string>('')
  const [showListToken, setShowListToken] = useState(false)
  const { account, isEVM, isSolana, chainId } = useActiveWeb3React()
  const [flowState, setFlowState] = useState<TransactionFlowState>(TRANSACTION_STATE_DEFAULT)

  const theme = useTheme()
  const balance = useCurrencyBalance(currencyIn)
  const maxAmountInput = maxAmountSpend(balance)

  const handleMaxInput = useCallback(() => {
    if (!maxAmountInput) return
    setInputAmount(maxAmountInput?.toExact())
  }, [maxAmountInput])

  const handleHalfInput = useCallback(() => {
    if (!balance) return
    setInputAmount(balance?.divide(2).toExact() || '')
  }, [balance])

  const parseInputAmount = tryParseAmount(inputAmount, currencyIn)

  const respEvm = useENS(isEVM ? recipient : '')
  const respSolana = useCheckAddressSolana(isEVM ? '' : recipient)

  const { address, loading } = isEVM ? respEvm : respSolana

  const recipientError =
    recipient &&
    ((!loading && !address) ||
      (!recipient.startsWith('0x') && isEVM) ||
      (isSolana && recipient.toLowerCase().startsWith('0x')))
      ? t`Invalid wallet address`
      : recipient.toLowerCase() === account?.toLowerCase()
      ? t`You can’t use your own address as a receiver`
      : ''

  const inputError = useMemo(() => {
    if (!inputAmount) return
    if (parseFloat(inputAmount) === 0 || !parseInputAmount) {
      return t`Your input amount is invalid.`
    }
    if (balance && parseInputAmount?.greaterThan(balance)) {
      return t`Insufficient ${currencyIn?.symbol} balance`
    }
    return
  }, [currencyIn, balance, inputAmount, parseInputAmount])

  const hasError = inputError || recipientError

  const { sendToken, isSending, estimateGas } = useSendToken(currencyIn, address ?? '', inputAmount)
  const hideModalConfirm = () => {
    setFlowState(TRANSACTION_STATE_DEFAULT)
  }

  const onSendToken = async () => {
    try {
      setFlowState(state => ({
        ...state,
        attemptingTxn: true,
        showConfirm: true,
        pendingText: t`Sending ${inputAmount} ${currencyIn?.symbol} to ${recipient}`,
      }))
      await sendToken()
      hideModalConfirm()
      setInputAmount('')
      onChangeRecipient('')
    } catch (error) {
      console.error(error)
      setFlowState(state => ({
        ...state,
        attemptingTxn: false,
        errorMessage: errorFriendly(error?.message ?? 'Error occur, please try again'),
      }))
    }
  }
  const disableButtonSend = isSending || !inputAmount || !currencyIn || !recipient || !!hasError

  const isInit = useRef(false)
  useEffect(() => {
    if (!loadingTokens && !isInit.current && currencies[0]) {
      setCurrency(currencies[0])
      isInit.current = true
    }
  }, [loadingTokens, currencies])

  const onPaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      onChangeRecipient(text)
    } catch (error) {}
  }

  const ref = useRef(null)
  useOnClickOutside(ref, () => {
    setShowListToken(false)
  })

  const confirmationContent = () => {
    return (
      <Flex flexDirection={'column'} width="100%">
        <div>
          {flowState.errorMessage ? (
            <TransactionErrorContent onDismiss={hideModalConfirm} message={flowState.errorMessage} />
          ) : null}
        </div>
      </Flex>
    )
  }

  const addressParam = useMemo(
    () => [WETH[chainId].wrapped.address, currencyIn?.wrapped.address].filter(Boolean) as string[],
    [chainId, currencyIn],
  )

  const tokensPrices = useTokenPrices(addressParam)

  const usdPriceNative = tokensPrices[WETH[chainId].wrapped.address] ?? 0
  const usdPriceCurrencyIn = currencyIn ? tokensPrices[currencyIn.wrapped.address] : 0

  const estimateUsd = usdPriceCurrencyIn * parseFloat(inputAmount)

  const formatRecipient = (val: string) => {
    try {
      setDisplayRecipient(shortenAddress(chainId, val, isSolana || isMobile ? 14 : 16))
    } catch {
      setDisplayRecipient(val)
    }
  }

  const onChangeRecipient = (val: string) => {
    setRecipient(val)
    formatRecipient(val)
  }

  const onFocus = () => {
    setDisplayRecipient(recipient)
  }

  const onBlur = () => {
    formatRecipient(recipient)
  }

  return (
    <Wrapper>
      <Flex flexDirection={'column'} style={{ gap: 18 }}>
        <Label>
          <Trans>Recipient</Trans>
        </Label>

        <div>
          <AddressInput
            style={{ color: theme.subText, textOverflow: 'unset' }}
            error={!!recipientError}
            onChange={e => onChangeRecipient(e.currentTarget.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            value={displayRecipient}
            placeholder={isEVM ? '0x...' : 'Wallet address'}
            icon={
              <MouseoverTooltip text={t`Paste from clipboard`} width="150px">
                <Clipboard size={20} cursor="pointer" color={theme.subText} onClick={onPaste} />
              </MouseoverTooltip>
            }
          />
          <Label color={theme.red} style={{ opacity: recipientError ? 1 : 0, transition: '0.3s' }}>
            {recipientError}
          </Label>
        </div>

        <InputWrapper ref={ref}>
          <CurrencyInputPanel
            id="send-token-wallet-ui"
            error={!!inputError}
            maxLength={16}
            value={inputAmount}
            positionMax="top"
            currency={currencyIn}
            onUserInput={setInputAmount}
            onMax={handleMaxInput}
            onHalf={handleHalfInput}
            onClickSelect={() => setShowListToken(!showListToken)}
            loadingText={loadingTokens ? t`Loading token...` : undefined}
            estimatedUsd={estimateUsd ? formattedNum(estimateUsd.toString(), true).toString() : undefined}
          />

          {showListToken && (
            <CurrencyListHasBalance
              loading={loadingTokens}
              currencies={currencies}
              currencyBalances={currencyBalances}
              selectedCurrency={currencyIn}
              onCurrencySelect={currency => {
                setCurrency(currency)
                setShowListToken(false)
              }}
            />
          )}
        </InputWrapper>

        <WarningBrave token={currencyIn} />

        <RowBetween>
          <Label>
            <Trans>Gas Fee</Trans>
          </Label>
          <Label color={theme.text}>
            {estimateGas && usdPriceNative
              ? `~ ${formattedNum((estimateGas * usdPriceNative).toString(), true)} `
              : '-'}
          </Label>
        </RowBetween>
      </Flex>
      <ButtonPrimary height="44px" onClick={onSendToken} disabled={disableButtonSend}>
        {inputError ? inputError : isSending ? <Trans>Sending token</Trans> : <Trans>Send</Trans>}
      </ButtonPrimary>

      <TransactionConfirmationModal
        hash={flowState.txHash}
        isOpen={flowState.showConfirm}
        onDismiss={hideModalConfirm}
        attemptingTxn={flowState.attemptingTxn}
        content={confirmationContent}
        pendingText={flowState.pendingText}
      />
    </Wrapper>
  )
}
