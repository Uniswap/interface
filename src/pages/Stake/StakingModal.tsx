import { TransactionResponse } from '@ethersproject/providers'
import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Fraction, Percent } from '@uniswap/sdk-core'
import { toHex } from '@uniswap/v3-sdk'
import CurrencyLogo from 'components/CurrencyLogo'
import { useV3Positions } from 'hooks/useV3Positions'
import { useCallback, useState } from 'react'
import ReactGA from 'react-ga'
import { RouteComponentProps, useLocation } from 'react-router-dom'
import { Text } from 'rebass'
import { useV3DerivedMintInfo, useV3MintActionHandlers, useV3MintState } from 'state/mint/v3/hooks'
import { useSingleCallResult } from 'state/multicall/hooks'
import { CommonQuantity } from 'types/main'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import Web3 from 'web3-utils'

import { ButtonError, ButtonLight, ButtonPrimary } from '../../components/Button'
import { LightCard } from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { AddRemoveTabs } from '../../components/NavigationTabs'
import { RowBetween, RowFixed } from '../../components/Row'
import { SwitchLocaleLink } from '../../components/SwitchLocaleLink'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import { STAKING_ADDRESS } from '../../constants/addresses'
import { useCurrency } from '../../hooks/Tokens'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import { useArgentWalletContract } from '../../hooks/useArgentWalletContract'
import { useNewStakingContract } from '../../hooks/useContract'
import { useUSDCValue } from '../../hooks/useUSDCPrice'
import { useActiveWeb3React } from '../../hooks/web3'
import { useWalletModalToggle } from '../../state/application/hooks'
import { Field } from '../../state/mint/v3/actions'
import { TransactionType } from '../../state/transactions/actions'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { useIsExpertMode } from '../../state/user/hooks'
import { TYPE } from '../../theme'
import { calculateGasMargin } from '../../utils/calculateGasMargin'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { DynamicSection, PageWrapper, ScrollablePage, Wrapper } from '../AddLiquidity/styled'
import { Dots } from '../Pool/styleds'

const DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE = new Percent(50, 10_000)
export default function StakingModal({
  match: {
    params: { tokenId: tokenIdFromUrl },
  },
  history,
}: RouteComponentProps<{ tokenId?: string }>) {
  const { account, chainId, library } = useActiveWeb3React()
  const location = useLocation()
  const currencyIdA = tokenIdFromUrl

  const toggleWalletModal = useWalletModalToggle() // toggle wallet when disconnected
  const expertMode = useIsExpertMode()
  const addTransaction = useTransactionAdder()
  const stake = useNewStakingContract()

  const baseCurrency = useCurrency(currencyIdA)
  const withdraw = location.pathname.includes('/unstake')
  const { fundingBalance } = useV3Positions(account)

  const result = useSingleCallResult(stake, 'getDepositedAmount', [account?.toString()])
  let stakedBalance = result.result ? Web3.fromWei(result.result.toString()) : ''
  stakedBalance = Number(stakedBalance).toFixed(2)

  const { parsedAmounts, currencyBalances, errorMessage, currencies, depositADisabled } = useV3DerivedMintInfo(
    baseCurrency ?? undefined,
    baseCurrency ?? undefined,
    withdraw ? fundingBalance : undefined,
    withdraw,
    stakedBalance
  )

  const { independentField, typedValue } = useV3MintState()

  const { onFieldAInput } = useV3MintActionHandlers(true)
  const isValid = !errorMessage

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  const [txHash, setTxHash] = useState<string>('')

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
  }

  const usdcValues = {
    [Field.CURRENCY_A]: useUSDCValue(parsedAmounts[Field.CURRENCY_A]),
  }

  // get the max amounts user can add
  const maxAmounts: { [field in Field]?: CurrencyAmount<Currency> } = [Field.CURRENCY_A].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmountSpend(currencyBalances[field]),
      }
    },
    {}
  )

  const atMaxAmounts: { [field in Field]?: CurrencyAmount<Currency> } = [Field.CURRENCY_A].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmounts[field]?.equalTo(parsedAmounts[field] ?? '0'),
      }
    },
    {}
  )

  const argentWalletContract = useArgentWalletContract()

  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallback(
    argentWalletContract ? undefined : parsedAmounts[Field.CURRENCY_A],
    chainId ? STAKING_ADDRESS[chainId] : undefined
  )

  async function onAdd() {
    if (!chainId || !library || !account) return

    if (!stake || !baseCurrency) {
      return
    }

    // this should be redefined
    const amount0 = parsedAmounts?.[Field.CURRENCY_A]?.quotient
    const calldatas: string[] = []

    // todo - review the unstake call
    if (account && amount0 && stake) {
      withdraw
        ? calldatas.push(stake.interface.encodeFunctionData('unstake', [account, toHex(amount0), false, false]))
        : calldatas.push(
            stake ? stake.interface.encodeFunctionData('stake', [account, toHex(amount0), false, false]) : ''
          )

      const calldata = calldatas.length === 1 ? calldatas[0] : ''

      const txn: { to: string; data: string; value: string } = {
        to: STAKING_ADDRESS[chainId],
        data: calldata,
        value: '0x0',
      }

      setAttemptingTxn(true)

      library
        .getSigner()
        .estimateGas(txn)
        .then((estimate) => {
          const newTxn = {
            ...txn,
            gasLimit: calculateGasMargin(chainId, estimate),
          }
          return library
            .getSigner()
            .sendTransaction(newTxn)
            .then((response: TransactionResponse) => {
              setAttemptingTxn(false)
              addTransaction(response, {
                type: withdraw ? TransactionType.UNSTAKE : TransactionType.STAKE,
                account,
                amount: amount0.toString(),
              })
              setTxHash(response.hash)
              ReactGA.event({
                category: 'Liquidity',
                action: withdraw ? 'Remove' : 'Add',
                label: [currencies[Field.CURRENCY_A]?.symbol].join('/'),
              })
            })
        })
        .catch((error) => {
          console.error('Failed to send transaction', error)
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx
          if (error?.code !== 4001) {
            console.error(error)
          }
        })
    } else {
      return
    }
  }

  function modalHeader() {
    return (
      <AutoColumn gap={'md'} style={{ marginTop: '20px' }}>
        <LightCard padding="12px 16px">
          <AutoColumn gap="md">
            <RowBetween>
              <RowFixed>
                <CurrencyLogo
                  currency={parsedAmounts[Field.CURRENCY_A]?.currency}
                  size={'20px'}
                  style={{ marginRight: '0.5rem' }}
                />
                <TYPE.main>{formatCurrencyAmount(parsedAmounts[Field.CURRENCY_A], 4)}</TYPE.main>
              </RowFixed>
              <TYPE.main>{parsedAmounts[Field.CURRENCY_A]?.currency?.symbol}</TYPE.main>
            </RowBetween>
          </AutoColumn>
        </LightCard>
        <TYPE.italic>
          {withdraw ? (
            <Trans>Unstaking KROM may prevent the system to calculate rewards</Trans>
          ) : (
            <Trans>Staking KROM will allow the system to automatically process trades</Trans>
          )}
        </TYPE.italic>
        <ButtonPrimary onClick={onAdd}>
          <Trans>{withdraw ? 'Unstake' : 'Stake'}</Trans>
        </ButtonPrimary>
      </AutoColumn>
    )
  }

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    if (txHash) {
      onFieldAInput('')
      history.push('/stake')
    }
    setTxHash('')
  }, [history, onFieldAInput, txHash])

  // we need an existence check on parsed amounts for single-asset deposits
  const showApprovalA =
    !argentWalletContract && approvalA !== ApprovalState.APPROVED && !!parsedAmounts[Field.CURRENCY_A]

  const pendingText = withdraw
    ? `Unstake ${!depositADisabled ? parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) : ''} ${
        !depositADisabled ? currencies[Field.CURRENCY_A]?.symbol : ''
      }`
    : `Stake ${!depositADisabled ? parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) : ''} ${
        !depositADisabled ? currencies[Field.CURRENCY_A]?.symbol : ''
      }`

  const Buttons = () =>
    !account ? (
      <ButtonLight onClick={toggleWalletModal} $borderRadius="20px" padding={'12px'}>
        <Trans>Connect Wallet</Trans>
      </ButtonLight>
    ) : (
      <AutoColumn gap={'md'}>
        {(approvalA === ApprovalState.NOT_APPROVED || approvalA === ApprovalState.PENDING) && isValid && (
          <RowBetween>
            {showApprovalA && (
              <ButtonPrimary onClick={approveACallback} disabled={approvalA === ApprovalState.PENDING} width={'100%'}>
                {approvalA === ApprovalState.PENDING ? (
                  <Dots>
                    <Trans>Approving {currencies[Field.CURRENCY_A]?.symbol}</Trans>
                  </Dots>
                ) : (
                  <Trans>Approve {currencies[Field.CURRENCY_A]?.symbol}</Trans>
                )}
              </ButtonPrimary>
            )}
          </RowBetween>
        )}
        <ButtonError
          style={{ marginTop: '8px' }}
          onClick={() => {
            expertMode ? onAdd() : setShowConfirm(true)
          }}
          disabled={!isValid || (!argentWalletContract && approvalA !== ApprovalState.APPROVED && !depositADisabled)}
          error={!isValid && !!parsedAmounts[Field.CURRENCY_A]}
        >
          <Text fontWeight={400}>{errorMessage ? errorMessage : <Trans>Preview</Trans>}</Text>
        </ButtonError>
      </AutoColumn>
    )

  const handleCommonQuantityInput = useCallback(
    (commonQuantity: CommonQuantity) => {
      const maxAmountOrNothing: CurrencyAmount<Currency> | null = stakedBalance
        ? null
        : maxAmounts[Field.CURRENCY_A] ?? null

      if (maxAmountOrNothing === null) {
        onFieldAInput('')
      } else {
        if (commonQuantity === '100%') {
          onFieldAInput(maxAmountOrNothing.toExact())
        } else if (commonQuantity === '25%') {
          onFieldAInput(maxAmountOrNothing.divide(new Fraction(4, 1)).toExact())
        } else if (commonQuantity === '50%') {
          onFieldAInput(maxAmountOrNothing.divide(new Fraction(4, 2)).toExact())
        } else if (commonQuantity === '75%') {
          onFieldAInput(maxAmountOrNothing.divide(new Fraction(4, 3)).toExact())
        }
      }
    },
    [onFieldAInput, stakedBalance, maxAmounts]
  )

  return (
    <>
      <ScrollablePage>
        <TransactionConfirmationModal
          isOpen={showConfirm}
          onDismiss={handleDismissConfirmation}
          attemptingTxn={attemptingTxn}
          hash={txHash}
          content={() => (
            <ConfirmationModalContent
              title={withdraw ? <Trans>Unstake</Trans> : <Trans>Stake</Trans>}
              onDismiss={() => setShowConfirm(false)}
              topContent={modalHeader}
            />
          )}
          pendingText={pendingText}
        />
        <PageWrapper wide={true}>
          <AddRemoveTabs
            creating={false}
            adding={true}
            defaultSlippage={DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE}
            showBackLink={true}
          ></AddRemoveTabs>
          <Wrapper>
            <AutoColumn gap="lg"></AutoColumn>
            <div>
              <DynamicSection disabled={false}>
                <AutoColumn gap="md">
                  <TYPE.label>
                    <Trans>Amount</Trans>
                  </TYPE.label>

                  <CurrencyInputPanel
                    value={formattedAmounts[Field.CURRENCY_A]}
                    onUserInput={onFieldAInput}
                    onCommonQuantity={handleCommonQuantityInput}
                    showCommonQuantityButtons={!(withdraw ? stakedBalance : atMaxAmounts[Field.CURRENCY_A])}
                    currency={currencies[Field.CURRENCY_A] ?? null}
                    id="add-liquidity-input-tokena"
                    fiatValue={usdcValues[Field.CURRENCY_A]}
                    showCommonBases
                    locked={depositADisabled}
                    renderBalance={(amount) => (
                      <Trans>
                        Wallet: {formatCurrencyAmount(amount, 4)}, Staked: {stakedBalance}
                      </Trans>
                    )}
                  />
                </AutoColumn>
              </DynamicSection>
            </div>

            <Buttons />
          </Wrapper>
        </PageWrapper>
      </ScrollablePage>
      <SwitchLocaleLink />
    </>
  )
}
