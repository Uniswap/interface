import { TransactionResponse } from '@ethersproject/providers'
import { Currency, TokenAmount, Percent, ETHER } from '@uniswap/sdk-core'
import React, { useCallback, useContext, useMemo, useState } from 'react'
import { WETH9 } from '@uniswap/sdk-core'
import { Link2, AlertTriangle, ChevronRight } from 'react-feather'
import ReactGA from 'react-ga'
import { useV3NFTPositionManagerContract } from '../../hooks/useContract'
import { RouteComponentProps } from 'react-router-dom'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { ButtonError, ButtonLight, ButtonPrimary, ButtonText } from '../../components/Button'
import { YellowCard, OutlineCard, BlueCard } from '../../components/Card'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import { TransactionSubmittedContent, ConfirmationPendingContent } from '../../components/TransactionConfirmationModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { AutoRow, RowBetween, RowFixed } from '../../components/Row'
import { useIsSwapUnsupported } from '../../hooks/useIsSwapUnsupported'
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
import AppBody from '../AppBody'
import { Dots } from '../Pool/styleds'
import { currencyId } from '../../utils/currencyId'
import UnsupportedCurrencyFooter from 'components/swap/UnsupportedCurrencyFooter'
import {
  DynamicSection,
  CurrencyDropdown,
  ScrollableContent,
  StyledInput,
  FixedPreview,
  Wrapper,
  RangeBadge,
  ScrollablePage,
} from './styled'
import { useTranslation } from 'react-i18next'
import { useMintState, useMintActionHandlers, useDerivedMintInfo, useRangeHopCallbacks } from 'state/mint/hooks'
import { FeeAmount, NonfungiblePositionManager } from '@uniswap/v3-sdk'
import { NONFUNGIBLE_POSITION_MANAGER_ADDRESSES } from 'constants/v3'
import JSBI from 'jsbi'
import { useV3PositionFromTokenId } from 'hooks/useV3Positions'
import { useDerivedPositionInfo } from 'hooks/useDerivedPositionInfo'
import { PositionPreview } from 'components/PositionPreview'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import FeeSelector from 'components/FeeSelector'
import RangeSelector from 'components/RangeSelector'
import RateToggle from 'components/RateToggle'
import { BigNumber } from '@ethersproject/bignumber'

export default function AddLiquidity({
  match: {
    params: { currencyIdA, currencyIdB, feeAmount: feeAmountFromUrl, tokenId },
  },
  history,
}: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string; feeAmount?: string; tokenId?: string }>) {
  const { t } = useTranslation()

  const { account, chainId, library } = useActiveWeb3React()
  const theme = useContext(ThemeContext)
  const toggleWalletModal = useWalletModalToggle() // toggle wallet when disconnected
  const expertMode = useIsExpertMode()
  const addTransaction = useTransactionAdder()
  const positionManager = useV3NFTPositionManagerContract()

  // check for existing position if tokenId in url
  const { position: existingPositionDetails, loading: positionLoading } = useV3PositionFromTokenId(
    tokenId ? BigNumber.from(tokenId) : undefined
  )
  const hasExistingPosition = !!existingPositionDetails && !positionLoading
  const { position: existingPosition } = useDerivedPositionInfo(existingPositionDetails)

  // fee selection from url
  const feeAmount: FeeAmount | undefined =
    feeAmountFromUrl && Object.values(FeeAmount).includes(parseFloat(feeAmountFromUrl))
      ? parseFloat(feeAmountFromUrl)
      : undefined

  const currencyA = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)

  // keep track for UI display purposes of user selected base currency
  const [baseCurrency, setBaseCurrency] = useState(currencyA)
  const quoteCurrency = useMemo(() => (baseCurrency === currencyA ? currencyB : currencyA), [
    baseCurrency,
    currencyA,
    currencyB,
  ])

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
    invertPrice,
  } = useDerivedMintInfo(
    currencyA ?? undefined,
    currencyB ?? undefined,
    feeAmount,
    baseCurrency ?? undefined,
    existingPosition
  )

  const {
    onFieldAInput,
    onFieldBInput,
    onLeftRangeInput,
    onRightRangeInput,
    onStartPriceInput,
  } = useMintActionHandlers(noLiquidity)

  const isValid = !errorMessage && !invalidRange

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
      const { calldata, value } =
        hasExistingPosition && tokenId
          ? NonfungiblePositionManager.increaseLiquidityCallParameters(position, {
              tokenId: tokenId,
              slippageTolerance: fractionalizedTolerance,
              deadline: deadline.toNumber(),
              useEther: currencyA === ETHER || currencyB === ETHER,
            })
          : NonfungiblePositionManager.mintCallParameters(position, {
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
                  ? `Create pool and add ${currencyA?.symbol}/${currencyB?.symbol} V3 liquidity`
                  : `Add ${currencyA?.symbol}/${currencyB?.symbol} V3 liquidity`,
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
      //switch order if same selected
      if (newCurrencyIdA === currencyIdB) {
        history.push(`/add/${currencyIdB}/${currencyIdA}`)
      } else if (chainId && newCurrencyIdA === WETH9[chainId]?.address && currencyIdB === 'ETH') {
        // prevent eth / weth
        history.push(`/add/${newCurrencyIdA}`)
      } else {
        history.push(`/add/${newCurrencyIdA}/${currencyIdB ?? 'ETH'}`)
      }
    },
    [currencyIdB, chainId, history, currencyIdA]
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
      } else if (chainId && newCurrencyIdB === WETH9[chainId]?.address && currencyIdA === 'ETH') {
        // prevent eth / weth
        history.push(`/add/${newCurrencyIdB}`)
      } else {
        history.push(`/add/${currencyIdA ?? 'ETH'}/${newCurrencyIdB}`)
      }
    },
    [currencyIdA, chainId, currencyIdB, history]
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

  const addIsUnsupported = useIsSwapUnsupported(currencies?.CURRENCY_A, currencies?.CURRENCY_B)

  const clearAll = useCallback(() => {
    onFieldAInput('')
    onFieldBInput('')
    onLeftRangeInput('')
    onRightRangeInput('')
    history.push(`/add/`)
  }, [history, onFieldAInput, onFieldBInput, onLeftRangeInput, onRightRangeInput])

  // get value and prices at ticks
  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = ticks
  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = pricesAtTicks

  const { getDecrementLower, getIncrementLower, getDecrementUpper, getIncrementUpper } = useRangeHopCallbacks(
    baseCurrency ?? undefined,
    quoteCurrency ?? undefined,
    feeAmount,
    tickLower,
    tickUpper
  )

  return (
    <ScrollablePage>
      <ScrollableContent>
        <AutoRow gap="2px" marginBottom="20px">
          <ButtonText opacity={'0.4'} onClick={() => history.push('/pool')}>
            Pool
          </ButtonText>
          <ChevronRight size={16} opacity={'0.4'} />
          <ButtonText opacity={showConfirm ? '0.4' : '1'} onClick={() => (showConfirm ? setShowConfirm(false) : null)}>
            Configure
          </ButtonText>
          <ChevronRight size={16} opacity={'0.4'} />
          <ButtonText
            opacity={showConfirm ? '1' : '0.1'}
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
              existingPosition={existingPosition}
              priceLower={priceLower}
              priceUpper={priceUpper}
              outOfRange={outOfRange}
            />
          </AppBody>
        ) : (
          <AppBody>
            <Wrapper>
              <AutoColumn gap="lg">
                {!hasExistingPosition ? (
                  <>
                    <AutoColumn gap="md">
                      <RowBetween paddingBottom="20px">
                        <TYPE.label>Select a pair</TYPE.label>
                        <ButtonText onClick={clearAll}>
                          <TYPE.blue fontSize="12px">Clear All</TYPE.blue>
                        </ButtonText>
                      </RowBetween>

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
                    </AutoColumn>{' '}
                  </>
                ) : (
                  <RowBetween>
                    <RowFixed>
                      <DoubleCurrencyLogo
                        currency0={currencyA ?? undefined}
                        currency1={currencyB ?? undefined}
                        size={24}
                        margin={true}
                      />
                      <TYPE.label ml="10px" fontSize="24px">
                        {currencyA?.symbol} / {currencyB?.symbol}
                      </TYPE.label>
                    </RowFixed>
                    <RangeBadge inRange={!outOfRange}>{outOfRange ? 'Out of range' : 'In Range'}</RangeBadge>
                  </RowBetween>
                )}

                {hasExistingPosition && existingPosition ? (
                  <PositionPreview position={existingPosition} title={'Current Position'} />
                ) : (
                  <>
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
                            {baseCurrency && quoteCurrency ? (
                              <RateToggle
                                currencyA={baseCurrency}
                                currencyB={quoteCurrency}
                                handleRateToggle={() => {
                                  onLeftRangeInput('')
                                  onRightRangeInput('')
                                  setBaseCurrency(quoteCurrency)
                                }}
                              />
                            ) : null}
                          </RowBetween>

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
                                1 {currencyA?.symbol} ={' '}
                                {invertPrice ? price?.invert()?.toSignificant(8) : price?.toSignificant(8)}{' '}
                                {currencyB?.symbol}
                              </TYPE.main>
                            ) : (
                              '-'
                            )}
                          </RowBetween>
                        </AutoColumn>
                      </DynamicSection>
                    )}

                    <DynamicSection
                      gap="md"
                      disabled={!feeAmount || invalidPool || (noLiquidity && !startPriceTypedValue)}
                    >
                      <RowBetween>
                        <TYPE.label>{t('selectLiquidityRange')}</TYPE.label>
                        {baseCurrency && quoteCurrency ? (
                          <RateToggle
                            currencyA={baseCurrency}
                            currencyB={quoteCurrency}
                            handleRateToggle={() => {
                              onLeftRangeInput('')
                              onRightRangeInput('')
                              setBaseCurrency(quoteCurrency)
                            }}
                          />
                        ) : null}
                      </RowBetween>

                      {price && baseCurrency && quoteCurrency && !noLiquidity && (
                        <RowBetween style={{ backgroundColor: theme.bg6, padding: '12px', borderRadius: '12px' }}>
                          <TYPE.main>Current Price</TYPE.main>
                          <TYPE.main>
                            {invertPrice ? price.invert().toSignificant(3) : price.toSignificant(3)}{' '}
                            {quoteCurrency?.symbol} = 1 {baseCurrency.symbol}
                          </TYPE.main>
                        </RowBetween>
                      )}

                      <RangeSelector
                        priceLower={priceLower}
                        priceUpper={priceUpper}
                        getDecrementLower={getDecrementLower}
                        getIncrementLower={getIncrementLower}
                        getDecrementUpper={getDecrementUpper}
                        getIncrementUpper={getIncrementUpper}
                        onLeftRangeInput={onLeftRangeInput}
                        onRightRangeInput={onRightRangeInput}
                        currencyA={baseCurrency}
                        currencyB={quoteCurrency}
                        feeAmount={feeAmount}
                      />

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
                  </>
                )}

                <DynamicSection
                  disabled={tickLower === undefined || tickUpper === undefined || invalidPool || invalidRange}
                >
                  <AutoColumn gap="md">
                    <TYPE.label>{hasExistingPosition ? 'Add more liquidity' : t('depositAmounts')}</TYPE.label>

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
            {noLiquidity && (
              <BlueCard width="100%" padding="1rem">
                You are the first to provide liquidity to this pool.
              </BlueCard>
            )}
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
