import { TransactionResponse } from '@ethersproject/providers'
import { Currency, TokenAmount, Percent, ETHER } from '@uniswap/sdk-core'
import React, { useCallback, useContext, useState } from 'react'
import { Link2, AlertTriangle } from 'react-feather'
import ReactGA from 'react-ga'
import { useV3NFTPositionManagerContract } from '../../hooks/useContract'
import { RouteComponentProps } from 'react-router-dom'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { ButtonError, ButtonLight, ButtonPrimary, ButtonRadioChecked, ButtonText } from '../../components/Button'
import { YellowCard, OutlineCard, BlueCard } from '../../components/Card'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import { TransactionSubmittedContent, ConfirmationPendingContent } from '../../components/TransactionConfirmationModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { AutoRow, RowBetween } from '../../components/Row'
import Review from './Review'
import { useActiveWeb3React } from '../../hooks'
import { useCurrency } from '../../hooks/Tokens'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import useTransactionDeadline from '../../hooks/useTransactionDeadline'
import { useWalletModalToggle } from '../../state/application/hooks'
import { Field, Bound } from '../../state/mint/actions'

import { useTransactionAdder } from '../../state/transactions/hooks'
import { useIsExpertMode, useUserSlippageTolerance } from '../../state/user/hooks'
import { TYPE } from '../../theme'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { wrappedCurrency } from '../../utils/wrappedCurrency'
import AppBody from '../AppBody'
import { Dots, Wrapper } from '../Pool/styleds'
import { currencyId } from '../../utils/currencyId'
import { useIsTransactionUnsupported } from 'hooks/Trades'
import UnsupportedCurrencyFooter from 'components/swap/UnsupportedCurrencyFooter'
import { ToggleWrapper, ToggleElement } from 'components/Toggle/MultiToggle'
import StepCounter from 'components/InputStepCounter/InputStepCounter'
import {
  DynamicSection,
  CurrencyDropdown,
  ScrollableContent,
  StyledInput,
  FixedPreview,
  ScrollablePage,
} from './styled'
import { useTranslation } from 'react-i18next'
import { useMintState, useMintActionHandlers, useDerivedMintInfo } from 'state/mint/hooks'
import { FeeAmount, NonfungiblePositionManager } from '@uniswap/v3-sdk'
import { NONFUNGIBLE_POSITION_MANAGER_ADDRESSES } from 'constants/v3'
import JSBI from 'jsbi'

export function FeeSelector({
  disabled = false,
  feeAmount,
  handleFeePoolSelect,
}: {
  disabled?: boolean
  feeAmount?: FeeAmount
  handleFeePoolSelect: (feeAmount: FeeAmount) => void
}) {
  const { t } = useTranslation()

  return (
    <AutoColumn gap="16px">
      <DynamicSection gap="md" disabled={disabled}>
        <TYPE.label>{t('selectPool')}</TYPE.label>
        <RowBetween>
          <ButtonRadioChecked
            width="32%"
            active={feeAmount === FeeAmount.LOW}
            onClick={() => handleFeePoolSelect(FeeAmount.LOW)}
          >
            <AutoColumn gap="sm" justify="flex-start">
              <TYPE.label>0.05% {t('fee')}</TYPE.label>
              <TYPE.main fontWeight={400} fontSize="12px" textAlign="left">
                Optimized for stable assets.
              </TYPE.main>
            </AutoColumn>
          </ButtonRadioChecked>
          <ButtonRadioChecked
            width="32%"
            active={feeAmount === FeeAmount.MEDIUM}
            onClick={() => handleFeePoolSelect(FeeAmount.MEDIUM)}
          >
            <AutoColumn gap="sm" justify="flex-start">
              <TYPE.label>0.3% {t('fee')}</TYPE.label>
              <TYPE.main fontWeight={400} fontSize="12px" textAlign="left">
                The classic Uniswap pool fee.
              </TYPE.main>
            </AutoColumn>
          </ButtonRadioChecked>
          <ButtonRadioChecked
            width="32%"
            active={feeAmount === FeeAmount.HIGH}
            onClick={() => handleFeePoolSelect(FeeAmount.HIGH)}
          >
            <AutoColumn gap="sm" justify="flex-start">
              <TYPE.label>1% {t('fee')}</TYPE.label>
              <TYPE.main fontWeight={400} fontSize="12px" textAlign="left">
                Best for volatile assets.
              </TYPE.main>
            </AutoColumn>
          </ButtonRadioChecked>
        </RowBetween>
      </DynamicSection>
    </AutoColumn>
  )
}

// the order of displayed base currencies from left to right is always in sort order
// currencyA is treated as the preferred base currency
export function RateToggle({
  currencyA,
  currencyB,
  handleRateToggle,
}: {
  currencyA: Currency
  currencyB: Currency
  handleRateToggle: () => void
}) {
  const { t } = useTranslation()
  const { chainId } = useActiveWeb3React()

  const tokenA = wrappedCurrency(currencyA, chainId)
  const tokenB = wrappedCurrency(currencyB, chainId)

  const isSorted = tokenA && tokenB && tokenA.sortsBefore(tokenB)

  return tokenA && tokenB ? (
    <ToggleWrapper width="fit-content">
      <ToggleElement isActive={isSorted} fontSize="12px" onClick={handleRateToggle}>
        {isSorted ? currencyA.symbol : currencyB.symbol} {t('rate')}
      </ToggleElement>
      <ToggleElement isActive={!isSorted} fontSize="12px" onClick={handleRateToggle}>
        {isSorted ? currencyB.symbol : currencyA.symbol} {t('rate')}
      </ToggleElement>
    </ToggleWrapper>
  ) : null
}

export default function AddLiquidity({
  match: {
    params: { currencyIdA, currencyIdB, feeAmount: feeAmountFromUrl },
  },
  history,
}: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string; feeAmount?: string }>) {
  const { t } = useTranslation()

  const { account, chainId, library } = useActiveWeb3React()
  const theme = useContext(ThemeContext)
  const toggleWalletModal = useWalletModalToggle() // toggle wallet when disconnected
  const expertMode = useIsExpertMode()
  const addTransaction = useTransactionAdder()
  const positionManager = useV3NFTPositionManagerContract()

  // fee selection from url
  const feeAmount =
    feeAmountFromUrl && Object.values(FeeAmount).includes(parseFloat(feeAmountFromUrl))
      ? parseFloat(feeAmountFromUrl)
      : undefined

  const currencyA = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)

  // mint state
  const { independentField, typedValue, startPriceTypedValue } = useMintState()

  const {
    ticks,
    dependentField,
    price,
    pricesAtTicks,
    parsedAmounts,
    currencyBalances,
    position,
    noLiquidity,
    currencies,
    errorMessage,
    invalidPool,
    invalidRange,
    outOfRange,
    depositADisabled,
    depositBDisabled,
  } = useDerivedMintInfo(currencyA ?? undefined, currencyB ?? undefined, feeAmount)

  const {
    onFieldAInput,
    onFieldBInput,
    onLowerRangeInput,
    onUpperRangeInput,
    onStartPriceInput,
  } = useMintActionHandlers(noLiquidity)

  const isValid = !errorMessage

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  // txn values
  const deadline = useTransactionDeadline() // custom from users settings
  const [allowedSlippage] = useUserSlippageTolerance() // custom from users
  const fractionalizedTolerance = new Percent(JSBI.BigInt(allowedSlippage), JSBI.BigInt(10000))
  const [txHash, setTxHash] = useState<string>('')

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  }

  // get the max amounts user can add
  const maxAmounts: { [field in Field]?: TokenAmount } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmountSpend(currencyBalances[field]),
      }
    },
    {}
  )

  const atMaxAmounts: { [field in Field]?: TokenAmount } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmounts[field]?.equalTo(parsedAmounts[field] ?? '0'),
      }
    },
    {}
  )

  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallback(
    parsedAmounts[Field.CURRENCY_A],
    chainId ? NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId] : undefined
  )
  const [approvalB, approveBCallback] = useApproveCallback(
    parsedAmounts[Field.CURRENCY_B],
    chainId ? NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId] : undefined
  )

  async function onAdd() {
    if (!chainId || !library || !account) return

    if (!positionManager || !currencyA || !currencyB) {
      return
    }

    if (position && account && deadline && fractionalizedTolerance) {
      const { calldata, value } = NonfungiblePositionManager.mintCallParameters(position, {
        slippageTolerance: fractionalizedTolerance,
        recipient: account,
        deadline: deadline.toNumber(),
        useEther: currencyA === ETHER || currencyB === ETHER,
        createPool: noLiquidity,
      })

      const txn = {
        to: NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId],
        data: calldata,
        value,
      }

      setAttemptingTxn(true)

      library
        .getSigner()
        .estimateGas(txn)
        .then((estimate) => {
          const newTxn = {
            ...txn,
            gasLimit: estimate,
          }
          library
            .getSigner()
            .sendTransaction(newTxn)
            .then((response: TransactionResponse) => {
              setAttemptingTxn(false)
              addTransaction(response, {
                summary: noLiquidity
                  ? 'Create Pool + '
                  : '' + 'Add ' + !depositADisabled
                  ? parsedAmounts[Field.CURRENCY_A]?.toSignificant(3) +
                    ' ' +
                    currencies[Field.CURRENCY_A]?.symbol +
                    !outOfRange
                  : ''
                  ? ' and '
                  : '' + !depositBDisabled
                  ? parsedAmounts[Field.CURRENCY_B]?.toSignificant(3) + ' ' + currencies[Field.CURRENCY_B]?.symbol
                  : '',
              })
              setTxHash(response.hash)
              ReactGA.event({
                category: 'Liquidity',
                action: 'Add',
                label: [currencies[Field.CURRENCY_A]?.symbol, currencies[Field.CURRENCY_B]?.symbol].join('/'),
              })
            })
            .catch((error) => {
              setAttemptingTxn(false)
              // we only care if the error is something _other_ than the user rejected the tx
              if (error?.code !== 4001) {
                console.error(error)
              }
            })
        })
        .catch((error) => {
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

  const pendingText = `Supplying ${!depositADisabled ? parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) : ''} ${
    !depositADisabled ? currencies[Field.CURRENCY_A]?.symbol : ''
  } ${!outOfRange ? 'and' : ''} ${!depositBDisabled ? parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) : ''} ${
    !depositBDisabled ? currencies[Field.CURRENCY_B]?.symbol : ''
  }`

  const handleCurrencyASelect = useCallback(
    (currencyA: Currency) => {
      const newCurrencyIdA = currencyId(currencyA)
      if (newCurrencyIdA === currencyIdB) {
        history.push(`/add/${currencyIdB}/${currencyIdA}`)
      } else {
        history.push(`/add/${newCurrencyIdA}/${currencyIdB ?? 'ETH'}`)
      }
    },
    [currencyIdB, history, currencyIdA]
  )
  const handleCurrencyBSelect = useCallback(
    (currencyB: Currency) => {
      const newCurrencyIdB = currencyId(currencyB)
      if (currencyIdA === newCurrencyIdB) {
        if (currencyIdB) {
          history.push(`/add/${currencyIdB}/${newCurrencyIdB}`)
        } else {
          history.push(`/add/${newCurrencyIdB}`)
        }
      } else {
        history.push(`/add/${currencyIdA ?? 'ETH'}/${newCurrencyIdB}`)
      }
    },
    [currencyIdA, history, currencyIdB]
  )

  const handleFeePoolSelect = useCallback(
    (newFeeAmount: FeeAmount) => {
      history.push(`/add/${currencyIdA}/${currencyIdB}/${newFeeAmount}`)
    },
    [currencyIdA, currencyIdB, history]
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onFieldAInput('')
    }
    setTxHash('')
  }, [onFieldAInput, txHash])

  // const isCreate = history.location.pathname.includes('/create')

  const addIsUnsupported = useIsTransactionUnsupported(currencies?.CURRENCY_A, currencies?.CURRENCY_B)

  const clearAll = useCallback(() => {
    onFieldAInput('')
    onFieldBInput('')
    onLowerRangeInput('')
    onUpperRangeInput('')
    history.push(`/add/`)
  }, [history, onFieldAInput, onFieldBInput, onLowerRangeInput, onUpperRangeInput])

  // get value and prices at ticks
  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = ticks
  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = pricesAtTicks

  const handleRateToggle = useCallback(() => {
    if (currencyA && currencyB) {
      const currencyIdA = currencyId(currencyA)
      const currencyIdB = currencyId(currencyB)
      // reset inputs
      onLowerRangeInput('')
      onUpperRangeInput('')
      onStartPriceInput('')
      onFieldAInput('')
      onFieldBInput('')
      history.push(`/add/${currencyIdB}/${currencyIdA}/${feeAmount ?? ''}`)
    }
  }, [
    currencyA,
    currencyB,
    feeAmount,
    history,
    onFieldAInput,
    onFieldBInput,
    onLowerRangeInput,
    onStartPriceInput,
    onUpperRangeInput,
  ])

  return (
    <ScrollablePage>
      <ScrollableContent>
        <AutoRow marginBottom="20px">
          <ButtonText opacity={'0.4'} onClick={() => history.push('/pool')}>
            Pool
          </ButtonText>
          <TYPE.label margin="0 10px" opacity={'0.4'}>
            {' > '}
          </TYPE.label>
          <ButtonText opacity={showConfirm ? '0.4' : '1'} onClick={() => (showConfirm ? setShowConfirm(false) : null)}>
            Configure
          </ButtonText>
          <TYPE.label margin="0 10px" opacity={'0.4'}>
            {' > '}
          </TYPE.label>
          <ButtonText
            opacity={showConfirm ? '1' : '0.4'}
            onClick={() => (!showConfirm ? setShowConfirm(true) : null)}
            disabled={!isValid}
          >
            Review
          </ButtonText>
        </AutoRow>
        {showConfirm ? (
          <AppBody>
            <Review
              currencies={currencies}
              parsedAmounts={parsedAmounts}
              position={position}
              priceLower={priceLower}
              priceUpper={priceUpper}
              outOfRange={outOfRange}
            />
          </AppBody>
        ) : (
          <AppBody>
            <Wrapper>
              <AutoColumn gap="40px">
                <AutoColumn gap="md">
                  <RowBetween paddingBottom="20px">
                    <TYPE.label>Select a pair</TYPE.label>
                    <ButtonText onClick={clearAll}>
                      <TYPE.blue fontSize="12px">Clear All</TYPE.blue>
                    </ButtonText>
                  </RowBetween>
                  {/* <TYPE.main fontWeight={400} fontSize="14px">
                  {t('selectAPool')}
                </TYPE.main> */}
                  <RowBetween>
                    <CurrencyDropdown
                      value={formattedAmounts[Field.CURRENCY_A]}
                      onUserInput={onFieldAInput}
                      hideInput={true}
                      onMax={() => {
                        onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
                      }}
                      onCurrencySelect={handleCurrencyASelect}
                      showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
                      currency={currencies[Field.CURRENCY_A]}
                      id="add-liquidity-input-tokena"
                      showCommonBases
                    />

                    <CurrencyDropdown
                      value={formattedAmounts[Field.CURRENCY_B]}
                      hideInput={true}
                      onUserInput={onFieldBInput}
                      onCurrencySelect={handleCurrencyBSelect}
                      onMax={() => {
                        onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
                      }}
                      showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
                      currency={currencies[Field.CURRENCY_B]}
                      id="add-liquidity-input-tokenb"
                      showCommonBases
                    />
                  </RowBetween>
                </AutoColumn>

                <FeeSelector
                  disabled={!currencyB || !currencyA}
                  feeAmount={feeAmount}
                  handleFeePoolSelect={handleFeePoolSelect}
                />

                {noLiquidity && (
                  <DynamicSection disabled={!currencyA || !currencyB}>
                    <AutoColumn gap="md">
                      <BlueCard width="100%" padding="1rem">
                        You are the first to provide liquidity to this pool.
                      </BlueCard>
                      <RowBetween>
                        <TYPE.label>{t('selectStartingPrice')}</TYPE.label>
                        {currencyA && currencyB ? (
                          <RateToggle currencyA={currencyA} currencyB={currencyB} handleRateToggle={handleRateToggle} />
                        ) : null}
                      </RowBetween>
                      {/* <TYPE.main fontWeight={400} fontSize="14px">
                      {t('newPoolPrice')}
                    </TYPE.main> */}
                      <OutlineCard padding="12px">
                        <StyledInput
                          className="start-price-input"
                          value={startPriceTypedValue}
                          onUserInput={onStartPriceInput}
                        />
                      </OutlineCard>
                      <RowBetween style={{ backgroundColor: theme.bg6, padding: '12px', borderRadius: '12px' }}>
                        <TYPE.main>Starting Price</TYPE.main>
                        {price ? (
                          <TYPE.main>
                            1 {currencyA?.symbol} = {price?.toSignificant(8)} {currencyB?.symbol}
                          </TYPE.main>
                        ) : (
                          '-'
                        )}
                      </RowBetween>
                    </AutoColumn>
                  </DynamicSection>
                )}

                <DynamicSection gap="md" disabled={!feeAmount || invalidPool || (noLiquidity && !startPriceTypedValue)}>
                  <RowBetween>
                    <TYPE.label>{t('selectLiquidityRange')}</TYPE.label>
                    {currencyA && currencyB && !noLiquidity && (
                      <RateToggle currencyA={currencyA} currencyB={currencyB} handleRateToggle={handleRateToggle} />
                    )}
                  </RowBetween>
                  {/* <TYPE.main fontWeight={400} fontSize="14px">
                  {t('rangeWarning')}
                </TYPE.main> */}
                  {price && currencyA && !noLiquidity && (
                    <RowBetween style={{ backgroundColor: theme.bg6, padding: '12px', borderRadius: '12px' }}>
                      <TYPE.main>{t('currentRate', { label: currencyA.symbol })}</TYPE.main>
                      <TYPE.main>
                        {price.toSignificant(3)} {currencyB?.symbol}
                      </TYPE.main>
                    </RowBetween>
                  )}
                  <RowBetween>
                    <StepCounter
                      value={priceLower?.toSignificant(5) ?? ''}
                      onUserInput={onLowerRangeInput}
                      width="48%"
                      label={
                        priceLower && currencyA && currencyB
                          ? '1 ' + currencyA?.symbol + ' / ' + priceLower?.toSignificant(4) + ' ' + currencyB?.symbol
                          : '-'
                      }
                    />
                    <StepCounter
                      value={priceUpper?.toSignificant(5) ?? ''}
                      onUserInput={onUpperRangeInput}
                      width="48%"
                      label={
                        priceUpper && currencyA && currencyB
                          ? '1 ' + currencyA?.symbol + ' / ' + priceUpper?.toSignificant(4) + ' ' + currencyB?.symbol
                          : '-'
                      }
                    />
                  </RowBetween>

                  {outOfRange ? (
                    <YellowCard padding="8px 12px" borderRadius="12px">
                      <RowBetween>
                        <AlertTriangle stroke={theme.yellow3} size="16px" />
                        <TYPE.yellow ml="12px" fontSize="12px">
                          {t('inactiveRangeWarning')}
                        </TYPE.yellow>
                      </RowBetween>
                    </YellowCard>
                  ) : null}

                  {invalidRange ? (
                    <YellowCard padding="8px 12px" borderRadius="12px">
                      <RowBetween>
                        <AlertTriangle stroke={theme.yellow3} size="16px" />
                        <TYPE.yellow ml="12px" fontSize="12px">
                          {t('invalidRangeWarning')}
                        </TYPE.yellow>
                      </RowBetween>
                    </YellowCard>
                  ) : null}
                </DynamicSection>

                <DynamicSection
                  disabled={tickLower === undefined || tickUpper === undefined || invalidPool || invalidRange}
                >
                  <AutoColumn gap="md">
                    <TYPE.label>{t('depositAmounts')}</TYPE.label>
                    {/* <TYPE.main fontWeight={400} fontSize="14px">
                    {t('chooseLiquidityAmount')}
                  </TYPE.main> */}
                    <CurrencyInputPanel
                      value={formattedAmounts[Field.CURRENCY_A]}
                      onUserInput={onFieldAInput}
                      disableCurrencySelect={true}
                      onMax={() => {
                        onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
                      }}
                      onCurrencySelect={handleCurrencyASelect}
                      showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
                      currency={currencies[Field.CURRENCY_A]}
                      id="add-liquidity-input-tokena"
                      showCommonBases
                      locked={depositADisabled}
                    />
                    <ColumnCenter>
                      <Link2 stroke={theme.text2} size={'24px'} />
                    </ColumnCenter>
                    <CurrencyInputPanel
                      value={formattedAmounts[Field.CURRENCY_B]}
                      disableCurrencySelect={true}
                      onUserInput={onFieldBInput}
                      onCurrencySelect={handleCurrencyBSelect}
                      onMax={() => {
                        onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
                      }}
                      showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
                      currency={currencies[Field.CURRENCY_B]}
                      id="add-liquidity-input-tokenb"
                      showCommonBases
                      locked={depositBDisabled}
                    />
                  </AutoColumn>
                </DynamicSection>
              </AutoColumn>
            </Wrapper>
          </AppBody>
        )}
      </ScrollableContent>
      {addIsUnsupported && (
        <UnsupportedCurrencyFooter
          show={addIsUnsupported}
          currencies={[currencies.CURRENCY_A, currencies.CURRENCY_B]}
        />
      )}
      <FixedPreview>
        {attemptingTxn ? (
          <ConfirmationPendingContent onDismiss={handleDismissConfirmation} pendingText={pendingText} inline={true} />
        ) : txHash && chainId ? (
          <TransactionSubmittedContent
            chainId={chainId}
            hash={txHash}
            onDismiss={handleDismissConfirmation}
            inline={true}
          />
        ) : (
          <AutoColumn gap="md">
            <TYPE.label fontSize="16px">{showConfirm ? 'Review and submit' : 'Configure Position'}</TYPE.label>
            <TYPE.main fontWeight={400} fontSize="14px">
              Learn more about Uniswap V3 liquidity pools.
            </TYPE.main>
            {showConfirm ? (
              <div>
                {addIsUnsupported ? (
                  <ButtonPrimary disabled={true} borderRadius="12px" padding={'12px'}>
                    <TYPE.main mb="4px">{t('unsupportedAsset')}</TYPE.main>
                  </ButtonPrimary>
                ) : !account ? (
                  <ButtonLight onClick={toggleWalletModal} borderRadius="12px" padding={'12px'}>
                    {t('connectWallet')}
                  </ButtonLight>
                ) : (
                  <AutoColumn gap={'md'}>
                    {(approvalA === ApprovalState.NOT_APPROVED ||
                      approvalA === ApprovalState.PENDING ||
                      approvalB === ApprovalState.NOT_APPROVED ||
                      approvalB === ApprovalState.PENDING) &&
                      isValid && (
                        <RowBetween>
                          {approvalA !== ApprovalState.APPROVED && (
                            <ButtonPrimary
                              borderRadius="12px"
                              padding={'12px'}
                              onClick={approveACallback}
                              disabled={approvalA === ApprovalState.PENDING}
                              width={approvalB !== ApprovalState.APPROVED ? '48%' : '100%'}
                            >
                              {approvalA === ApprovalState.PENDING ? (
                                <Dots>Approving {currencies[Field.CURRENCY_A]?.symbol}</Dots>
                              ) : (
                                'Approve ' + currencies[Field.CURRENCY_A]?.symbol
                              )}
                            </ButtonPrimary>
                          )}
                          {approvalB !== ApprovalState.APPROVED && (
                            <ButtonPrimary
                              borderRadius="12px"
                              padding={'12px'}
                              onClick={approveBCallback}
                              disabled={approvalB === ApprovalState.PENDING}
                              width={approvalA !== ApprovalState.APPROVED ? '48%' : '100%'}
                            >
                              {approvalB === ApprovalState.PENDING ? (
                                <Dots>Approving {currencies[Field.CURRENCY_B]?.symbol}</Dots>
                              ) : (
                                'Approve ' + currencies[Field.CURRENCY_B]?.symbol
                              )}
                            </ButtonPrimary>
                          )}
                        </RowBetween>
                      )}
                    <ButtonError
                      onClick={() => {
                        onAdd()
                      }}
                      style={{ borderRadius: '12px' }}
                      padding={'12px'}
                      disabled={
                        !isValid ||
                        (approvalA !== ApprovalState.APPROVED && !depositADisabled) ||
                        (approvalB !== ApprovalState.APPROVED && !depositBDisabled)
                      }
                      error={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]}
                    >
                      <Text fontWeight={500}>
                        {errorMessage ? errorMessage : noLiquidity ? 'Create Pool and Add' : 'Add'}
                      </Text>
                    </ButtonError>
                  </AutoColumn>
                )}
              </div>
            ) : (
              <ButtonError
                onClick={() => {
                  expertMode ? onAdd() : setShowConfirm(true)
                }}
                style={{ borderRadius: '12px' }}
                padding={'12px'}
                disabled={!isValid}
                error={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]}
              >
                <Text fontWeight={500}>{errorMessage ?? 'Review'}</Text>
              </ButtonError>
            )}
          </AutoColumn>
        )}
      </FixedPreview>
    </ScrollablePage>
  )
}
