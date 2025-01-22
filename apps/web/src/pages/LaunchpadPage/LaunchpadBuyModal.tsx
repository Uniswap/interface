import { ChainId, Currency, CurrencyAmount, Token } from '@ubeswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
// import { Dialog } from 'components/Dialog/Dialog'
import { AddressZero } from '@ethersproject/constants'
import { formatEther } from '@ethersproject/units'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import Modal from 'components/Modal'
import TransactionConfirmationModal from 'components/TransactionConfirmationModal'
import { usePactConvertContract } from 'hooks/useContract'
import { useSingleCallResult } from 'lib/hooks/multicall'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { LaunchpadDetails } from 'pages/LaunchpadList/data/useLaunchpads'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDown } from 'react-feather'
import { Text } from 'rebass'
import { useCurrencyBalance } from 'state/connection/hooks'
import styled, { useTheme } from 'styled-components'
import { ButtonConfirmed, ButtonError, ButtonLight } from '../../components-old/Button'
import Card from '../../components-old/Card'
import Column, { AutoColumn } from '../../components-old/Column'
import CurrencyInputPanel from '../../components-old/CurrencyInputPanel'
import Loader from '../../components-old/Loader'
import ProgressSteps from '../../components-old/ProgressSteps'
import { AutoRow, RowBetween } from '../../components-old/Row'
import SwapHeader from '../../components-old/swap/SwapHeader'
import { ArrowWrapper, BottomGrouping, SwapCallbackError, Wrapper } from '../../components-old/swap/styleds'
import { useToken } from '../../hooks/Tokens'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { useBuyCallback } from './launchpad-actions'

enum Field {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
}

const ModalWrapper = styled(Column)`
  width: 100%;
  padding: 8px;
`

export default function LaunchpadBuyModal({
  isOpen,
  launchpadAddress,
  launchpad,
  onDismiss,
}: {
  isOpen: boolean
  launchpadAddress: string
  launchpad: LaunchpadDetails
  onDismiss: () => void
}) {
  const { account, chainId } = useWeb3React()

  const theme = useTheme()

  const [, toggleAccountDrawer] = useAccountDrawer()

  const [typedValue, setTypedValue] = useState('')

  const inputCurrency = useToken(launchpad.options.tokenSale.quoteToken, ChainId.CELO)
  const outputCurrency = useToken(launchpad.options.tokenInfo.tokenAddress, ChainId.CELO)
  const currencies: { [field in Field]: Token | null | undefined } = useMemo(() => {
    return {
      [Field.INPUT]: inputCurrency,
      [Field.OUTPUT]: outputCurrency,
    }
  }, [inputCurrency, outputCurrency])

  const inputBalance = useCurrencyBalance(account ?? undefined, inputCurrency ?? undefined)

  const convertContract = usePactConvertContract()
  const convertedAmount = useSingleCallResult(convertContract, 'accountToConvertedAmount', [account ?? AddressZero])
  const convertedAmountText = convertedAmount.result?.length
    ? Number(formatEther(convertedAmount.result?.[0])).toFixed(1).replace(/\.0+$/, '')
    : 'loading...'

  const parsedAmount = useMemo(() => {
    return tryParseCurrencyAmount(typedValue, inputCurrency ?? undefined)
  }, [typedValue, inputCurrency])
  const outputAmount = parsedAmount
    ? parseFloat(parsedAmount.toSignificant(6)) / parseFloat(launchpad.options.tokenSale.sellPrice)
    : 0
  const outputAmountText = parseFloat(outputAmount.toFixed(6)).toString()

  // the callback to execute the swap
  const [buyCallback, buyTx, isBuying] = useBuyCallback(launchpadAddress)

  const swapInputError: string | undefined = useMemo(() => {
    if (!account) {
      return 'Connect Wallet'
    }
    if (isBuying) {
      return 'Pending...'
    }
    if (!parsedAmount) {
      return 'Enter an amount'
    }
    if (!currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
      return 'Select a token'
    }
    if (inputBalance && parsedAmount && inputBalance.lessThan(parsedAmount)) {
      return `Insufficient ${inputCurrency?.symbol || ''} balance`
    }
    return undefined
  }, [account, parsedAmount, currencies, inputBalance, isBuying, inputCurrency])

  const isValid = !swapInputError

  const handleTypeInput = useCallback((value: string) => {
    setTypedValue(value)
  }, [])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleTypeOutput = useCallback((_value: string) => {
    console.error('handleTypeOutput can not change')
  }, [])

  // Approval process
  const [approval, approveCallback] = useApproveCallback(parsedAmount, launchpadAddress)
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)
  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [approval, approvalSubmitted])
  const handleApprove = useCallback(() => {
    if (!approveCallback) {
      return
    }
    approveCallback()
      .then(() => {
        //
      })
      .catch((error) => {
        console.error(error)
      })
  }, [approveCallback])

  const maxAmountInput: CurrencyAmount<Currency> | undefined = maxAmountSpend(inputBalance)
  const atMaxAmountInput = Boolean(maxAmountInput && parsedAmount?.equalTo(maxAmountInput))
  const atHalfAmountInput = Boolean(
    maxAmountInput && Number(maxAmountInput.toExact()) * 0.5 === Number(parsedAmount?.toExact())
  )

  const swapCallbackError = ''
  const swapErrorMessage = ''

  const handleSwap = useCallback(() => {
    buyCallback(parsedAmount!)
      .then(() => {
        console.log('444')
        setTypedValue('')
        setApprovalSubmitted(false)
      })
      .catch((error) => {
        console.log('xxx')
        console.error(error)
      })
      .finally(() => {
        setTypedValue('')
        onDismiss()
      })
  }, [buyCallback, parsedAmount, onDismiss])

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  // never show if price impact is above threshold in non expert mode
  const showApproveFlow =
    !swapInputError &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      (approvalSubmitted && approval === ApprovalState.APPROVED))

  const handleMaxInput = useCallback(() => {
    if (maxAmountInput) {
      if (chainId && currencies?.INPUT?.address === '0x471EcE3750Da237f93B8E339c536989b8978a438') {
        handleTypeInput(Math.max(Number(maxAmountInput.toExact()) - 0.01, 0).toString())
      } else {
        handleTypeInput(maxAmountInput.toExact())
      }
    }
  }, [maxAmountInput, handleTypeInput, currencies, chainId])

  const handleHalfInput = useCallback(() => {
    if (maxAmountInput) {
      handleTypeInput(Math.max(Number(maxAmountInput.toExact()) * 0.5, 0).toString())
    }
  }, [maxAmountInput, handleTypeInput])

  const onDissmissConfirmationModal = useCallback(() => {}, [])

  return (
    <>
      <Modal isOpen={isOpen} onDismiss={onDismiss}>
        <ModalWrapper>
          <SwapHeader title="Convert to new PACT" hideSettings={true} />
          <Wrapper id="swap-page">
            <AutoColumn gap="md">
              <CurrencyInputPanel
                label="From"
                value={typedValue}
                showMaxButton={!atMaxAmountInput}
                showHalfButton={!atHalfAmountInput}
                currency={currencies[Field.INPUT]}
                onUserInput={handleTypeInput}
                onMax={handleMaxInput}
                onHalf={handleHalfInput}
                otherCurrency={currencies[Field.OUTPUT]}
                disableCurrencySelect={true}
                id="swap-ube-input"
              />

              <AutoColumn justify="space-between">
                <AutoRow justify="center" style={{ padding: '0 1rem' }}>
                  <ArrowWrapper clickable={false}>
                    <ArrowDown size="16" color={theme.primary1} />
                  </ArrowWrapper>
                </AutoRow>
              </AutoColumn>

              <CurrencyInputPanel
                value={outputAmountText}
                onUserInput={handleTypeOutput}
                label="To"
                showMaxButton={false}
                currency={currencies[Field.OUTPUT]}
                otherCurrency={currencies[Field.INPUT]}
                disableCurrencySelect={true}
                hideBalance={true}
                id="swap-ube-output"
                disabled
              />

              <Card padding="0px" borderRadius="20px">
                <AutoColumn gap="8px" style={{ padding: '0 16px' }}>
                  <RowBetween align="center">
                    <Text fontWeight={800} fontSize={14} color={theme.text1}>
                      Bought / Max:
                    </Text>
                    <Text fontWeight={800} fontSize={14} color={theme.text1}>
                      {convertedAmountText}
                    </Text>
                  </RowBetween>
                </AutoColumn>
              </Card>
            </AutoColumn>
            <BottomGrouping>
              {!account ? (
                <ButtonLight onClick={toggleAccountDrawer}>Connect Wallet</ButtonLight>
              ) : showApproveFlow ? (
                <RowBetween>
                  <ButtonConfirmed
                    onClick={handleApprove}
                    disabled={approval !== ApprovalState.NOT_APPROVED || approvalSubmitted}
                    width="48%"
                    altDisabledStyle={approval === ApprovalState.PENDING} // show solid button while waiting
                    confirmed={approval === ApprovalState.APPROVED}
                  >
                    {approval === ApprovalState.PENDING ? (
                      <AutoRow gap="6px" justify="center">
                        Approving <Loader stroke="white" />
                      </AutoRow>
                    ) : approvalSubmitted && approval === ApprovalState.APPROVED ? (
                      'Approved'
                    ) : (
                      'Approve ' + currencies[Field.INPUT]?.symbol
                    )}
                  </ButtonConfirmed>
                  <ButtonError
                    onClick={handleSwap}
                    width="48%"
                    id="swap-button"
                    disabled={!isValid || approval !== ApprovalState.APPROVED}
                    error={isValid && !!swapCallbackError}
                  >
                    <Text fontSize={16} fontWeight={500}>
                      {swapInputError ? swapInputError : 'Buy'}
                    </Text>
                  </ButtonError>
                </RowBetween>
              ) : (
                <ButtonError
                  onClick={handleSwap}
                  id="swap-button"
                  disabled={!isValid || !!swapCallbackError}
                  error={isValid && !!swapCallbackError}
                >
                  <Text fontSize={20} fontWeight={500}>
                    {swapInputError ? swapInputError : 'Buy'}
                  </Text>
                </ButtonError>
              )}
              {showApproveFlow && (
                <Column style={{ marginTop: '1rem' }}>
                  <ProgressSteps steps={[approval === ApprovalState.APPROVED]} />
                </Column>
              )}
              {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
            </BottomGrouping>
          </Wrapper>
        </ModalWrapper>
      </Modal>
      <TransactionConfirmationModal
        isOpen={isBuying}
        attemptingTxn={isBuying}
        hash={buyTx}
        reviewContent={() => <div></div>}
        onDismiss={onDissmissConfirmationModal}
        pendingText="Buying from launchpad"
      />
    </>
  )
}
