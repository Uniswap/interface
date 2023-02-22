//import type { TransactionResponse } from '@ethersproject/providers'
import { Trans } from '@lingui/macro'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useCallback, useState } from 'react'
import styled from 'styled-components/macro'

import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
//import useTransactionDeadline from '../../hooks/useTransactionDeadline'
import { BuyInfo, useDerivedBuyInfo } from '../../state/buy/hooks'
import { usePoolExtendedContract } from '../../state/pool/hooks'
//import { useTransactionAdder } from '../../state/transactions/hooks'
//import { TransactionType } from '../../state/transactions/types'
import { CloseIcon, ThemedText } from '../../theme'
import { calculateGasMargin } from '../../utils/calculateGasMargin'
import { formatCurrencyAmount } from '../../utils/formatCurrencyAmount'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { ButtonConfirmed, ButtonError } from '../Button'
import { AutoColumn } from '../Column'
import CurrencyInputPanel from '../CurrencyInputPanel'
import Modal from '../Modal'
import { LoadingView, SubmittedView } from '../ModalViews'
import ProgressCircles from '../ProgressSteps'
import { RowBetween } from '../Row'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 1rem;
`

interface BuyModalProps {
  isOpen: boolean
  onDismiss: () => void
  buyInfo?: BuyInfo
  userBaseTokenBalance?: CurrencyAmount<Token> | undefined
}

export default function BuyModal({ isOpen, onDismiss, buyInfo, userBaseTokenBalance }: BuyModalProps) {
  const { provider } = useWeb3React()

  // track and parse user input
  const [typedValue, setTypedValue] = useState('')

  // state for pending and submitted txn views
  //const addTransaction = useTransactionAdder()
  const [attempting, setAttempting] = useState<boolean>(false)
  const [hash, setHash] = useState<string | undefined>()
  const wrappedOnDismiss = useCallback(() => {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }, [onDismiss])

  const { parsedAmount, error } = useDerivedBuyInfo(typedValue, userBaseTokenBalance?.currency, userBaseTokenBalance)

  // approval data for stake
  //const deadline = useTransactionDeadline()
  const [approval, approveCallback] = useApproveCallback(parsedAmount, buyInfo?.poolAddress)

  const poolContract = usePoolExtendedContract(buyInfo?.poolAddress ?? undefined)
  // TODO: must handle ETH purchases
  async function onBuy() {
    setAttempting(true)
    if (poolContract && parsedAmount && buyInfo /*&& deadline*/) {
      if (approval === ApprovalState.APPROVED) {
        // TODO: add value if token is ether
        const args = [buyInfo.recipient, parsedAmount.quotient.toString(), 0]

        // mint method not unique in interface
        return poolContract.estimateGas['mint(address,uint256,uint256)'](...args, {}).then((estimatedGasLimit) => {
          return poolContract['mint(address,uint256,uint256)'](...args, {
            value: null,
            gasLimit: calculateGasMargin(estimatedGasLimit),
          })
        })
      } else {
        setAttempting(false)
        throw new Error('Attempting to stake without approval. Please contact support.')
      }
    }
  }

  // wrapped onUserInput to clear signatures
  const onUserInput = useCallback((typedValue: string) => {
    setTypedValue(typedValue)
  }, [])

  // used for max input button
  //const maxAmountInput = maxAmountSpend(userLiquidityUnstaked)
  const maxAmountInput = maxAmountSpend(userBaseTokenBalance)
  const atMaxAmount = Boolean(maxAmountInput && parsedAmount?.equalTo(maxAmountInput))
  const handleMax = useCallback(() => {
    maxAmountInput && onUserInput(maxAmountInput.toExact())
  }, [maxAmountInput, onUserInput])

  async function onAttemptToApprove() {
    if (!poolContract || !provider /*|| !deadline*/) throw new Error('missing dependencies')
    if (!parsedAmount) throw new Error('missing liquidity amount')

    await approveCallback()
  }

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOnDismiss} maxHeight={90}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <RowBetween>
            <ThemedText.DeprecatedMediumHeader>
              <Trans>Buy</Trans>
            </ThemedText.DeprecatedMediumHeader>
            <CloseIcon onClick={wrappedOnDismiss} />
          </RowBetween>
          {/* TODO: check handling of user with null base token balance */}
          {userBaseTokenBalance && (
            <CurrencyInputPanel
              value={typedValue}
              onUserInput={onUserInput}
              onMax={handleMax}
              showMaxButton={!atMaxAmount}
              currency={userBaseTokenBalance.currency}
              label=""
              renderBalance={(amount) => <Trans>Available to deposit: {formatCurrencyAmount(amount, 4)}</Trans>}
              id="stake-liquidity-token"
            />
          )}

          <RowBetween>
            <ButtonConfirmed
              mr="0.5rem"
              onClick={onAttemptToApprove}
              confirmed={approval === ApprovalState.APPROVED}
              disabled={approval !== ApprovalState.NOT_APPROVED}
            >
              <Trans>Approve</Trans>
            </ButtonConfirmed>
            <ButtonError
              disabled={!!error || approval !== ApprovalState.APPROVED}
              error={!!error && !!parsedAmount}
              onClick={onBuy}
            >
              {error ?? <Trans>Buy</Trans>}
            </ButtonError>
          </RowBetween>
          <ProgressCircles steps={[approval === ApprovalState.APPROVED]} disabled={true} />
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOnDismiss}>
          <AutoColumn gap="12px" justify="center">
            <ThemedText.DeprecatedLargeHeader>
              <Trans>Depositing</Trans>
            </ThemedText.DeprecatedLargeHeader>
            <ThemedText.DeprecatedBody fontSize={20}>
              <Trans>{parsedAmount?.toSignificant(4)} Base Token</Trans>
            </ThemedText.DeprecatedBody>
          </AutoColumn>
        </LoadingView>
      )}
      {attempting && hash && (
        <SubmittedView onDismiss={wrappedOnDismiss} hash={hash}>
          <AutoColumn gap="12px" justify="center">
            <ThemedText.DeprecatedLargeHeader>
              <Trans>Transaction Submitted</Trans>
            </ThemedText.DeprecatedLargeHeader>
            <ThemedText.DeprecatedBody fontSize={20}>
              <Trans>Deposited {parsedAmount?.toSignificant(4)} Base Token</Trans>
            </ThemedText.DeprecatedBody>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
