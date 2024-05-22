import { Currency, CurrencyAmount, Token } from '@ubeswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useUbeConvertContract } from 'hooks/useContract'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDown } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { Text } from 'rebass'
import { useCurrencyBalance } from 'state/connection/hooks'
import styled, { useTheme } from 'styled-components'

import { ButtonConfirmed, ButtonError, ButtonLight } from '../../components-old/Button'
import Column, { AutoColumn } from '../../components-old/Column'
import CurrencyInputPanel from '../../components-old/CurrencyInputPanel'
import { CardNoise, CardSection, DataCard } from '../../components-old/earn/styled'
import Loader from '../../components-old/Loader'
import { SwapPoolTabs } from '../../components-old/NavigationTabs'
import ProgressSteps from '../../components-old/ProgressSteps'
import { AutoRow, RowBetween } from '../../components-old/Row'
import { ArrowWrapper, BottomGrouping, SwapCallbackError, Wrapper } from '../../components-old/swap/styleds'
import SwapHeader from '../../components-old/swap/SwapHeader'
import { useToken } from '../../hooks/Tokens'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
// import { useWalletModalToggle } from '../../state/application/hooks'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { ThemedText } from 'theme/components'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import AppBody from '../AppBody'

enum Field {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
}

const VoteCard = styled(DataCard)`
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, #8878c3 0%, #222 100%);
  overflow: hidden;
  max-width: 640px;
  width: 100%;
  margin-bottom: 20px;
`

const CONVERT_CONTRACT_ADDRESS = '0x9DFc135e0984Fe88aCd45d68e62a73E98Dbb7A36'

export function useConvertCallback(): [
  boolean,
  (amountToConvert: CurrencyAmount<Token>, maxOldUbeAmount: string, signature: string) => Promise<void>
] {
  const { account } = useWeb3React()

  // const hasPendingTx = useHasPendingTransaction()
  const [isPending, setIsPending] = useState(false)

  const convertContract = useUbeConvertContract()
  // const doTransaction = useDoTransaction()

  const approve = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (amountToConvert: CurrencyAmount<Token>, maxOldUbeAmount: string, signature: string): Promise<void> => {
      if (!account) {
        console.error('no account')
        return
      }
      // if (hasPendingTx) {
      //   console.error('already pending transaction')
      //   return
      // }
      if (isPending) {
        console.error('already pending')
        return
      }

      if (!convertContract || !convertContract.signer) {
        console.error('contract or signer is null')
        return
      }

      if (!amountToConvert) {
        console.error('amountToConvert is null')
        return
      }

      setIsPending(true)
      try {
        // await doTransaction(convertContract, 'convert', {
        //   args: [amountToConvert.raw.toString(), maxOldUbeAmount, signature],
        //   summary: `Convert to new UBE`,
        // })
      } catch (e) {
        console.error(e)
      } finally {
        setIsPending(false)
      }
    },
    [isPending, convertContract, account]
  )

  return [isPending, approve]
}

export default function ClaimNewUbeToken() {
  const { t } = useTranslation()

  const { account, chainId } = useWeb3React()

  const theme = useTheme()

  // toggle wallet when disconnected
  //const toggleWalletModal = useWalletModalToggle()
  const toggleWalletModal = () => {}

  const [typedValue, setTypedValue] = useState('')

  const inputCurrency = useToken('0x00Be915B9dCf56a3CBE739D9B9c202ca692409EC')
  const outputCurrency = useToken('0x71e26d0E519D14591b9dE9a0fE9513A398101490')
  const currencies: { [field in Field]: Token | null | undefined } = useMemo(() => {
    return {
      [Field.INPUT]: inputCurrency,
      [Field.OUTPUT]: outputCurrency,
    }
  }, [inputCurrency, outputCurrency])

  const inputBalance = useCurrencyBalance(account ?? undefined, inputCurrency ?? undefined)

  const [whitelist, setWhitelist] = useState<{
    [key: string]: { amount: string; signature: string }
  } | null>(null)
  const [whitelistLoading, setWhitelistLoading] = useState(true)
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/Ubeswap/static/main/whitelist.json')
      .then((response) => response.json())
      .then((data) => {
        setWhitelistLoading(false)
        setWhitelist(data)
      })
      .catch((error) => {
        console.error(error)
        setWhitelistLoading(false)
      })
  }, [])

  const parsedAmount = useMemo(() => {
    return tryParseCurrencyAmount(typedValue, inputCurrency ?? undefined)
  }, [typedValue, inputCurrency])
  const outputAmount = parsedAmount
  const outputAmountText = outputAmount?.toSignificant(6) ?? ''

  // the callback to execute the swap
  const [isConvertPending, convertCallback] = useConvertCallback()

  const swapInputError: string | undefined = useMemo(() => {
    if (!account) {
      return 'Connect Wallet'
    }
    if (whitelistLoading) {
      return 'Loading...'
    }
    if (whitelist && whitelist[account.toLocaleLowerCase()] == null) {
      return 'Account is not whitelisted'
    }
    if (isConvertPending) {
      return 'Pending...'
    }
    if (!parsedAmount) {
      return 'Enter an amount'
    }
    if (!currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
      return 'Select a token'
    }
    if (inputBalance && parsedAmount && inputBalance.lessThan(parsedAmount)) {
      return 'Insufficient old-UBE balance'
    }
    return undefined
  }, [account, parsedAmount, currencies, inputBalance, whitelistLoading, whitelist, isConvertPending])

  const isValid = !swapInputError

  const handleTypeInput = useCallback((value: string) => {
    setTypedValue(value)
  }, [])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleTypeOutput = useCallback((_value: string) => {
    console.error('handleTypeOutput can not change')
  }, [])

  // Approval process
  const [approval, approveCallback] = useApproveCallback(parsedAmount, CONVERT_CONTRACT_ADDRESS)
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
    console.log('000')
    if (!convertCallback || !whitelist || !parsedAmount) {
      console.log('111')
      console.log(convertCallback)
      console.log(whitelist)
      console.log(parsedAmount)
      return
    }
    const data = whitelist[account?.toLocaleLowerCase() || '']
    if (!data) {
      console.log('222')
      console.log(account)
      return
    }
    console.log('333')
    convertCallback(parsedAmount, data.amount, data.signature)
      .then(() => {
        console.log('444')
        //
      })
      .catch((error) => {
        console.log('xxx')
        console.error(error)
      })
  }, [convertCallback, account, parsedAmount, whitelist])

  // errors
  // const [showInverted, setShowInverted] = useState<boolean>(false)

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

  return (
    <>
      <SwapPoolTabs active="swap" />
      <VoteCard>
        <CardNoise />
        <CardSection>
          <AutoColumn gap="md">
            <RowBetween>
              <ThemedText.DeprecatedWhite fontWeight={600}>New Tokenomics</ThemedText.DeprecatedWhite>
            </RowBetween>
            <RowBetween>
              <ThemedText.DeprecatedWhite fontSize={14}>
                Ubeswap has migrated to new token economics.
              </ThemedText.DeprecatedWhite>
            </RowBetween>
            <RowBetween>
              <ThemedText.DeprecatedWhite fontSize={14}>
                After 75% of the liquid tokens are swapped, 1 month will be provided for the remainder of the community
                to swap. Any tokens not swapped after this period will be burned.
              </ThemedText.DeprecatedWhite>
            </RowBetween>
          </AutoColumn>
        </CardSection>
        <CardNoise />
      </VoteCard>
      <AppBody>
        <SwapHeader title="Convert to new UBE" hideSettings={true} />
        <Wrapper id="swap-page">
          <AutoColumn gap="md">
            <CurrencyInputPanel
              label={t('from')}
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
              label={t('to')}
              showMaxButton={false}
              currency={currencies[Field.OUTPUT]}
              otherCurrency={currencies[Field.INPUT]}
              disableCurrencySelect={true}
              id="swap-ube-output"
              disabled
            />
          </AutoColumn>
          <BottomGrouping>
            {!account ? (
              <ButtonLight onClick={toggleWalletModal}>{t('connectWallet')}</ButtonLight>
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
                  error={false}
                >
                  <Text fontSize={16} fontWeight={500}>
                    Convert
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
                  {swapInputError ? swapInputError : 'Convert'}
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
      </AppBody>
    </>
  )
}
