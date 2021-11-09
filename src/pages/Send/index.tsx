import { useContractKit, useProvider } from '@celo-tools/use-contractkit'
import { TokenAmount } from '@ubeswap/sdk'
import SendHeader from 'components/send/SendHeader'
import { useDoTransaction } from 'components/swap/routing'
import { ERC20_ABI } from 'constants/abis/erc20'
import { Erc20 } from 'generated/Erc20'
import useENS from 'hooks/useENS'
import React, { useCallback } from 'react'
import { Text } from 'rebass'
import { getContract } from 'utils'

import AddressInputPanel from '../../components/AddressInputPanel'
import { ButtonLight, ButtonPrimary } from '../../components/Button'
import { AutoColumn } from '../../components/Column'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { SwapPoolTabs } from '../../components/NavigationTabs'
import { BottomGrouping, Wrapper } from '../../components/swap/styleds'
import { useWalletModalToggle } from '../../state/application/hooks'
import { Field } from '../../state/swap/actions'
import { useDerivedSwapInfo, useSwapActionHandlers, useSwapState } from '../../state/swap/hooks'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import AppBody from '../AppBody'

export default function Send() {
  // dismiss warning if all imported tokens are in active lists
  const { address: account } = useContractKit()
  const library = useProvider()

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  // swap state
  const { typedValue, recipient } = useSwapState()
  const { address: recipientAddress } = useENS(recipient)
  const { currencyBalances, parsedAmount, currencies } = useDerivedSwapInfo()

  const maxAmountInput: TokenAmount | undefined = maxAmountSpend(currencyBalances[Field.INPUT])

  const notEnoughFunds = parsedAmount && maxAmountInput && parsedAmount.greaterThan(maxAmountInput)

  const isValid = recipientAddress && parsedAmount && account && !notEnoughFunds
  const doTransaction = useDoTransaction()
  const handleSend = useCallback(async () => {
    if (!isValid || !parsedAmount || !library || !account || !recipientAddress) {
      return
    }
    const token = getContract(parsedAmount.token.address, ERC20_ABI, library, account) as Erc20
    await doTransaction(token, 'transfer', {
      args: [recipientAddress, parsedAmount.raw.toString()],
      summary: `Send ${parsedAmount.toSignificant(3)} ${parsedAmount.currency.symbol} to ${recipient}`,
    })
  }, [isValid, parsedAmount, library, account, recipientAddress, doTransaction, recipient])

  const { onCurrencySelection, onUserInput, onChangeRecipient } = useSwapActionHandlers()

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput]
  )

  const atMaxAmountInput = Boolean(maxAmountInput && parsedAmount?.equalTo(maxAmountInput))

  const handleInputSelect = useCallback(
    (inputCurrency) => {
      onCurrencySelection(Field.INPUT, inputCurrency)
    },
    [onCurrencySelection]
  )

  const handleMaxInput = useCallback(() => {
    maxAmountInput && onUserInput(Field.INPUT, maxAmountInput.toExact())
  }, [maxAmountInput, onUserInput])

  return (
    <>
      <SwapPoolTabs active={'swap'} />
      <AppBody>
        <SendHeader />
        <Wrapper id="send-page">
          <AutoColumn gap={'md'}>
            <CurrencyInputPanel
              label="Amount"
              value={typedValue}
              showMaxButton={!atMaxAmountInput}
              currency={currencies[Field.INPUT]}
              onUserInput={handleTypeInput}
              onMax={handleMaxInput}
              onCurrencySelect={handleInputSelect}
              id="send-currency-input"
            />
            <AddressInputPanel id="recipient" value={recipient ?? ''} onChange={onChangeRecipient} />
          </AutoColumn>
          <BottomGrouping>
            {!account ? (
              <ButtonLight onClick={toggleWalletModal}>Connect Wallet</ButtonLight>
            ) : (
              <ButtonPrimary
                onClick={() => {
                  handleSend()
                }}
                id="send-button"
                disabled={!isValid}
              >
                <Text fontSize={20} fontWeight={500}>
                  {notEnoughFunds ? 'Not enough funds' : 'Send'}
                </Text>
              </ButtonPrimary>
            )}
          </BottomGrouping>
        </Wrapper>
      </AppBody>
    </>
  )
}
