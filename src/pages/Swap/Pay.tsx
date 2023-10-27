import { BigNumber } from '@ethersproject/bignumber'
import { t, Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Percent } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import sendIcon from 'assets/svg/send_icon.svg'
import { ButtonError } from 'components/Button'
import SwapCurrencyInputPanel from 'components/CurrencyInputPanel/SwapCurrencyInputPanel'
import { SearchInput } from 'components/SearchModal/styled'
import ConfirmSendModal from 'components/swap/ConfirmSendModal'
import { ArrowWrapper, SwapWrapper } from 'components/swap/styled'
import SwapHeader, { SwapTab } from 'components/swap/SwapHeader'
import { PYUSD } from 'constants/tokens'
import { useTokenContract } from 'hooks/useContract'
import useENSAddress from 'hooks/useENSAddress'
import { Allowance, AllowanceState } from 'hooks/usePermit2Allowance'
import { useSwapCallback } from 'hooks/useSwapCallback'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useCallback, useMemo, useState } from 'react'
import { ArrowDown } from 'react-feather'
import { Text } from 'rebass'
import { useAppDispatch } from 'state/hooks'
import { InterfaceTrade } from 'state/routing/types'
import { Field } from 'state/swap/actions'
import { addTransaction } from 'state/transactions/reducer'
import { TransactionType } from 'state/transactions/types'
import styled, { useTheme } from 'styled-components'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { isAddress } from 'utils/addresses'

import { ArrowContainer } from '.'
import { SwapSection } from './SwapSection'

const RecipientSection = styled(SwapSection)`
  border-bottom: ${({ theme }) => `1px solid ${theme.surface1}`};
  display: flex;
  align-items: center;
  justify-content: center;
`

export const RecipientInput = styled(SearchInput)`
  background-image: url(${sendIcon});
  outline: none;
  border: none;
  :focus {
    border: none;
  }
`

interface PayProps {
  swapTab: SwapTab
  className?: string
  trade?: InterfaceTrade
  autoSlippage: Percent
  activeTab?: SwapTab
  onSelectTab?: (tab: SwapTab) => void
  handleTypeInput: (input: string) => void
  handleMaxInput: () => void
  swapFiatValues: {
    amountIn?: number
    amountOut?: number
    feeUsd?: number
  }
  fiatValueInput: {
    data?: number
    isLoading: boolean
  }
  handleInputSelect: (currency: Currency) => void
  handleOutputSelect: (currency: Currency) => void
  currencies: { [field in Field]?: Currency }
  formattedAmounts: {
    [x: string]: string
  }
  allowance?: Allowance
  typedValue: string
}

export type ResolvedRecipient = {
  recipient: string
  originalRecipient: string
  type: 'eth' | 'venmo'
}

export function Pay({
  swapTab,
  className,
  trade,
  autoSlippage,
  activeTab,
  onSelectTab,
  handleInputSelect,
  handleOutputSelect,
  handleMaxInput,
  handleTypeInput,
  swapFiatValues,
  fiatValueInput,
  currencies,
  formattedAmounts,
  allowance,
  typedValue,
}: PayProps) {
  const isDark = useIsDarkMode()
  const { chainId, provider, account } = useWeb3React()
  const theme = useTheme()
  const dispatch = useAppDispatch()

  // todo: calculate a trade from the input token to PYUSD if necessary
  // useEffect(() => {
  //   if (swapTab === SwapTab.PAY) {
  //     handleOutputSelect(PYUSD)
  //   }
  // }, [handleOutputSelect, swapTab])

  const [showConfirm, setShowConfirm] = useState(false)
  const [recipient, setRecipient] = useState<string>('')
  const [sendTxHash, setSendTxHash] = useState<string | undefined>(undefined)
  const { loading, address: ensResolution } = useENSAddress(recipient)

  const resolvedRecipient: ResolvedRecipient | undefined = useMemo(() => {
    const address = isAddress(recipient)
    if (address) {
      return { recipient: address, originalRecipient: recipient, type: 'eth' }
    } else if (!loading && ensResolution) {
      return { recipient: ensResolution, type: 'eth', originalRecipient: recipient }
    } else if (recipient.startsWith('@') && recipient.length > 1) {
      // hard-coded recipient for @Edward-Dugan on venmo
      return { recipient: '0xe38731ceaCAB9d4cBb97f0A0448ACe3a201DF9dA', type: 'venmo', originalRecipient: recipient }
    }
    return undefined
  }, [ensResolution, loading, recipient])

  const parsedAmount: CurrencyAmount<Currency> | undefined = useMemo(() => {
    const inputToken = currencies[Field.INPUT]
    return tryParseCurrencyAmount(typedValue, inputToken ?? undefined)
  }, [currencies, typedValue])

  const sendTokenAddress =
    resolvedRecipient?.type === 'venmo'
      ? PYUSD.address
      : currencies[Field.INPUT]?.isToken
      ? currencies[Field.INPUT]?.address
      : 'native_eth'
  const contract = useTokenContract(sendTokenAddress, true /* withSignerIfPossible */)

  // only used for swapping to pyusd
  const swapCallback = useSwapCallback(
    trade,
    swapFiatValues,
    autoSlippage,
    allowance?.state === AllowanceState.ALLOWED ? allowance.permitSignature : undefined
  )

  const handleSend = useCallback(async () => {
    if (!contract && parsedAmount) {
      // send ETH
      const value = BigNumber.from(parsedAmount.quotient.toString())
      const tx = await provider?.getSigner().sendTransaction({
        to: resolvedRecipient?.recipient,
        value: BigNumber.from(value),
      })
      if (tx && account && chainId) {
        setSendTxHash(tx.hash)
        dispatch(
          addTransaction({
            hash: tx.hash,
            from: account,
            info: { type: TransactionType.SEND, recipient, currencyAmountRaw: value.toString() },
            chainId,
            nonce: tx.nonce,
          })
        )
      }
    } else if (contract && resolvedRecipient?.recipient && parsedAmount) {
      // send token
      const value = BigNumber.from(parsedAmount.quotient.toString())
      const tx = await contract.transfer(resolvedRecipient?.recipient, value)
      if (tx && account && chainId) {
        setSendTxHash(tx?.hash)
        dispatch(
          addTransaction({
            hash: tx.hash,
            from: account,
            info: { type: TransactionType.SEND, recipient, currencyAmountRaw: value.toString() },
            chainId,
            nonce: tx.nonce,
          })
        )
      }
    } else {
      console.error('failed to send')
    }
  }, [account, chainId, contract, dispatch, parsedAmount, provider, recipient, resolvedRecipient?.recipient])

  return (
    <SwapWrapper isDark={isDark} className={className} id="swap-page">
      <SwapHeader
        trade={trade}
        autoSlippage={autoSlippage}
        chainId={chainId}
        activeTab={activeTab}
        onSelectTab={onSelectTab}
      />
      <div style={{ display: 'relative' }}>
        <SwapSection>
          <SwapCurrencyInputPanel
            id="pay-input"
            label="You send"
            disabled={false}
            value={formattedAmounts[Field.INPUT]}
            showMaxButton={true}
            currency={currencies[Field.INPUT] ?? null}
            onUserInput={handleTypeInput}
            onMax={handleMaxInput}
            fiatValue={fiatValueInput}
            onCurrencySelect={handleInputSelect}
            otherCurrency={undefined}
            showCommonBases
            loading={false}
          />
        </SwapSection>
        <ArrowWrapper clickable={false}>
          <ArrowContainer color={theme.neutral1}>
            <ArrowDown size="16" color={theme.neutral1} />
          </ArrowContainer>
        </ArrowWrapper>
      </div>
      <div style={{ marginBottom: '8px' }}>
        <RecipientSection>
          <RecipientInput
            type="text"
            id="reciptient-search-input"
            placeholder={t`Enter recipient address`}
            autoComplete="off"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
        </RecipientSection>
      </div>
      <ButtonError
        onClick={() => {
          setShowConfirm(true)
        }}
        disabled={!resolvedRecipient || !parsedAmount}
      >
        <Text fontSize={20}>
          <Trans>Send payment</Trans>
        </Text>
      </ButtonError>
      {resolvedRecipient && parsedAmount && allowance && showConfirm && (
        <ConfirmSendModal
          recipient={resolvedRecipient}
          inputAmount={parsedAmount}
          onConfirm={handleSend}
          allowance={allowance}
          onDismiss={() => {
            setSendTxHash(undefined)
            setShowConfirm(false)
          }}
          fiatValueInput={fiatValueInput}
          onSwapToPYUSD={swapCallback}
          sendTxHash={sendTxHash}
        />
      )}
    </SwapWrapper>
  )
}
