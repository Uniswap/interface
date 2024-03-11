import { useCelo, useConnectedSigner } from '@celo/react-celo'
import { JsonRpcSigner } from '@ethersproject/providers'
import { CELO, ChainId as UbeswapChainId, Fraction, Token, TokenAmount } from '@ubeswap/sdk'
import { useDoTransaction } from 'components/swap/routing'
import { useUbeConvertContract } from 'hooks/useContract'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ArrowDown } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { Text } from 'rebass'
import { useHasPendingTransaction } from 'state/transactions/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import styled, { ThemeContext } from 'styled-components'

import { ButtonConfirmed, ButtonError, ButtonLight } from '../../components/Button'
import Card from '../../components/Card'
import Column, { AutoColumn } from '../../components/Column'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { CardNoise, CardSection, DataCard } from '../../components/earn/styled'
import Loader from '../../components/Loader'
import { SwapPoolTabs } from '../../components/NavigationTabs'
import ProgressSteps from '../../components/ProgressSteps'
import { AutoRow, RowBetween } from '../../components/Row'
import { ArrowWrapper, BottomGrouping, SwapCallbackError, Wrapper } from '../../components/swap/styleds'
import SwapHeader from '../../components/swap/SwapHeader'
import TradePrice from '../../components/swap/TradePrice'
import { useToken } from '../../hooks/Tokens'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import { useWalletModalToggle } from '../../state/application/hooks'
import { tryParseAmount, useDerivedSwapInfo } from '../../state/swap/hooks'
import { ExternalLink, TYPE } from '../../theme'
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
  (amountToConvert: TokenAmount, maxOldUbeAmount: string, signature: string) => Promise<void>
] {
  const { address: account } = useCelo()
  const signer = useConnectedSigner() as JsonRpcSigner

  const hasPendingTx = useHasPendingTransaction()
  const [isPending, setIsPending] = useState(false)

  const contractDisconnected = useUbeConvertContract(CONVERT_CONTRACT_ADDRESS)
  const doTransaction = useDoTransaction()

  const approve = useCallback(
    async (amountToConvert: TokenAmount, maxOldUbeAmount: string, signature: string): Promise<void> => {
      if (!account) {
        console.error('no account')
        return
      }
      if (hasPendingTx) {
        console.error('already pending transaction')
        return
      }
      if (isPending) {
        console.error('already pending')
        return
      }

      if (!contractDisconnected) {
        console.error('contract is null')
        return
      }

      if (!amountToConvert) {
        console.error('amountToConvert is null')
        return
      }

      // connect
      const convertContract = contractDisconnected.connect(signer)

      setIsPending(true)
      try {
        await doTransaction(convertContract, 'convert', {
          args: [amountToConvert.raw.toString(), maxOldUbeAmount, signature],
          summary: `Convert to new UBE`,
        })
      } catch (e) {
        console.log(e)
      } finally {
        setIsPending(false)
      }
    },
    [isPending, contractDisconnected, signer, doTransaction, hasPendingTx, account]
  )

  return [isPending, approve]
}

export default function ClaimNewUbeToken() {
  const { t } = useTranslation()

  const { address: account, network } = useCelo()
  const chainId = network.chainId as unknown as UbeswapChainId

  const theme = useContext(ThemeContext)

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()
  const allowedSlippage = 0

  // swap state
  const { v2Trade } = useDerivedSwapInfo()
  const trade = v2Trade

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
    fetch('/data/whitelist.json')
      .then((response) => response.json())
      .then((data) => {
        setWhitelistLoading(false)
        setWhitelist(data)
      })
      .catch((error) => {
        console.log(error)
        setWhitelistLoading(false)
      })
  }, [])

  const parsedAmount = useMemo(() => {
    return tryParseAmount(typedValue, inputCurrency ?? undefined)
  }, [typedValue, inputCurrency])
  const outputAmount = parsedAmount?.multiply(new Fraction('3', '2'))
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
  const handleTypeOutput = useCallback((value: string) => {
    console.log('This should not happen')
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
        console.log(error)
      })
  }, [approveCallback])

  const maxAmountInput: TokenAmount | undefined = maxAmountSpend(inputBalance)
  const atMaxAmountInput = Boolean(maxAmountInput && parsedAmount?.equalTo(maxAmountInput))
  const atHalfAmountInput = Boolean(
    maxAmountInput && Number(maxAmountInput.toExact()) * 0.5 === Number(parsedAmount?.toExact())
  )

  const swapCallbackError = ''
  const swapErrorMessage = ''

  const handleSwap = useCallback(() => {
    if (!convertCallback || !whitelist || !parsedAmount) {
      return
    }
    const data = whitelist[account?.toLocaleLowerCase() || '']
    if (!data) {
      return
    }
    convertCallback(parsedAmount, data.amount, data.signature)
      .then(() => {
        //
      })
      .catch((error) => {
        console.log(error)
      })
  }, [convertCallback])

  // errors
  const [showInverted, setShowInverted] = useState<boolean>(false)

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  // never show if price impact is above threshold in non expert mode
  const showApproveFlow =
    !swapInputError &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      (approvalSubmitted && approval === ApprovalState.APPROVED))

  const handleMaxInput = useCallback(() => {
    if (maxAmountInput) {
      if (currencies?.INPUT?.address === CELO[chainId].address) {
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
      <SwapPoolTabs active={'swap'} />
      <VoteCard>
        <CardNoise />
        <CardSection>
          <AutoColumn gap="md">
            <RowBetween>
              <TYPE.white fontWeight={600}>New Tokenomics</TYPE.white>
            </RowBetween>
            <RowBetween>
              <TYPE.white fontSize={14}>Ubeswap has migrated to new token economics.</TYPE.white>
            </RowBetween>
            <ExternalLink
              style={{ color: 'white', textDecoration: 'underline' }}
              target="_blank"
              href="https://docs.ubeswap.org/tutorial/providing-liquidity"
            >
              <TYPE.white fontSize={14}>Click to read more on the new tokenomics</TYPE.white>
            </ExternalLink>
            <RowBetween>
              <TYPE.white fontSize={14}>
                All token swaps made until April 15th 2024 will be made on a 1:1,5 basis. After this period, it will
                switch to 1:1. After 75% of the total tokens are swapped, 1 month will be provided for the remainder of
                the community to swap. Any tokens not swapped after this period will be burned.
              </TYPE.white>
            </RowBetween>
          </AutoColumn>
        </CardSection>
        <CardNoise />
      </VoteCard>
      <AppBody>
        <SwapHeader title={'Convert to new UBE'} hideSettings={true} />
        <Wrapper id="swap-page">
          <AutoColumn gap={'md'}>
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
              <AutoRow justify={'center'} style={{ padding: '0 1rem' }}>
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

            <Card padding={'0px'} borderRadius={'20px'}>
              <AutoColumn gap="8px" style={{ padding: '0 16px' }}>
                {Boolean(trade) && (
                  <RowBetween align="center">
                    <Text fontWeight={500} fontSize={14} color={theme.text2}>
                      Price
                    </Text>
                    <TradePrice
                      price={trade?.executionPrice}
                      showInverted={showInverted}
                      setShowInverted={setShowInverted}
                    />
                  </RowBetween>
                )}
              </AutoColumn>
            </Card>
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
