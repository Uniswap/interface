import type { TransactionResponse } from '@ethersproject/providers'
import { ChainId, Currency, CurrencyAmount, Token } from '@ubeswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
// import { Dialog } from 'components/Dialog/Dialog'
import { BigNumber } from '@ethersproject/bignumber'
import { AddressZero } from '@ethersproject/constants'
import { formatEther } from '@ethersproject/units'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { usePactConvertContract } from 'hooks/useContract'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDown } from 'react-feather'
import { Text } from 'rebass'
import { useCurrencyBalance } from 'state/connection/hooks'
import styled, { useTheme } from 'styled-components'

// import { AlertCircle } from 'ui/src/components/icons'

import { ButtonConfirmed, ButtonError, ButtonLight } from '../../components-old/Button'
import Card from '../../components-old/Card'
import Column, { AutoColumn } from '../../components-old/Column'
import CurrencyInputPanel from '../../components-old/CurrencyInputPanel'
import Loader from '../../components-old/Loader'
import { SwapPoolTabs } from '../../components-old/NavigationTabs'
import ProgressSteps from '../../components-old/ProgressSteps'
import { AutoRow, RowBetween } from '../../components-old/Row'
import { CardNoise, CardSection, DataCard } from '../../components-old/earn/styled'
import SwapHeader from '../../components-old/swap/SwapHeader'
import { ArrowWrapper, BottomGrouping, SwapCallbackError, Wrapper } from '../../components-old/swap/styleds'
import { useToken } from '../../hooks/Tokens'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
// import { useWalletModalToggle } from '../../state/application/hooks'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import AppBody from 'pages/AppBody'
import { usePendingTransactions, useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'state/transactions/types'
import { ThemedText } from 'theme/components'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { maxAmountSpend } from '../../utils/maxAmountSpend'

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

const CONVERT_CONTRACT_ADDRESS = '0x8828b88F3e1C256D34D53e50Dc7E347881934bfd'

export function useConvertCallback(): [
  boolean,
  (amountToConvert: CurrencyAmount<Token>, maxOldUbeAmount: string, signature: string) => Promise<void>
] {
  const { account } = useWeb3React()
  const addTransaction = useTransactionAdder()

  const pendingTxs = usePendingTransactions()
  const [isPending, setIsPending] = useState(false)

  const convertContract = usePactConvertContract()

  const approve = useCallback(
    async (amountToConvert: CurrencyAmount<Token>, maxOldUbeAmount: string, signature: string): Promise<void> => {
      if (!account) {
        console.error('no account')
        return
      }
      if (pendingTxs.length > 0) {
        console.error('already pending transaction')
        return
      }
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

      try {
        setIsPending(true)

        const convertArgs = [amountToConvert.quotient.toString(), maxOldUbeAmount, signature] as const
        await convertContract.estimateGas
          .convert(...convertArgs)
          .then((estimatedGasLimit) => {
            return convertContract
              .convert(...convertArgs, {
                gasLimit: calculateGasMargin(estimatedGasLimit),
              })
              .then((response: TransactionResponse) => {
                addTransaction(response, {
                  type: TransactionType.CUSTOM,
                  summary: 'Convert to new PACT',
                })
                return response.wait(2)
              })
          })
          .catch((error) => {
            console.error('Failed to send transaction', error)
            setIsPending(false)
            if (error?.code !== 4001) {
              console.error(error)
            }
          })
      } catch (e) {
        console.error(e)
      } finally {
        setIsPending(false)
      }
    },
    [isPending, convertContract, account, pendingTxs, addTransaction]
  )

  return [isPending, approve]
}

export default function ClaimNewPactToken() {
  const { account, chainId } = useWeb3React()

  const theme = useTheme()

  const [, toggleAccountDrawer] = useAccountDrawer()

  const [typedValue, setTypedValue] = useState('')

  const inputCurrency = useToken('0xC1542E54b34964b7fD0De0B252A8F9Ebd0F9c01e', ChainId.CELO)
  const outputCurrency = useToken('0x0385F59A81D2fecfDb9722B0ee608722D7CEeA6E', ChainId.CELO)
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
    fetch('https://raw.githubusercontent.com/Ubeswap/static/main/pact-whitelist.json')
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

  const maxAllowed = useMemo(() => {
    if (!whitelistLoading && whitelist && account) {
      const data = whitelist[account?.toLocaleLowerCase() || '']
      if (data) {
        return BigNumber.from(data.amount)
      }
    }
    return BigNumber.from(0)
  }, [whitelistLoading, whitelist, account])
  const maxAllowedText = Number(formatEther(maxAllowed)).toFixed(1).replace(/\.0+$/, '')

  const convertContract = usePactConvertContract()
  const convertedAmount = useSingleCallResult(convertContract, 'accountToConvertedAmount', [account ?? AddressZero])
  const convertedAmountText = convertedAmount.result?.length
    ? Number(formatEther(convertedAmount.result?.[0])).toFixed(1).replace(/\.0+$/, '')
    : 'loading...'

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
      return 'Insufficient old-PACT balance'
    }
    if (whitelist) {
      const data = whitelist[account?.toLocaleLowerCase() || '']
      if (data && convertedAmount.loading == false && convertedAmount.result?.length) {
        if (BigNumber.from(data.amount).sub(convertedAmount.result[0]).lt(parsedAmount.quotient.toString())) {
          return 'Exceeds allowed amount'
        }
      }
    }
    return undefined
  }, [account, parsedAmount, currencies, inputBalance, whitelistLoading, whitelist, isConvertPending, convertedAmount])

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
        setTypedValue('')
        setApprovalSubmitted(false)
      })
      .catch((error) => {
        console.log('xxx')
        console.error(error)
      })
      .finally(() => {
        setTypedValue('')
      })
  }, [convertCallback, account, parsedAmount, whitelist])

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
              <ThemedText.DeprecatedWhite fontWeight={600}>PACT New Tokenomics</ThemedText.DeprecatedWhite>
            </RowBetween>
            <RowBetween>
              <ThemedText.DeprecatedWhite fontSize={14}>
                ImpactMarket has migrated to new token economics.
              </ThemedText.DeprecatedWhite>
            </RowBetween>
            <RowBetween>
              <ThemedText.DeprecatedWhite fontSize={14}>Tokens will be swapped, 1:1 ratio.</ThemedText.DeprecatedWhite>
            </RowBetween>
          </AutoColumn>
        </CardSection>
        <CardNoise />
      </VoteCard>
      <AppBody>
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
              id="swap-ube-output"
              disabled
            />

            <Card padding="0px" borderRadius="20px">
              <AutoColumn gap="8px" style={{ padding: '0 16px' }}>
                <RowBetween align="center">
                  <Text fontWeight={800} fontSize={14} color={theme.text1}>
                    Converted / Max:
                  </Text>
                  <Text fontWeight={800} fontSize={14} color={theme.text1}>
                    {convertedAmountText} / {maxAllowedText}
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
                    {swapInputError ? swapInputError : 'Convert'}
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

      {/*<Dialog
        isVisible={true}
        icon={<AlertCircle size={28} />}
        title="Is this a wallet address"
        description="You have reached the conversion limit. ."
        onCancel={() => {}}
        showHelpButton={false}
      /> */}
    </>
  )
}
