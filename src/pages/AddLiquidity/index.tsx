import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { Currency, ETHER, TokenAmount } from '@uniswap/sdk-core'
import React, { useCallback, useContext, useState } from 'react'
import { Link2, AlertTriangle, LifeBuoy, Circle } from 'react-feather'
import ReactGA from 'react-ga'
import { RouteComponentProps } from 'react-router-dom'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { ButtonError, ButtonLight, ButtonPrimary, ButtonRadioChecked, ButtonText } from '../../components/Button'
import { YellowCard } from '../../components/Card'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { RowBetween, RowFixed, AutoRow } from '../../components/Row'
import ConfirmContent from './ConfirmContent'
import { ROUTER_ADDRESS } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
import { useCurrency } from '../../hooks/Tokens'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import useTransactionDeadline from '../../hooks/useTransactionDeadline'
import { useWalletModalToggle } from '../../state/application/hooks'
import { Field, Bound, RangeType } from '../../state/mint/actions'
import { useDerivedMintInfo, useMintActionHandlers, useMintState } from '../../state/mint/hooks'

import { useTransactionAdder } from '../../state/transactions/hooks'
import { useIsExpertMode, useUserSlippageTolerance } from '../../state/user/hooks'
import { TYPE } from '../../theme'
import { calculateGasMargin, calculateSlippageAmount, getRouterContract } from '../../utils'
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
  ScrollablePage,
  ScrollableContent,
  FixedPreview,
  PreviewCard,
} from './styled'
import { useTranslation } from 'react-i18next'
import CurrencyLogo from 'components/CurrencyLogo'
import QuestionHelper from 'components/QuestionHelper'

export default function AddLiquidity({
  match: {
    params: { currencyIdA, currencyIdB },
  },
  history,
}: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string }>) {
  const { t } = useTranslation()

  const { account, chainId, library } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  const currencyA = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)

  // const oneCurrencyIsWETH = Boolean(
  //   chainId &&
  //     ((currencyA && currencyEquals(currencyA, WETH9[chainId])) ||
  //       (currencyB && currencyEquals(currencyB, WETH9[chainId])))
  // )

  const toggleWalletModal = useWalletModalToggle() // toggle wallet when disconnected

  const expertMode = useIsExpertMode()

  // mint state
  const { independentField, typedValue, otherTypedValue, rangeType } = useMintState()
  const {
    dependentField,
    currencies,
    pair,
    // pairState,
    currencyBalances,
    parsedAmounts,
    ticks,
    price,
    noLiquidity,
    poolTokenPercentage,
    error,
  } = useDerivedMintInfo(currencyA ?? undefined, currencyB ?? undefined)

  const { onFieldAInput, onFieldBInput, onLowerRangeInput, onUpperRangeInput } = useMintActionHandlers(noLiquidity)

  const isValid = !error

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  // txn values
  const deadline = useTransactionDeadline() // custom from users settings
  const [allowedSlippage] = useUserSlippageTolerance() // custom from users
  const [txHash, setTxHash] = useState<string>('')

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: noLiquidity ? otherTypedValue : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
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
  const [approvalA, approveACallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_A], ROUTER_ADDRESS)
  const [approvalB, approveBCallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_B], ROUTER_ADDRESS)

  const addTransaction = useTransactionAdder()

  async function onAdd() {
    if (!chainId || !library || !account) return
    const router = getRouterContract(chainId, library, account)

    const { [Field.CURRENCY_A]: parsedAmountA, [Field.CURRENCY_B]: parsedAmountB } = parsedAmounts
    if (!parsedAmountA || !parsedAmountB || !currencyA || !currencyB || !deadline) {
      return
    }

    const amountsMin = {
      [Field.CURRENCY_A]: calculateSlippageAmount(parsedAmountA, noLiquidity ? 0 : allowedSlippage)[0],
      [Field.CURRENCY_B]: calculateSlippageAmount(parsedAmountB, noLiquidity ? 0 : allowedSlippage)[0],
    }

    let estimate,
      method: (...args: any) => Promise<TransactionResponse>,
      args: Array<string | string[] | number>,
      value: BigNumber | null
    if (currencyA === ETHER || currencyB === ETHER) {
      const tokenBIsETH = currencyB === ETHER
      estimate = router.estimateGas.addLiquidityETH
      method = router.addLiquidityETH
      args = [
        wrappedCurrency(tokenBIsETH ? currencyA : currencyB, chainId)?.address ?? '', // token
        (tokenBIsETH ? parsedAmountA : parsedAmountB).raw.toString(), // token desired
        amountsMin[tokenBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(), // token min
        amountsMin[tokenBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(), // eth min
        account,
        deadline.toHexString(),
      ]
      value = BigNumber.from((tokenBIsETH ? parsedAmountB : parsedAmountA).raw.toString())
    } else {
      estimate = router.estimateGas.addLiquidity
      method = router.addLiquidity
      args = [
        wrappedCurrency(currencyA, chainId)?.address ?? '',
        wrappedCurrency(currencyB, chainId)?.address ?? '',
        parsedAmountA.raw.toString(),
        parsedAmountB.raw.toString(),
        amountsMin[Field.CURRENCY_A].toString(),
        amountsMin[Field.CURRENCY_B].toString(),
        account,
        deadline.toHexString(),
      ]
      value = null
    }

    setAttemptingTxn(true)
    await estimate(...args, value ? { value } : {})
      .then((estimatedGasLimit) =>
        method(...args, {
          ...(value ? { value } : {}),
          gasLimit: calculateGasMargin(estimatedGasLimit),
        }).then((response) => {
          setAttemptingTxn(false)

          addTransaction(response, {
            summary:
              'Add ' +
              parsedAmounts[Field.CURRENCY_A]?.toSignificant(3) +
              ' ' +
              currencies[Field.CURRENCY_A]?.symbol +
              ' and ' +
              parsedAmounts[Field.CURRENCY_B]?.toSignificant(3) +
              ' ' +
              currencies[Field.CURRENCY_B]?.symbol,
          })

          setTxHash(response.hash)

          ReactGA.event({
            category: 'Liquidity',
            action: 'Add',
            label: [currencies[Field.CURRENCY_A]?.symbol, currencies[Field.CURRENCY_B]?.symbol].join('/'),
          })
        })
      )
      .catch((error) => {
        setAttemptingTxn(false)
        // we only care if the error is something _other_ than the user rejected the tx
        if (error?.code !== 4001) {
          console.error(error)
        }
      })
  }

  const modalContent = () => {
    return (
      <ConfirmContent
        price={price}
        currencies={currencies}
        parsedAmounts={parsedAmounts}
        noLiquidity={noLiquidity}
        onAdd={onAdd}
        poolTokenPercentage={poolTokenPercentage}
      />
    )
  }

  const pendingText = `Supplying ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)} ${
    currencies[Field.CURRENCY_A]?.symbol
  } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)} ${currencies[Field.CURRENCY_B]?.symbol}`

  const handleCurrencyASelect = useCallback(
    (currencyA: Currency) => {
      const newCurrencyIdA = currencyId(currencyA)
      if (newCurrencyIdA === currencyIdB) {
        history.push(`/add/${currencyIdB}/${currencyIdA}`)
      } else {
        history.push(`/add/${newCurrencyIdA}/${currencyIdB}`)
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
        history.push(`/add/${currencyIdA ? currencyIdA : 'ETH'}/${newCurrencyIdB}`)
      }
    },
    [currencyIdA, history, currencyIdB]
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

  /**
   *
   * dummy values for v3 prototype
   *
   */
  const [feeLevel, setFeeLevel] = useState<number>(4)

  const clearAll = useCallback(() => {
    onFieldAInput('')
    onFieldBInput('')
    onLowerRangeInput('')
    onUpperRangeInput('')
    history.push(`/add/`)
  }, [history, onFieldAInput, onFieldBInput, onLowerRangeInput, onUpperRangeInput])

  const currentTick = ticks[Bound.CURRENT]
  const lowerTick = ticks[Bound.LOWER]
  const upperTick = ticks[Bound.UPPER]

  const [rateCurrencyBase, setRateCurrencyBase] = useState<Currency | null | undefined>(currencyA)

  const invalidRange = lowerTick && upperTick && lowerTick.rate > upperTick.rate
  const outOfRange =
    currentTick &&
    lowerTick &&
    upperTick &&
    !invalidRange &&
    (lowerTick.rate > currentTick.rate || upperTick.rate < currentTick.rate)

  return (
    <ScrollablePage>
      <TransactionConfirmationModal
        isOpen={showConfirm}
        onDismiss={handleDismissConfirmation}
        attemptingTxn={attemptingTxn}
        hash={txHash}
        content={() => (
          <ConfirmationModalContent
            title={'Review Position'}
            onDismiss={handleDismissConfirmation}
            topContent={modalContent}
          />
        )}
        pendingText={pendingText}
        currencyToAdd={pair?.liquidityToken}
      />
      <ScrollableContent>
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
                <TYPE.main fontWeight={400} fontSize="14px">
                  {t('selectAPool')}
                </TYPE.main>
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
              <AutoColumn gap="16px">
                <DynamicSection gap="md" disabled={!currencyB || !currencyA}>
                  <TYPE.label>{t('selectPool')}</TYPE.label>
                  <TYPE.main fontWeight={400} fontSize="14px">
                    {t('poolType')}
                  </TYPE.main>
                  <RowBetween>
                    <ButtonRadioChecked width="32%" active={feeLevel === 0} onClick={() => setFeeLevel(0)}>
                      <TYPE.label>0.1% {t('fee')}</TYPE.label>
                    </ButtonRadioChecked>
                    <ButtonRadioChecked active={feeLevel === 1} width="32%" onClick={() => setFeeLevel(1)}>
                      <TYPE.label>0.3% {t('fee')}</TYPE.label>
                    </ButtonRadioChecked>
                    <ButtonRadioChecked width="32%" active={feeLevel === 2} onClick={() => setFeeLevel(2)}>
                      <TYPE.label>0.5% {t('fee')}</TYPE.label>
                    </ButtonRadioChecked>
                  </RowBetween>
                </DynamicSection>
              </AutoColumn>

              <DynamicSection gap="md" disabled={feeLevel >= 4}>
                <RowBetween>
                  <TYPE.label>{t('selectLiquidityRange')}</TYPE.label>
                  {currencyA && currencyB && (
                    <ToggleWrapper width="fit-content">
                      <ToggleElement
                        isActive={rateCurrencyBase === currencyA}
                        fontSize="12px"
                        onClick={() => setRateCurrencyBase(rateCurrencyBase === currencyB ? currencyA : currencyB)}
                      >
                        {currencyA.symbol} {t('rate')}
                      </ToggleElement>
                      <ToggleElement
                        fontSize="12px"
                        isActive={currencyB === rateCurrencyBase}
                        onClick={() => setRateCurrencyBase(rateCurrencyBase === currencyB ? currencyA : currencyB)}
                      >
                        {currencyB.symbol} Rate
                      </ToggleElement>
                    </ToggleWrapper>
                  )}
                </RowBetween>
                <TYPE.main fontWeight={400} fontSize="14px">
                  {t('rangeWarning')}
                </TYPE.main>
                {price && rateCurrencyBase && (
                  <RowBetween style={{ backgroundColor: theme.bg3, padding: '8px', borderRadius: '12px' }}>
                    <TYPE.main>{t('currentRate', { label: rateCurrencyBase.symbol })}</TYPE.main>
                    <TYPE.main>
                      {rateCurrencyBase === currencyA ? price.toSignificant(3) : price.invert().toSignificant(3)}{' '}
                      {rateCurrencyBase === currencyB ? currencyA?.symbol : currencyB?.symbol}
                    </TYPE.main>
                  </RowBetween>
                )}

                <RowBetween>
                  <StepCounter
                    value={lowerTick?.rate?.toString() ?? ''}
                    onUserInput={onLowerRangeInput}
                    usePercent={rangeType === RangeType.PERCENT}
                    prependSymbol={rangeType === RangeType.PERCENT ? '-' : undefined}
                  />
                  <Link2 style={{ margin: '0 10px' }} size={40} />
                  <StepCounter
                    value={upperTick?.rate?.toString() ?? ''}
                    onUserInput={onUpperRangeInput}
                    usePercent={rangeType === RangeType.PERCENT}
                    prependSymbol={rangeType === RangeType.PERCENT ? '+' : undefined}
                  />
                </RowBetween>

                {outOfRange && (
                  <YellowCard>
                    <RowBetween>
                      <AlertTriangle stroke={theme.yellow3} size="24px" />
                      <TYPE.yellow ml="12px" fontSize="12px">
                        {t('inactiveRangeWarning')}
                      </TYPE.yellow>
                    </RowBetween>
                  </YellowCard>
                )}

                {invalidRange && (
                  <YellowCard>
                    <RowBetween>
                      <AlertTriangle stroke={theme.yellow3} size="24px" />
                      <TYPE.yellow ml="12px" fontSize="12px">
                        {t('invalidRangeWarning')}
                      </TYPE.yellow>
                    </RowBetween>
                  </YellowCard>
                )}
              </DynamicSection>

              <DynamicSection disabled={!lowerTick || !upperTick}>
                <AutoColumn gap="md">
                  <TYPE.label>{t('inputTokens')}</TYPE.label>
                  <TYPE.main fontWeight={400} fontSize="14px">
                    {t('chooseLiquidityAmount')}
                  </TYPE.main>
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
                  />
                </AutoColumn>
              </DynamicSection>
            </AutoColumn>
          </Wrapper>
        </AppBody>
      </ScrollableContent>
      {addIsUnsupported && (
        <UnsupportedCurrencyFooter
          show={addIsUnsupported}
          currencies={[currencies.CURRENCY_A, currencies.CURRENCY_B]}
        />
      )}
      <FixedPreview>
        <AutoColumn gap="md">
          <TYPE.main fontSize="12px">Position Preview</TYPE.main>
          <PreviewCard>
            {!currencyA || !currencyB ? (
              <RowBetween>
                <TYPE.label>Select a pair to begin</TYPE.label>
                <QuestionHelper text="Select a pair to begin" size={20} />
              </RowBetween>
            ) : (
              <AutoRow gap="4px">
                <CurrencyLogo currency={currencyA} size={'20px'} />
                <TYPE.label ml="4px">{currencyA.symbol}</TYPE.label>
                <TYPE.main>/</TYPE.main>
                <CurrencyLogo currency={currencyB} size={'20px'} />
                <TYPE.label ml="4px">{currencyB.symbol}</TYPE.label>
              </AutoRow>
            )}
          </PreviewCard>
          <PreviewCard disabled={!currencyA || !currencyB}>
            <RowBetween>
              <TYPE.label>
                {feeLevel >= 4
                  ? t('selectPool')
                  : `${feeLevel === 0 ? '0.1' : feeLevel === 1 ? '0.3' : '0.5'}% fee pool`}
              </TYPE.label>
              <LifeBuoy size="20px" />
            </RowBetween>
          </PreviewCard>
          <PreviewCard disabled={feeLevel >= 4}>
            {!lowerTick || !upperTick ? (
              <RowBetween>
                <TYPE.label>{t('selectPriceLimits')}</TYPE.label>
                <Circle size="20px" />
              </RowBetween>
            ) : (
              currencyA &&
              currencyB && (
                <AutoColumn gap="sm" style={{ width: '100%' }}>
                  <ToggleWrapper width="100%">
                    <ToggleElement
                      isActive={rateCurrencyBase === currencyA}
                      fontSize="12px"
                      onClick={() => setRateCurrencyBase(rateCurrencyBase === currencyB ? currencyA : currencyB)}
                    >
                      {currencyA.symbol} {t('rate')}
                    </ToggleElement>
                    <ToggleElement
                      fontSize="12px"
                      isActive={currencyB === rateCurrencyBase}
                      onClick={() => setRateCurrencyBase(rateCurrencyBase === currencyB ? currencyA : currencyB)}
                    >
                      {currencyB.symbol} Rate
                    </ToggleElement>
                  </ToggleWrapper>
                  <RowBetween padding="0 32px">
                    <TYPE.label>{lowerTick.rate}</TYPE.label>
                    <TYPE.main>⟷</TYPE.main>
                    <TYPE.label>{upperTick.rate}</TYPE.label>
                  </RowBetween>
                </AutoColumn>
              )
            )}
          </PreviewCard>
          <PreviewCard disabled={!lowerTick || !upperTick}>
            {!formattedAmounts[Field.CURRENCY_A] || !currencyA || !currencyB ? (
              <RowBetween>
                <TYPE.label>{t('inputTokenDynamic', { label: currencyA ? currencyA.symbol : 'Token' })}</TYPE.label>
                <Circle size="20px" />
              </RowBetween>
            ) : (
              <RowBetween>
                <RowFixed>
                  <CurrencyLogo currency={currencyA} />
                  <TYPE.label ml="8px">{formattedAmounts[Field.CURRENCY_A]}</TYPE.label>
                  <TYPE.label ml="8px">{currencyA.symbol}</TYPE.label>
                </RowFixed>
                <TYPE.main>50%</TYPE.main>
              </RowBetween>
            )}
          </PreviewCard>
          <PreviewCard disabled={!lowerTick || !upperTick}>
            {!formattedAmounts[Field.CURRENCY_B] || !currencyA || !currencyB ? (
              <RowBetween>
                <TYPE.label>{t('inputTokenDynamic', { label: currencyB ? currencyB.symbol : 'Token' })}</TYPE.label>
                <Circle size="20px" />
              </RowBetween>
            ) : (
              <RowBetween>
                <RowFixed>
                  <CurrencyLogo currency={currencyB} />
                  <TYPE.label ml="8px">{formattedAmounts[Field.CURRENCY_B]}</TYPE.label>
                  <TYPE.label ml="8px">{currencyB.symbol}</TYPE.label>
                </RowFixed>
                <TYPE.main>50%</TYPE.main>
              </RowBetween>
            )}
          </PreviewCard>
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
                  expertMode ? onAdd() : setShowConfirm(true)
                }}
                style={{ borderRadius: '12px' }}
                padding={'12px'}
                disabled={!isValid || approvalA !== ApprovalState.APPROVED || approvalB !== ApprovalState.APPROVED}
                error={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]}
              >
                <Text fontWeight={500}>{error ?? 'Next'}</Text>
              </ButtonError>
            </AutoColumn>
          )}
        </AutoColumn>
      </FixedPreview>
    </ScrollablePage>
  )
}
